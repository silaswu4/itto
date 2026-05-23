import type { GameState, Vec3Lit } from "./types.js";

/**
 * The single control surface over the Mineflayer bot.
 *
 * Implemented once in apps/mc-bot (src/bot/controller.ts) against a live
 * Mineflayer instance, then injected into:
 *   - the skill executor (apps/mc-bot/src/skills)
 *   - the MCP tools (packages/mcp-server/src/tools)
 *
 * Defining it here keeps the dependency arrow pointing the right way:
 * mcp-server depends on @itto/shared (this interface), never on the app.
 */
export interface BotControl {
  /** Pathfind to within `range` blocks of target. Sprint optional. */
  moveTo(target: Vec3Lit, opts?: { range?: number; sprint?: boolean }): Promise<void>;

  /** `/tp` style snap — only works if the bot is server op. Used as the >30 block fallback. */
  teleportTo(target: Vec3Lit): Promise<void>;

  /** Aim the bot's head at a point (for "look at player" idle + pointing). */
  lookAt(target: Vec3Lit): Promise<void>;

  mineBlock(pos: Vec3Lit): Promise<void>;
  placeBlock(pos: Vec3Lit, item: string): Promise<void>;
  dropItem(name: string, count?: number): Promise<void>;
  equip(name: string, destination?: "hand" | "head" | "torso" | "legs" | "feet" | "off-hand"): Promise<void>;
  attack(entityId: number): Promise<void>;

  /** Send an in-game chat message (text channel, not Discord voice). */
  chat(message: string): Promise<void>;

  /** Latest compact world snapshot. Cheap — read from cached game state. */
  getState(): GameState;

  /** Cancel any in-flight pathfinding / actions. The fast loop calls this on safety overrides. */
  stop(): void;
}
