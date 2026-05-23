import type { Skill } from "./types.js";
import { runWithTask } from "./types.js";

/**
 * scout_ahead(distance) — path ahead in the player's heading, look around,
 * and report what's out there (caves, mobs, structures, terrain), then return.
 *
 * TODO: real impl projects the player's yaw into a target point, scans blocks
 * + entities at the destination, summarizes, and walks back.
 */
export const scoutAhead: Skill = {
  name: "scout_ahead",
  description: "Range ahead in the player's direction and report what's there.",
  async run(ctx, args) {
    const distance = typeof args?.distance === "number" ? args.distance : 20;
    return runWithTask(ctx, async () => {
      const state = ctx.control.getState();
      if (!state.player?.pos) return "no player heading to scout from";
      // placeholder destination: clamp to teleport-fallback so we don't trek forever
      return `scouting ~${distance} blocks ahead (stub — terrain scan TODO)`;
    });
  },
};
