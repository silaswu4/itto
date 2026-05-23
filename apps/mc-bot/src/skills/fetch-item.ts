import type { Skill } from "./types.js";
import { runWithTask } from "./types.js";

/**
 * fetch_item(name) — retrieve a known item from a known chest and bring it
 * back to the player. Depends on MC-specific memory (chest contents + coords),
 * which is one of the open decisions in CONTEXT.md (Hermes SQLite vs our own
 * structured store). For now it reads from a stub memory.
 *
 * TODO: wire to the chest/base memory store once chosen.
 */
export const fetchItem: Skill = {
  name: "fetch_item",
  description: "Go to a known chest, grab an item, bring it back to the player.",
  async run(ctx, args) {
    const name = String(args?.name ?? "");
    if (!name) return "fetch_item needs an item name";
    return runWithTask(ctx, async () => {
      // const loc = memory.findChestWith(name)  ← TODO
      // await ctx.control.moveTo(loc); openChest; withdraw(name); return to player
      return `would fetch ${name} (stub — chest memory not wired yet)`;
    });
  },
};
