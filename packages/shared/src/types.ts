/**
 * Core shared types. These are the contract between the bot runtime
 * (apps/mc-bot) and the MCP surface (packages/mcp-server). Keep them
 * compact — the GameState object gets serialized to JSON and read by
 * Claude (via Hermes) on every slow-loop tick, so every field costs tokens.
 */

/** A plain {x,y,z} — we never pass Mineflayer's Vec3 class across boundaries. */
export interface Vec3Lit {
  x: number;
  y: number;
  z: number;
}

export interface EntityInfo {
  id: number;
  /** e.g. "zombie", "creeper", "skeleton" */
  name: string;
  pos: Vec3Lit;
  /** blocks from the bot, rounded to 1 decimal */
  distance: number;
}

export interface InventoryItem {
  name: string;
  count: number;
  /** equipped slot, if any: "hand" | "head" | "torso" | ... */
  slot?: string;
}

export interface ChatLine {
  username: string;
  message: string;
  /** epoch ms */
  at: number;
}

/** Follow-behavior state machine states. See apps/mc-bot/src/fast-loop/follow.ts */
export type FollowState = "IDLE" | "DRIFT" | "CATCHUP" | "TASK";

/**
 * The compact world snapshot. Produced every tick by the state extractor,
 * surfaced to Hermes/Claude as an MCP resource, and used by the slow loop
 * to decide whether anything is worth commenting on.
 */
export interface GameState {
  /** ms since this snapshot was taken */
  at: number;
  /** 0–24000 game ticks; <13000 is day */
  timeOfDay: number;
  self: {
    pos: Vec3Lit;
    vel: Vec3Lit;
    health: number; // 0–20
    food: number; // 0–20
    heldItem: string | null;
    onGround: boolean;
    dimension: string;
  };
  player: {
    username: string;
    pos: Vec3Lit | null;
    /** blocks between bot and player, null if player not visible */
    distance: number | null;
    online: boolean;
  } | null;
  nearbyHostiles: EntityInfo[];
  recentChat: ChatLine[];
  inventory: InventoryItem[];
  followState: FollowState;
}

/**
 * High-level intent the slow loop / Hermes hands down to the executor.
 * The fast loop never produces these — it only reacts.
 */
export type BotIntent =
  | { kind: "say"; text: string }
  | { kind: "skill"; name: string; args?: Record<string, unknown> }
  | { kind: "follow"; range?: number }
  | { kind: "stop" };

/** Result envelope returned by every MCP tool, kept uniform for Hermes. */
export interface ToolResult {
  ok: boolean;
  message: string;
  data?: unknown;
}
