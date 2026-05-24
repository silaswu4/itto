/**
 * The absolute minimum mineflayer bot — "hello world" for the body.
 * No framework, no MCP, no loops. Just: connect, log what happens, follow.
 *
 * Lives inside the mc-bot workspace so it resolves mineflayer.
 * Run it:
 *   bun run --filter @itto/mc-bot hello        # from repo root
 *   bun run hello                              # from apps/mc-bot
 *
 * Set env first (or put them in .env and the real bot reads them):
 *
 * ── Local offline server (easiest for solo dev, no account needed) ──
 *   MC_AUTH=offline MC_OWNER_USERNAME=<you> bun run --filter @itto/mc-bot hello
 *
 * ── Minehut / any ONLINE-mode server (needs a real MC account) ──
 *   MC_SERVER_HOST=<name>.minehut.gg MC_AUTH=microsoft \
 *   MC_OWNER_USERNAME=<you> bun run --filter @itto/mc-bot hello
 *   (first run prints a microsoft.com/link code to sign the bot's account in;
 *    the server must be AWAKE — Minehut free servers sleep when idle.)
 */
import mineflayer from "mineflayer";

const auth = (process.env.MC_AUTH ?? "offline") as "offline" | "microsoft";

const bot = mineflayer.createBot({
  host: process.env.MC_SERVER_HOST ?? "localhost",
  port: Number(process.env.MC_SERVER_PORT ?? 25565),
  username: process.env.MC_BOT_USERNAME ?? "itto",
  auth,
  version: process.env.MC_VERSION ?? "1.20.4",
  // microsoft auth: print the device-code link instead of opening a browser
  onMsaCode: (data) => console.log(`🔑 sign in: ${data.verification_uri} code ${data.user_code}`),
});

const owner = process.env.MC_OWNER_USERNAME ?? "";

bot.once("spawn", () => {
  console.log(`✅ spawned in the world as "${bot.username}"`);
  bot.chat("yo i'm in");
  console.log(`   players online: ${Object.keys(bot.players).join(", ") || "(just me)"}`);

  // crudest possible "follow": every second, walk toward the owner.
  setInterval(() => {
    const target = owner ? bot.players[owner]?.entity : undefined;
    if (!target) return;
    bot.lookAt(target.position.offset(0, 1.6, 0));
    const dist = bot.entity.position.distanceTo(target.position);
    bot.setControlState("forward", dist > 3);
  }, 1000);
});

bot.on("chat", (username, message) => {
  if (username === bot.username) return;
  console.log(`💬 ${username}: ${message}`);
  if (message === "come") bot.chat("omw");
});

bot.on("kicked", (reason) => console.log("❌ kicked:", reason));
bot.on("error", (err) => console.log("❌ error:", err.message));
bot.on("end", () => console.log("🔌 disconnected"));
