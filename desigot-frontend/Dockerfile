FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
RUN addgroup -g 1001 -S desigot && adduser -u 1001 -S desigot -G desigot
COPY --from=builder --chown=desigot:desigot /app/.next/standalone ./
COPY --from=builder --chown=desigot:desigot /app/.next/static ./.next/static
COPY --from=builder --chown=desigot:desigot /app/public ./public
USER desigot
EXPOSE 3000
CMD ["node", "server.js"]
