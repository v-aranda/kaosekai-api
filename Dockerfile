# Estágio 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/
RUN npm install
COPY src ./src
RUN npx prisma generate
RUN npm run build

# Estágio 2: Runner (Imagem final corrigida)
FROM node:18-alpine
WORKDIR /app

# ADICIONADO: Instalação de dependências do sistema para o Prisma rodar no Alpine
RUN apk add --no-cache openssl libc6-compat

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Garante a geração do cliente para o ambiente Alpine
RUN npx prisma generate

EXPOSE 8000

# Se o seu arquivo principal em src for server.ts, o build gera server.js
# Se for index.ts, o build gera index.js. Ajuste abaixo conforme necessário:
CMD npx prisma migrate deploy --skip-generate && node dist/server.js