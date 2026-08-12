# Pin by digest so rebuilds do not silently float to a newer alpine tag.
FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS base

ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24-alpine@sha256:a0b9bf06e4e6193cf7a0f58816cc935ff8c2a908f81e6f1a95432d679c54fbfd AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Postgres helper + canonical SQL migrations (opened at boot / health / stores).
# registry.mjs + *.sql must ship with standalone so openDatabase can apply schema.
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/db.mjs ./src/lib/db.mjs
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/migrate.mjs ./src/lib/migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/sqlite.mjs ./src/lib/sqlite.mjs
# `pg` may be omitted from Next standalone tracing; copy it for runtime queries.
COPY --from=dependencies /app/node_modules /tmp/node_modules
COPY --from=builder /app/scripts/copy-worker-runtime-deps.mjs /tmp/copy-worker-runtime-deps.mjs
RUN node /tmp/copy-worker-runtime-deps.mjs /tmp/node_modules /app/node_modules \
  && chown -R nextjs:nodejs /app/node_modules \
  && rm -rf /tmp/node_modules /tmp/copy-worker-runtime-deps.mjs

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
