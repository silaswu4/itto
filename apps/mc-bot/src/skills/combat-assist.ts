import type { Skill } from "./types.js";
import { runWithTask } from "./types.js";

/**
 * combat_assist() — flank the mobs the player is fighting. Equip the best
 * weapon, target the nearest hostile, attack until clear.
 *
 * TODO: real impl picks targets by threat-to-player, kites ranged mobs,
 * and stops if the player walks away (don't chase forever).
 */
export const combatAssist: Skill = {
  name: "combat_assist",
  description: "Help fight nearby hostile mobs. Targets the closest threat.",
  async run(ctx) {
    return runWithTask(ctx, async () => {
      const state = ctx.control.getState();
      const target = state.nearbyHostiles[0];
      if (!target) return "nothing to fight";
      const sword = state.inventory.find((i) => /sword|axe/.test(i.name));
      if (sword) await ctx.control.equip(sword.name);
      await ctx.control.moveTo(target.pos, { range: 2, sprint: true });
      await ctx.control.attack(target.id);
      return `engaging ${target.name}`;
    });
  },
};
