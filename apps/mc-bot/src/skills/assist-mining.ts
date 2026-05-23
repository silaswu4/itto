import type { Skill } from "./types.js";
import { runWithTask } from "./types.js";

/**
 * assist_mining() — when the player is mining, mine adjacent blocks to widen
 * the tunnel / strip the vein so two sets of hands go faster.
 *
 * TODO: real impl reads the player's look vector + the ore vein around them
 * (bot.findBlocks for matching ore) and mines the blocks they're NOT hitting.
 */
export const assistMining: Skill = {
  name: "assist_mining",
  description: "Mine alongside the player — widen tunnels and clear nearby ore.",
  async run(ctx, args) {
    return runWithTask(ctx, async () => {
      const state = ctx.control.getState();
      if (!state.player?.pos) return "lost the player, can't assist";
      // placeholder: move next to player, the vein-detection loop goes here.
      await ctx.control.moveTo(state.player.pos, { range: 2 });
      return "mining alongside (stub — vein detection TODO)";
    });
  },
};
