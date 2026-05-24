import { createMcpServer, serveHttp } from "@itto/mcp-server";
import { loadConfig } from "./config.js";
import { createBot } from "./bot/create-bot.js";
import { BotController } from "./bot/controller.js";
import { FastLoop } from "./fast-loop/index.js";
import { SlowLoop, consoleNudgeSink } from "./slow-loop/index.js";
import { createAgentBrainSink } from "./slow-loop/agent-sink.js";
import { registerSkillTools } from "./skills/index.js";
import type { SkillContext } from "./skills/types.js";
import { pushChat } from "./state/extract.js";
import { setLogLevel, logger } from "./util/logger.js";

const log = logger("main");

/**
 * Boot sequence — this is where the whole machine comes together:
 *
 *   1. spawn the Mineflayer bot
 *   2. wrap it in a BotController (the single control surface)
 *   3. start the fast loop (15Hz follow + safety, pure code)
 *   4. start the slow loop (~4s trigger detection → nudges to Hermes)
 *   5. stand up the MCP server over HTTP so Hermes can connect + drive it
 *
 * Hermes itself runs SEPARATELY and connects to the MCP endpoint. It owns the
 * model + Discord voice. We just expose the body and the senses.
 */
async function main() {
  const cfg = loadConfig();
  setLogLevel(cfg.logLevel);
  log.info("booting itto…");

  // 1 + 2
  const bot = await createBot(cfg);
  const controller = new BotController(bot, cfg);

  // 3 — fast loop owns the follow controller; the state extractor reads its state
  const fast = new FastLoop(bot, cfg);
  // keep the GameState.followState field truthful
  const origGetState = controller.getState.bind(controller);
  controller.getState = () => ({ ...origGetState(), followState: fast.followState() });
  fast.start();

  // forward in-game chat into the rolling buffer + poke the slow loop
  bot.on("chat", (username, message) => {
    if (username === bot.username) return;
    pushChat(username, message);
    slow.poke();
  });

  // 4 — slow loop. The sink routes "nudges" (something worth reacting to) to
  // the brain: an external agent when configured, else just log.
  const sink =
    cfg.brain.enabled && cfg.brain.cmd.length > 0
      ? createAgentBrainSink({ cmd: cfg.brain.cmd, dir: cfg.brain.dir, cooldownMs: cfg.brain.cooldownMs })
      : consoleNudgeSink;
  if (cfg.brain.enabled) log.info("brain: external agent");
  const slow = new SlowLoop(controller, cfg, sink);
  slow.start();

  // 5 — MCP server: primitive tools + resources from the package, skill tools from the app
  const mcp = createMcpServer(controller);
  const skillCtx: SkillContext = {
    control: controller,
    suspendFollow: () => fast.follow.suspend(),
    resumeFollow: () => fast.follow.resume(),
  };
  registerSkillTools(mcp, skillCtx);

  const http = await serveHttp(mcp, { host: cfg.mcp.host, port: cfg.mcp.port });
  log.info("itto is live. point Hermes at the MCP endpoint and join the call.");

  // graceful shutdown
  const shutdown = async () => {
    log.info("shutting down…");
    fast.stop();
    slow.stop();
    await http.close();
    bot.quit();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((e) => {
  log.error("fatal:", e);
  process.exit(1);
});
