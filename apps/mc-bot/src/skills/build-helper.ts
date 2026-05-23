import type { Skill } from "./types.js";
import { runWithTask } from "./types.js";

/**
 * build_helper(spec) — place blocks according to a pattern (a wall, a floor,
 * pillars, a simple schematic). The spec format is TBD; start with a list of
 * {pos, item} placements and grow from there.
 *
 * TODO: define a compact spec schema in @itto/shared and validate it; handle
 * running out of materials gracefully.
 */
export const buildHelper: Skill = {
  name: "build_helper",
  description: "Place blocks following a pattern/spec to help build something.",
  async run(ctx, args) {
    const placements = Array.isArray(args?.placements) ? args!.placements : [];
    if (placements.length === 0) return "build_helper needs a placements list";
    return runWithTask(ctx, async () => {
      let done = 0;
      for (const p of placements as Array<{ pos: { x: number; y: number; z: number }; item: string }>) {
        try {
          await ctx.control.placeBlock(p.pos, p.item);
          done++;
        } catch {
          /* skip blocks we can't place; report at the end */
        }
      }
      return `placed ${done}/${placements.length} blocks`;
    });
  },
};
