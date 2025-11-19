# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Ensure OpenSSL is present so Prisma picks the correct (openssl-3) engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

# Avoid build failures when the Prisma checksum endpoint is unavailable
# and force Prisma to target openssl-3 binaries explicitly
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
    PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

COPY tsconfig*.json ./
COPY jest.config.ts ./
COPY openapi.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN chmod +x scripts/*.sh
RUN npm run prisma:generate
RUN npm run build

FROM node:20-bookworm-slim AS production
WORKDIR /app
ENV NODE_ENV=production
# Ensure OpenSSL is present at runtime for Prisma engine
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/openapi.json ./openapi.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/tsconfig.build.json ./tsconfig.build.json

EXPOSE 4000
CMD ["node", "dist/server.js"]
