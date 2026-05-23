import type { Bot } from "mineflayer";
import type { ChatLine, GameState, Vec3Lit } from "@itto/shared";

/** Mobs we treat as "hostile" for the nearby-threat scan. */
const HOSTILE = new Set([
  "zombie", "husk", "drowned", "skeleton", "stray", "creeper",
  "spider", "cave_spider", "enderman", "witch", "phantom", "pillager",
  "vindicator", "ravager", "blaze", "ghast", "piglin", "hoglin", "warden",
]);

/** Rolling chat buffer. The fast loop pushes into this; we snapshot it here. */
const recentChat: ChatLine[] = [];
const MAX_CHAT = 8;

export function pushChat(username: string, message: string): void {
  recentChat.push({ username, message, at: Date.now() });
  while (recentChat.length > MAX_CHAT) recentChat.shift();
}

function lit(v: { x: number; y: number; z: number }): Vec3Lit {
  return { x: round(v.x), y: round(v.y), z: round(v.z) };
}
const round = (n: number) => Math.round(n * 100) / 100;

/**
 * Snapshot the world into a compact JSON object. Called every fast-loop tick
 * (cheap — pure reads off Mineflayer's in-memory state, no I/O). This is the
 * heart of "no-vision-first": structured state instead of screenshots.
 */
export function extractGameState(bot: Bot, ownerUsername: string): GameState {
  const self = bot.entity;
  const player = bot.players[ownerUsername]?.entity ?? null;

  const hostiles = Object.values(bot.entities)
    .filter((e) => e.name && HOSTILE.has(e.name))
    .map((e) => ({
      id: e.id,
      name: e.name!,
      pos: lit(e.position),
      distance: round(self.position.distanceTo(e.position)),
    }))
    .filter((e) => e.distance < 24)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  const heldItem = bot.heldItem?.name ?? null;

  return {
    at: Date.now(),
    timeOfDay: bot.time.timeOfDay,
    self: {
      pos: lit(self.position),
      vel: lit(self.velocity),
      health: Math.round(bot.health),
      food: Math.round(bot.food),
      heldItem,
      onGround: self.onGround,
      dimension: bot.game.dimension,
    },
    player: bot.players[ownerUsername]
      ? {
          username: ownerUsername,
          pos: player ? lit(player.position) : null,
          distance: player ? round(self.position.distanceTo(player.position)) : null,
          online: true,
        }
      : { username: ownerUsername, pos: null, distance: null, online: false },
    nearbyHostiles: hostiles,
    recentChat: [...recentChat],
    inventory: bot.inventory.items().map((i) => ({ name: i.name, count: i.count })),
    followState: "IDLE", // overwritten by the fast loop's follow SM each tick
  };
}
