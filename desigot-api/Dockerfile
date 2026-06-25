# ─── Stage 1: Dependencies ────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-alpine AS production
WORKDIR /app

# Security: run as non-root user
RUN addgroup -g 1001 -S desigot && \
    adduser  -u 1001 -S desigot -G desigot

# Copy deps from stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY --chown=desigot:desigot . .

# Remove dev files
RUN rm -f .env.example Dockerfile docker-compose*.yml

USER desigot

EXPOSE 4000

# Healthcheck for container orchestration
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "src/server.js"]
