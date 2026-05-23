import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RunSkillInput, type BotControl } from "@itto/shared";
import type { Skill, SkillContext } from "./types.js";
import { followPlayer } from "./follow-player.js";
import { assistMining } from "./assist-mining.js";
import { combatAssist } from "./combat-assist.js";
import { fetchItem } from "./fetch-item.js";
import { scoutAhead } from "./scout-ahead.js";
import { buildHelper } from "./build-helper.js";
import { inventoryReport } from "./inventory-report.js";
import { logger } from "../util/logger.js";

const log = logger("skills");

/** The seed skill set. Hermes can author more as markdown in its own state. */
export const SKILLS: Skill[] = [
  followPlayer,
  assistMining,
  combatAssist,
  fetchItem,
  scoutAhead,
  buildHelper,
  inventoryReport,
];

const REGISTRY = new Map(SKILLS.map((s) => [s.name, s]));

/**
 * Register the `run_skill` tool on the MCP server. Skills live in the app
 * (they need the follow controller), so we add this tool here rather than in
 * the mcp-server package — keeps that package free of app concerns.
 */
export function registerSkillTools(server: McpServer, ctx: SkillContext): void {
  server.tool(
    "run_skill",
    `Run a composite skill. Available: ${SKILLS.map((s) => s.name).join(", ")}.`,
    RunSkillInput.shape,
    async ({ name, args }) => {
      const skill = REGISTRY.get(name);
      if (!skill) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ ok: false, message: `unknown skill: ${name}` }) }],
          isError: true,
        };
      }
      try {
        const result = await skill.run(ctx, args);
        return { content: [{ type: "text" as const, text: JSON.stringify({ ok: true, message: result }) }] };
      } catch (e) {
        log.error(`skill ${name} failed`, (e as Error).message);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ ok: false, message: (e as Error).message }) }],
          isError: true,
        };
      }
    },
  );
}

export type { Skill, SkillContext, BotControl };
