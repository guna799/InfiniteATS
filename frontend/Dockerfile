# =========================================================================
# InfiniteCareers Frontend Multi-Stage Dockerfile (Next.js 14 Standalone)
# =========================================================================

# 1. Base Node Image
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# 2. Dependencies Installation
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Build-time only; the runtime path is injected by the deployment
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate
# Seed database shipped in the image (dev.db is not in git); the init container copies it
# onto an empty volume. seed.js wipes tables, so it only ever runs here.
RUN rm -f prisma/dev.db && npx prisma db push --skip-generate && node prisma/seed.js
RUN mkdir -p public && npm run build

# 4. Production Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# Prisma CLI applies additive schema changes to the SQLite volume (init container)
RUN npm install -g prisma@5.22.0 && npm cache clean --force

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
# Used by prisma/set-password.js (the app itself bundles it)
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
# Seed SQLite database, copied onto the persistent volume on first start
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
