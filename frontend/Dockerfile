# syntax=docker/dockerfile:1
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY cypress.config.ts ./
COPY tsconfig.base.json ./
COPY index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

FROM nginx:1.25-alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
