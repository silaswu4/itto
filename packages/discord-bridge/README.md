# @itto/discord-bridge — itto's voice

A dedicated "itto" Discord bot that joins a voice channel and bridges it to an
**ElevenLabs Conversational AI** agent. ElevenLabs does the hard real-time parts
(STT + LLM + TTS + turn-taking); this package just pumps audio and proxies the
agent's tool calls to the Minecraft bot.

```
you talk in the VC
  → this bot receives audio (@discordjs/voice, 48k stereo)
  → resample → ElevenLabs Conversational AI (WebSocket)
  → itto talks back → resample → played into the VC
  → agent tool calls (say / run_skill / get_state) → itto-mc MCP → the MC bot
  → live MC events (chat, nearby mobs) → contextual updates to the agent
```

Runs as its own process with its own Discord identity, separate from the
mc-bot and the text agent. All on one machine, localhost.

## Setup

1. **Make a separate Discord app** for itto (discord.com/developers): create app
   → Bot → copy token. OAuth2 URL Generator → scope `bot`, perms **View
   Channel + Connect + Speak** → invite it to the server. Copy the guild ID and
   the voice channel ID (Developer Mode → right-click → Copy ID).
2. **Fill `.env`** (repo root): `ITTO_DISCORD_TOKEN`, `DISCORD_GUILD_ID`,
   `DISCORD_VOICE_CHANNEL_ID`, `ELEVENLABS_API_KEY`.
3. **Create the agent:** `bun run voice:agent` → paste the printed
   `ELEVENLABS_AGENT_ID` into `.env`. (Re-run to update the persona/tools; it
   PATCHes when the id is set.)
4. **Run it:** make sure the MC bot is up (`bun run bot`), then `bun run voice`.
   itto joins the call. Talk to it.

## Files

- `scripts/create-agent.ts` — provisions itto's ElevenLabs agent (persona + tools)
- `src/elevenlabs.ts` — the Conversational AI WebSocket client
- `src/voice.ts` — Discord join / receive / play
- `src/mc.ts` — MCP client to itto-mc (control + state)
- `src/audio.ts` — 48k↔16k / stereo↔mono resampling
- `src/bridge.ts` — wires it all together

## Notes / TODO

- v1 mixes the whole room into one input stream (no per-speaker separation).
- Resampling is linear interpolation — fine for speech; swap for soxr if needed.
- Native deps (`@discordjs/opus`): if they won't build on Bun, swap to `opusscript`.
