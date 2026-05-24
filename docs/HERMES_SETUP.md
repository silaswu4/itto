# Hermes setup

Hermes (Nous Research) is itto's brain. It runs **outside** this repo, owns the
Claude calls and the Discord voice channel, and connects to our MCP server to
get hands + senses in the Minecraft world.

> ⚠️ The exact Hermes commands below are placeholders from `CONTEXT.md`. Verify
> against the real Hermes docs when we install it — this file is the integration
> checklist, not gospel.

## 1. Install Hermes (separate from this repo)

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
```

## 2. Point it at our MCP server

Start itto first (`bun run bot`), which serves MCP at `http://localhost:3001/mcp`,
then register it:

```bash
hermes mcp add itto http://localhost:3001/mcp
```

Hermes now sees our tools (`move_to`, `mine_block`, `place_block`, `run_skill`,
…) and resources (`itto://state/current`).

## 3. Give Hermes the personality

Seed it with our system prompt — exported from `@itto/shared`:

```ts
import { SYSTEM_PROMPT } from "@itto/shared";
```

(or copy the text from `packages/shared/src/prompts.ts`). Keep this in sync; the
repo copy is the source of truth so it's version-controlled.

## 4. Enable Discord voice

```bash
hermes platform discord enable
# then join the voice channel from .env (DISCORD_VOICE_CHANNEL_ID)
```

If Hermes' plugin can't do voice receive + TTS well, fall back to
`packages/discord-bridge` (DIY path — see its README).

## 5. The nudge channel (TODO)

Our slow loop wants to *proactively* tell Claude when something's worth a
reaction (creeper incoming, sick view). Right now `slow-loop/index.ts` logs
these via `consoleNudgeSink`. To make itto actually pipe up, implement a
`NudgeSink` that reaches Hermes — likely one of:

- an MCP server→client notification Hermes subscribes to,
- an MCP sampling request,
- a small webhook Hermes polls/receives.

Pick this once we see Hermes' real integration surface.

## Open decisions that touch Hermes

- Memory persistence: lean on Hermes' SQLite, or add our own structured store
  for MC-specific facts (base coords, chest contents)? See `CONTEXT.md`.
- Multiple humans in the call: filter by Discord user ID → map to MC owner.
