# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY jest.config.ts ./
COPY openapi.json ./
COPY prisma ./prisma
COPY scripts ./scripts
COPY src ./src

RUN chmod +x scripts/*.sh
RUN npm run prisma:generate
RUN npm run build

FROM node:20-bullseye-slim AS production
WORKDIR /app
ENV NODE_ENV=production

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
