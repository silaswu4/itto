import { z } from "zod";

/**
 * Zod schemas for MCP tool inputs. The MCP server uses these both for
 * runtime validation and to advertise JSON Schema to Hermes/Claude.
 * Keep names + descriptions tool-call friendly — Claude reads them.
 */

export const Vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const MoveToInput = z.object({
  target: Vec3Schema.describe("World coordinate to move toward"),
  range: z.number().optional().describe("Stop when within this many blocks (default 1)"),
  sprint: z.boolean().optional().describe("Sprint there (default false)"),
});

export const MineBlockInput = z.object({
  pos: Vec3Schema.describe("Coordinate of the block to mine"),
});

export const PlaceBlockInput = z.object({
  pos: Vec3Schema.describe("Coordinate to place the block at"),
  item: z.string().describe("Inventory item name to place, e.g. 'cobblestone'"),
});

export const DropItemInput = z.object({
  name: z.string().describe("Item to drop, e.g. 'iron_ingot'"),
  count: z.number().int().positive().optional().describe("How many (default all)"),
});

export const EquipInput = z.object({
  name: z.string().describe("Item to equip, e.g. 'diamond_sword'"),
  destination: z
    .enum(["hand", "head", "torso", "legs", "feet", "off-hand"])
    .optional()
    .describe("Where to equip it (default hand)"),
});

export const ChatInput = z.object({
  message: z.string().describe("Message to send in Minecraft chat"),
});

export const RunSkillInput = z.object({
  name: z.string().describe("Skill name, e.g. 'assist_mining'"),
  args: z.record(z.unknown()).optional().describe("Skill-specific arguments"),
});

export type MoveToInputT = z.infer<typeof MoveToInput>;
export type MineBlockInputT = z.infer<typeof MineBlockInput>;
export type PlaceBlockInputT = z.infer<typeof PlaceBlockInput>;
export type DropItemInputT = z.infer<typeof DropItemInput>;
export type EquipInputT = z.infer<typeof EquipInput>;
export type ChatInputT = z.infer<typeof ChatInput>;
export type RunSkillInputT = z.infer<typeof RunSkillInput>;
