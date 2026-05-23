import mineflayer, { type Bot } from "mineflayer";
import { pathfinder, Movements } from "mineflayer-pathfinder";
import type { Config } from "../config.js";
import { logger } from "../util/logger.js";

const log = logger("bot");

/**
 * Spawn the Mineflayer bot and wait until it's in the world. Loads the
 * pathfinder plugin and a sane default Movements profile (the fast-loop
 * follow SM tweaks this further).
 */
export function createBot(cfg: Config): Promise<Bot> {
  const bot = mineflayer.createBot({
    host: cfg.mc.host,
    port: cfg.mc.port,
    version: cfg.mc.version,
    username: cfg.mc.username,
    auth: cfg.mc.auth,
  });

  bot.loadPlugin(pathfinder);

  return new Promise((resolve, reject) => {
    bot.once("spawn", () => {
      const movements = new Movements(bot);
      movements.allowSprinting = true;
      movements.canDig = false; // following shouldn't tear up the world; skills opt in
      bot.pathfinder.setMovements(movements);
      log.info(`spawned as ${bot.username} on ${cfg.mc.host}:${cfg.mc.port}`);
      resolve(bot);
    });
    bot.once("error", reject);
    bot.once("kicked", (reason) => reject(new Error(`kicked: ${reason}`)));
  });
}
