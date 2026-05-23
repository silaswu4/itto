# itto

> an ai buddy that joins your minecraft world, follows you around, helps out, and hangs in your discord call.

You log in, itto spawns next to you, joins your voice call, and you just play
together. It talks, it helps, it learns your playstyle over sessions. Not a
coach. Not a tutorial bot. A duo partner.

Full project spec: **[CONTEXT.md](./CONTEXT.md)**. Architecture map:
**[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)**.

## How it's built

| Piece | What it is |
|---|---|
| **Hermes** (Nous Research) | The brain. Runs Claude + Discord voice. Lives **outside this repo**, connects over MCP. |
| **`apps/mc-bot`** | The body. A Mineflayer bot with a 15Hz fast loop (follow + safety) and a ~4s slow loop (decide when to react). |
| **`packages/mcp-server`** | The nervous system. Exposes the bot's actions as MCP tools and its world state as MCP resources for Hermes. |
| **`packages/shared`** | Types, schemas, the system prompt (itto's personality). |
| **`apps/web`** | Landing page. |

The key idea is the **two loops**: pure-code reflexes keep itto alive and
following while Claude thinks on a slower beat. The LLM is never in the hot path
of "am I standing in lava."

## Layout

```
itto/
├── apps/
│   ├── mc-bot/        # Mineflayer bot: fast-loop, slow-loop, skills, state, bot/
│   └── web/           # landing page (Next.js — framework still TBD vs Astro)
├── packages/
│   ├── mcp-server/    # MCP server Hermes connects to (tools/ + resources/)
│   ├── shared/        # types, zod schemas, prompts, BotControl interface
│   └── discord-bridge/# OPTIONAL DIY voice — only if Hermes' plugin falls short
├── infra/             # docker-compose (local MC server), deploy/
├── docs/              # ARCHITECTURE.md, HERMES_SETUP.md
├── scripts/           # dev.sh, seed-skills/ (Hermes markdown templates)
└── CONTEXT.md         # the spec
```

## Quick start

```bash
# 0. tools
nvm use            # node 20
corepack enable    # pnpm

# 1. install
pnpm install

# 2. config
cp .env.example .env
#   fill in at least MC_OWNER_USERNAME (your MC username)

# 3. local minecraft + the bot (one command)
./scripts/dev.sh
#   or manually:
#   pnpm mc:up        # docker paper server on :25565
#   pnpm bot          # bot + MCP server on :3001

# 4. wire up the brain (separate process — see docs/HERMES_SETUP.md)
hermes mcp add itto http://localhost:3001/mcp
hermes platform discord enable
```

Then hop in the MC world + the Discord call and play.

## Status

Early scaffold. The structure, loops, control surface, MCP tools, and seed
skills are stubbed and wired; the skill *internals* (vein detection, real
scouting, chest memory) and the Hermes nudge channel are marked `TODO`. See
`CONTEXT.md → Open Decisions` for what's still undecided.

## Don'ts (from CONTEXT.md)

- Don't put LLM calls in the fast loop.
- Don't use screenshots when Mineflayer's structured state suffices.
- Don't fork Hermes — depend on it via MCP.
- Don't make the bot proactively chatty. It mostly listens.
- Don't pathfind long routes (>30 blocks) — teleport instead.
