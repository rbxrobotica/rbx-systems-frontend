# Stage 1: build
FROM docker.io/library/node:20-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@9 --activate
RUN pnpm install --frozen-lockfile

COPY . .

ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

RUN pnpm run build

# Stage 2: runtime — Node SSR via @sveltejs/adapter-node (ADR-0002).
# The Node server reads content server-side from Contabo Object Storage through
# the in-process Content Gateway; the bucket stays private and is never reached
# by the browser. PORT / ORIGIN / forwarded headers come from k8s env at runtime.
FROM docker.io/library/node:20-alpine

WORKDIR /app

# adapter-node output (build/index.js + build/client + build/server) plus the
# full node_modules so every SSR runtime dependency is present. A pruned
# prod-only image (pnpm deploy / vite bundle) is future optimization debt.
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

ENV PORT=8080
EXPOSE 8080

HEALTHCHECK CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1

USER node
CMD ["node", "build"]
