FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependências (apenas production)
RUN npm ci --only=production

# Copiar código fonte
COPY src ./src
COPY prisma ./prisma

# Build TypeScript
RUN npm run build

# Gerar Prisma Client
RUN npm run prisma:generate

# Expor porta (Coolify vai mapear)
EXPOSE 8000

# Comando de inicialização
CMD ["npm", "start"]
