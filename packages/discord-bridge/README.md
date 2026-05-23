# @itto/discord-bridge (OPTIONAL — do not build yet)

This package only exists if we decide to **DIY voice** instead of relying on
Hermes' built-in Discord platform plugin.

See `CONTEXT.md → Open Decisions`:

> Voice in Discord: confirm Hermes' Discord plugin handles voice receive + TTS,
> or DIY via `discord.js` + Deepgram + ElevenLabs.

## Default plan: don't build this.

Hermes ships a Discord plugin. If it handles voice receive (STT) + speaking
(TTS) well enough, this whole package gets deleted. We're keeping the slot so
the decision is explicit, not forgotten.

## If we DIY (the fallback path)

Pipeline:

```
Discord voice in ──► discord.js receiver ──► VAD ──► Deepgram (STT)
                                                         │
                                                         ▼
                                              text ──► Hermes/Claude
                                                         │
                                                         ▼
ElevenLabs (TTS) ──► Opus encode ──► discord.js player ──► Discord voice out
```

Then add deps: `discord.js @discordjs/voice @discordjs/opus`, plus Deepgram +
ElevenLabs SDKs. Env vars are already stubbed in `.env.example`.

Target: <2s end-to-end (CONTEXT.md latency budget), streaming TTS, VAD turn-taking.
