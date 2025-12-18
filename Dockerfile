# Estágio 1: Build (Onde instalamos tudo e compilamos)
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo TypeScript)
RUN npm install

COPY src ./src

# Gera o cliente do Prisma e faz o build do TS
RUN npx prisma generate
RUN npm run build

# Estágio 2: Runner (Imagem final, apenas com o necessário)
FROM node:18-alpine

WORKDIR /app

# Copiamos apenas os arquivos necessários do estágio anterior
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

# Garante que o Prisma Client está disponível na imagem final
RUN npx prisma generate

EXPOSE 8000

# Usamos node diretamente para performance, ou npm start se preferir
CMD ["node", "dist/index.js"]