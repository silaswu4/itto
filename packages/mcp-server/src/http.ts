import express from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Serve an McpServer over Streamable HTTP so Hermes (a separate process,
 * possibly a separate machine) can reach it at http://host:port/mcp.
 *
 * One transport per session; sessions are keyed by the Mcp-Session-Id header.
 */
export async function serveHttp(
  server: McpServer,
  opts: { host: string; port: number },
): Promise<{ close: () => Promise<void> }> {
  const app = express();
  app.use(express.json());

  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.all("/mcp", async (req, res) => {
    const sessionId = req.header("mcp-session-id");
    let transport = sessionId ? transports.get(sessionId) : undefined;

    if (!transport) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => transports.set(id, transport!),
      });
      transport.onclose = () => {
        if (transport!.sessionId) transports.delete(transport!.sessionId);
      };
      await server.connect(transport);
    }

    await transport.handleRequest(req, res, req.body);
  });

  app.get("/health", (_req, res) => res.json({ ok: true, name: "itto-mcp" }));

  return new Promise((resolve) => {
    const httpServer = app.listen(opts.port, opts.host, () => {
      // eslint-disable-next-line no-console
      console.log(`[mcp] listening on http://${opts.host}:${opts.port}/mcp`);
      resolve({
        close: () =>
          new Promise<void>((r) => httpServer.close(() => r())),
      });
    });
  });
}
