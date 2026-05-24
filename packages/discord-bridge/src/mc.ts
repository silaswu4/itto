import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { GameState } from "@itto/shared";
import { logger } from "./log.js";

const log = logger("mc");

/**
 * MCP client to the itto-mc server (the running Minecraft bot). Used two ways:
 *   - execute the ElevenLabs agent's tool calls (say / run_skill) — control
 *   - pull the live world snapshot to push as conversation context
 */
export class McClient {
  private client: Client | null = null;

  constructor(private readonly url: string) {}

  async connect(): Promise<void> {
    const client = new Client({ name: "itto-voice", version: "0.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(this.url));
    await client.connect(transport);
    this.client = client;
    log.info(`connected to itto-mc at ${this.url}`);
  }

  private ensure(): Client {
    if (!this.client) throw new Error("itto-mc not connected (is the bot running? `bun run bot`)");
    return this.client;
  }

  /** Type a line in Minecraft chat. */
  async say(message: string): Promise<string> {
    return this.call("chat", { message });
  }

  /** Run a seed skill (follow_player, assist_mining, ...). */
  async runSkill(skill: string, args?: Record<string, unknown>): Promise<string> {
    return this.call("run_skill", { name: skill, args });
  }

  /** Compact world snapshot as text (for the get_state tool). */
  async getStateText(): Promise<string> {
    const res = await this.ensure().readResource({ uri: "itto://state/current.txt" });
    const first = res.contents?.[0];
    return (first && "text" in first ? (first.text as string) : "") || "(no state)";
  }

  /** Structured world snapshot (for diffing into context pushes). */
  async getState(): Promise<GameState> {
    const res = await this.ensure().readResource({ uri: "itto://state/current" });
    const first = res.contents?.[0];
    const text = first && "text" in first ? (first.text as string) : "{}";
    return JSON.parse(text) as GameState;
  }

  private async call(name: string, args: Record<string, unknown>): Promise<string> {
    const res = await this.ensure().callTool({ name, arguments: args });
    const content = Array.isArray(res.content) ? res.content : [];
    const text = content
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join(" ");
    return text || "(ok)";
  }
}
