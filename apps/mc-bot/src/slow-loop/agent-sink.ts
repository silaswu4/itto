import type { GameState } from "@itto/shared";
import { formatStateForPrompt } from "@itto/shared";
import type { NudgeSink } from "./index.js";
import { logger } from "../util/logger.js";

const log = logger("brain");

/**
 * Routes slow-loop "nudges" into an external agent that acts as itto's brain.
 *
 * The agent is invoked as a CLI: we spawn `<cmd...> "<prompt>"` (the prompt
 * appended as the final arg) in `dir`. The agent is expected to run a model
 * that can reach this project's MCP server (itto-mc, :3001) — so it responds
 * by calling the `chat` tool (talk in MC) or acting via move_to/run_skill/etc.
 *
 * The brain stays swappable and this repo stays agnostic: any agent that takes
 * a prompt as a trailing CLI arg and can reach the itto-mc MCP server works.
 * The actual command + directory are configured locally (.env), never committed.
 */
export interface AgentBrainConfig {
  /** argv prefix to invoke the agent; the prompt is appended as the last arg. */
  cmd: string[];
  /** working directory for the spawn (so the agent loads its own config). */
  dir?: string;
  /** min ms between spawns (each is a full model run — not cheap). */
  cooldownMs: number;
}

const PERSONA =
  "You are itto, a chill Minecraft buddy in-world with your friend right now. " +
  "Not an assistant, not a narrator — a duo partner who's good at the game. " +
  "Casual, lowercase, short. Mostly quiet; only speak when it actually matters.";

export function createAgentBrainSink(cfg: AgentBrainConfig): NudgeSink {
  let lastAt = 0;
  let inflight = false;

  return {
    async nudge(reason: string, state: GameState) {
      const now = Date.now();
      if (inflight || now - lastAt < cfg.cooldownMs) return;
      lastAt = now;
      inflight = true;

      const prompt = buildPrompt(reason, state);
      try {
        const proc = Bun.spawn([...cfg.cmd, prompt], {
          cwd: cfg.dir,
          stdout: "pipe",
          stderr: "pipe",
        });
        const code = await proc.exited;
        if (code !== 0) {
          const err = (await new Response(proc.stderr).text()).slice(0, 300);
          log.warn(`agent exited ${code}: ${err}`);
        } else {
          log.debug(`nudged brain: ${reason}`);
        }
      } catch (e) {
        log.error("failed to reach the agent brain:", (e as Error).message);
      } finally {
        inflight = false;
      }
    },
  };
}

function buildPrompt(reason: string, state: GameState): string {
  return [
    PERSONA,
    "",
    `Something just happened in the Minecraft world worth a possible reaction: ${reason}`,
    "",
    "Current world snapshot:",
    formatStateForPrompt(state),
    "",
    "Respond IN CHARACTER as itto. To say something, call the itto-mc `chat` tool " +
      "(one short, casual, lowercase line). You may also act via itto-mc tools " +
      "(run_skill, move_to, etc.) if it fits. Do NOT reply on any other platform. " +
      "If nothing genuinely warrants a response, do nothing at all.",
  ].join("\n");
}
