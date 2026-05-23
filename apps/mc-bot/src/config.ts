/**
 * Typed config loaded from environment. Fails loud and early if something
 * required is missing — better than a cryptic Mineflayer error 10s in.
 */

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name} (see .env.example)`);
  return v;
}

function num(name: string, fallback: number): number {
  const v = process.env[name];
  return v ? Number(v) : fallback;
}

export interface Config {
  mc: {
    host: string;
    port: number;
    version: string;
    username: string;
    auth: "offline" | "microsoft";
    ownerUsername: string;
  };
  mcp: {
    host: string;
    port: number;
  };
  tuning: {
    fastLoopHz: number;
    slowLoopIntervalMs: number;
    followTargetRange: number;
    teleportFallbackDistance: number;
  };
  logLevel: string;
}

export function loadConfig(): Config {
  return {
    mc: {
      host: process.env.MC_SERVER_HOST ?? "localhost",
      port: num("MC_SERVER_PORT", 25565),
      version: process.env.MC_VERSION ?? "1.20.4",
      username: process.env.MC_BOT_USERNAME ?? "itto",
      auth: (process.env.MC_AUTH as "offline" | "microsoft") ?? "offline",
      ownerUsername: req("MC_OWNER_USERNAME"),
    },
    mcp: {
      host: process.env.MCP_HOST ?? "0.0.0.0",
      port: num("MCP_PORT", 3001),
    },
    tuning: {
      fastLoopHz: num("FAST_LOOP_HZ", 15),
      slowLoopIntervalMs: num("SLOW_LOOP_INTERVAL_MS", 4000),
      followTargetRange: num("FOLLOW_TARGET_RANGE", 3),
      teleportFallbackDistance: num("TELEPORT_FALLBACK_DISTANCE", 30),
    },
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}
