import type { GameState } from "@itto/shared";

/**
 * A trigger is a cheap predicate over game state that decides "is anything
 * here worth waking Claude for?" The slow loop runs these every tick. We keep
 * itto mostly quiet (CONTEXT.md anti-pattern: don't be proactively chatty),
 * so triggers should be conservative and rate-limited by the loop.
 */
export interface Trigger {
  name: string;
  /** Return a short reason string if it should fire, else null. */
  check(state: GameState, prev: GameState | null): string | null;
}

const POINT_PHRASES = ["look at this", "what do you think", "check this out", "see this", "look"];

export const TRIGGERS: Trigger[] = [
  {
    name: "player_addressed_bot",
    check: (s) => {
      const last = s.recentChat.at(-1);
      if (!last || last.username === "itto") return null;
      const lower = last.message.toLowerCase();
      if (POINT_PHRASES.some((p) => lower.includes(p)) || lower.includes("itto"))
        return `player said: "${last.message}"`;
      return null;
    },
  },
  {
    name: "incoming_threat",
    check: (s, prev) => {
      const close = s.nearbyHostiles.find((h) => h.distance < 10);
      if (!close) return null;
      // only fire on NEW threats so we don't nag every tick
      const wasClose = prev?.nearbyHostiles.some((h) => h.id === close.id);
      return wasClose ? null : `${close.name} approaching (${close.distance}b)`;
    },
  },
  {
    name: "player_in_danger",
    check: (s) => {
      // we can't see the player's health, but proximity of mobs to them +
      // night is a decent proxy. Placeholder heuristic.
      if (s.player?.distance != null && s.player.distance < 8 && s.nearbyHostiles.length >= 2)
        return "multiple mobs near the player";
      return null;
    },
  },
  {
    name: "self_low_health",
    check: (s, prev) => {
      if (s.self.health <= 6 && (prev?.self.health ?? 20) > 6) return "bot health critical";
      return null;
    },
  },
];

/**
 * Periodic "vibe check" — every ~60s consider commenting on the scenery.
 * Stateful so it's separate from the predicate triggers above.
 */
export class VibeCheck {
  private lastAt = Date.now();
  constructor(private readonly intervalMs = 60_000) {}
  due(): boolean {
    if (Date.now() - this.lastAt < this.intervalMs) return false;
    this.lastAt = Date.now();
    return true;
  }
}
