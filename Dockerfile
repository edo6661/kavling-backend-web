FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build 

FROM node:20-bookworm-slim
WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y openssl tzdata && \
    rm -rf /var/lib/apt/lists/*

ENV TZ=Asia/Jakarta

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "start"]