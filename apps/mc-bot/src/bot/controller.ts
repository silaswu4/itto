import type { Bot } from "mineflayer";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";
import type { BotControl, GameState, Vec3Lit } from "@itto/shared";
import type { Config } from "../config.js";
import { extractGameState } from "../state/extract.js";
import { logger } from "../util/logger.js";

const log = logger("controller");

/**
 * Concrete BotControl over a live Mineflayer bot. This is the ONE place that
 * touches Mineflayer's action APIs. Skills and MCP tools both go through here,
 * so behavior (and safety) stays consistent.
 */
export class BotController implements BotControl {
  constructor(
    private readonly bot: Bot,
    private readonly cfg: Config,
  ) {}

  async moveTo(target: Vec3Lit, opts?: { range?: number; sprint?: boolean }): Promise<void> {
    const range = opts?.range ?? 1;
    const here = this.bot.entity.position;
    const dist = here.distanceTo(new Vec3(target.x, target.y, target.z));

    // Long-haul fallback: teleport instead of pathing across the world.
    if (dist > this.cfg.tuning.teleportFallbackDistance) {
      log.debug(`dist ${dist.toFixed(1)} > fallback, teleporting`);
      return this.teleportTo(target);
    }

    const goal = new goals.GoalNear(target.x, target.y, target.z, range);
    await this.bot.pathfinder.goto(goal);
  }

  async teleportTo(target: Vec3Lit): Promise<void> {
    // Requires op. If the bot isn't op this is a no-op the server rejects;
    // the slow loop should know whether teleport is available.
    this.bot.chat(`/tp ${this.bot.username} ${target.x} ${target.y} ${target.z}`);
  }

  async lookAt(target: Vec3Lit): Promise<void> {
    await this.bot.lookAt(new Vec3(target.x, target.y + 1.6, target.z), true);
  }

  async mineBlock(pos: Vec3Lit): Promise<void> {
    const block = this.bot.blockAt(new Vec3(pos.x, pos.y, pos.z));
    if (!block) throw new Error("no block at that position");
    await this.bot.dig(block);
  }

  async placeBlock(pos: Vec3Lit, item: string): Promise<void> {
    const ref = this.bot.blockAt(new Vec3(pos.x, pos.y - 1, pos.z));
    if (!ref) throw new Error("no reference block to place against");
    await this.equip(item);
    await this.bot.placeBlock(ref, new Vec3(0, 1, 0));
  }

  async dropItem(name: string, count?: number): Promise<void> {
    const item = this.bot.inventory.items().find((i) => i.name === name);
    if (!item) throw new Error(`no ${name} in inventory`);
    await this.bot.toss(item.type, null, count ?? item.count);
  }

  async equip(name: string, destination: "hand" | "head" | "torso" | "legs" | "feet" | "off-hand" = "hand"): Promise<void> {
    const item = this.bot.inventory.items().find((i) => i.name === name);
    if (!item) throw new Error(`no ${name} to equip`);
    await this.bot.equip(item, destination);
  }

  async attack(entityId: number): Promise<void> {
    const entity = this.bot.entities[entityId];
    if (!entity) throw new Error("entity gone");
    await this.bot.attack(entity);
  }

  async chat(message: string): Promise<void> {
    this.bot.chat(message);
  }

  getState(): GameState {
    return extractGameState(this.bot, this.cfg.mc.ownerUsername);
  }

  stop(): void {
    this.bot.pathfinder.stop();
    this.bot.clearControlStates();
  }
}
