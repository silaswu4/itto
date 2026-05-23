# Container image for the mc-bot + MCP server (optional prod path).
# Build from the repo root: docker build -f infra/deploy/bot.Dockerfile .

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm" PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# install deps (workspace-aware)
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/shared/package.json packages/shared/
COPY packages/mcp-server/package.json packages/mcp-server/
COPY apps/mc-bot/package.json apps/mc-bot/
RUN pnpm install --frozen-lockfile || pnpm install

# build
FROM deps AS build
COPY . .
RUN pnpm --filter @itto/mc-bot... build

# runtime
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3001
CMD ["node", "apps/mc-bot/dist/index.js"]
