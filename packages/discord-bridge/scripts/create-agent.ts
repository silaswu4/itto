/**
 * Provision (or update) itto's ElevenLabs Conversational AI agent via the API.
 * The agent's persona + tools are defined HERE so they're version-controlled,
 * not buried in a dashboard.
 *
 *   bun run voice:agent            # from repo root (loads .env)
 *
 * Reads ELEVENLABS_API_KEY (+ optional ELEVENLABS_VOICE_ID / ELEVENLABS_LLM).
 * Prints the agent_id to paste into .env as ELEVENLABS_AGENT_ID.
 *
 * The agent talks via ElevenLabs (STT+LLM+TTS+turn-taking). To act in the
 * Minecraft world it calls CLIENT tools, which the voice bridge proxies to the
 * itto-mc MCP server. So the agent never touches the network directly.
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) throw new Error("set ELEVENLABS_API_KEY (in .env) first");

const VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? "pNInz6obpgDQGcFmaJgB"; // Adam — swap for itto's voice
const LLM = process.env.ELEVENLABS_LLM ?? "gemini-2.5-flash"; // low-latency; set a claude model if you prefer

const SYSTEM_PROMPT = `You are itto — a chill Minecraft buddy hanging in a Discord voice call with your friend(s) while you all play Minecraft together. You ALSO have a body in the Minecraft world (a bot) that you control through tools.

Vibe:
- You're a friend and duo partner, NOT an assistant or a coach. Casual, short, lowercase energy. React to the game, get hyped at cool stuff, salty when it's warranted.
- Mostly listen. Speak when it actually matters. Keep voice replies to a sentence or two — this is a live call, not an essay.
- Never say "I am an AI" or "how can I help you". You're just here playing.

Your body in the world:
- You receive live game updates as system context (what's happening around you in-world: the player's distance, nearby mobs, your health, recent Minecraft chat, etc.). Use them to ground what you say and do.
- To ACT, use your tools. When someone asks you to come, follow, help mine, fight, scout, build, or fetch something — actually DO it via a tool, don't just say you will.
- minecraft_say: type a line in Minecraft text chat (for the people in-game, distinct from talking in the call).
- minecraft_run_skill: run a skill. Available: follow_player, assist_mining, combat_assist, fetch_item, scout_ahead, build_helper, inventory_report.
- minecraft_get_state: pull the current world snapshot when you want specifics.`;

const tools = [
  {
    type: "client",
    name: "minecraft_say",
    description: "Type a short message into Minecraft text chat (for players in-game). Use for in-world banter, distinct from talking out loud in the voice call.",
    parameters: {
      type: "object",
      properties: { message: { type: "string", description: "The line to type in MC chat (short, casual, lowercase)." } },
      required: ["message"],
    },
    expects_response: false,
  },
  {
    type: "client",
    name: "minecraft_run_skill",
    description: "Run an itto skill in the Minecraft world. Use when asked to come/follow, help mine, fight mobs, scout ahead, build, fetch an item, or report inventory.",
    parameters: {
      type: "object",
      properties: {
        skill: {
          type: "string",
          description: "One of: follow_player, assist_mining, combat_assist, fetch_item, scout_ahead, build_helper, inventory_report.",
        },
        args: { type: "string", description: "Optional JSON string of skill args, e.g. {\"name\":\"diamond\"} for fetch_item. Omit if none." },
      },
      required: ["skill"],
    },
    expects_response: true,
  },
  {
    type: "client",
    name: "minecraft_get_state",
    description: "Get the current Minecraft world snapshot (your position/health, the player's distance, nearby mobs, inventory, recent chat). Use when you need specifics you weren't told.",
    parameters: { type: "object", properties: {} },
    expects_response: true,
  },
];

const body = {
  name: "itto",
  conversation_config: {
    agent: {
      first_message: "yo i'm in. let's get it",
      language: "en",
      prompt: { prompt: SYSTEM_PROMPT, llm: LLM, tools },
    },
    tts: { voice_id: VOICE_ID, model_id: "eleven_flash_v2_5" },
  },
};

const existing = process.env.ELEVENLABS_AGENT_ID;
const url = existing
  ? `https://api.elevenlabs.io/v1/convai/agents/${existing}`
  : "https://api.elevenlabs.io/v1/convai/agents/create";
const method = existing ? "PATCH" : "POST";

const res = await fetch(url, {
  method,
  headers: { "xi-api-key": API_KEY, "content-type": "application/json" },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error(`❌ ${method} ${url} -> ${res.status}`);
  console.error(await res.text());
  process.exit(1);
}

const data = (await res.json()) as { agent_id?: string };
const agentId = data.agent_id ?? existing;
console.log(existing ? "✅ updated itto agent" : "✅ created itto agent");
console.log(`\nagent_id: ${agentId}`);
if (!existing) console.log(`\n→ add this to your .env:\n   ELEVENLABS_AGENT_ID=${agentId}\n`);
