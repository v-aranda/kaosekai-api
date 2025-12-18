# Kaosekai API - Node.js/Express

API de gerenciamento de fichas de personagens RPG recriada em Node.js/Express com TypeScript, Prisma ORM e autenticação JWT.

## 🚀 Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **Prisma ORM** - Database ORM
- **PostgreSQL** - Banco de dados principal (jsonb support)
- **JWT** - Autenticação via JSON Web Tokens
- **Bcrypt** - Hash de senhas
- **Zod** - Validação de schemas

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+ (ou SQLite para desenvolvimento)
- npm ou yarn

## 🔧 Instalação

### 1. Instalar dependências

```bash
cd new-api
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e configure suas variáveis:

```env
PORT=8000
NODE_ENV=development

# PostgreSQL (produção)
DATABASE_URL="postgresql://user:password@localhost:5432/kaosekai_db?schema=public"

# Ou SQLite (desenvolvimento)
# DATABASE_URL="file:./dev.db"

JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="30d"

CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```

### 3. Configurar banco de dados

**Para PostgreSQL:**
```bash
# Criar database
createdb kaosekai_db

# Executar migrations
npm run prisma:migrate
```

**Para SQLite (desenvolvimento rápido):**
```bash
# Apenas executar push (cria as tabelas automaticamente)
npm run prisma:push
```

### 4. Gerar Prisma Client

```bash
npm run prisma:generate
```

## ▶️ Executar

### Modo desenvolvimento (hot reload)
```bash
npm run dev
```

### Build para produção
```bash
npm run build
npm start
```

## 📚 Endpoints da API

Base URL: `http://localhost:8000/api`

### Autenticação (Público)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api` | Health check |
| POST | `/api/register` | Registrar novo usuário |
| POST | `/api/login` | Login de usuário |

### Autenticação (Protegido)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/user` | Obter usuário autenticado |
| POST | `/api/logout` | Logout (invalida token) |

### Personagens (Protegido)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/characters` | Listar personagens do usuário |
| POST | `/api/characters` | Criar novo personagem |
| GET | `/api/characters/:id` | Obter personagem específico |
| PUT/PATCH | `/api/characters/:id` | Atualizar personagem (autosave) |
| DELETE | `/api/characters/:id` | Deletar personagem |

## 🔐 Autenticação

A API usa **JWT (JSON Web Tokens)** para autenticação.

**Headers necessários:**
```
Content-Type: application/json
Accept: application/json
Authorization: Bearer {token}
```

**Fluxo:**
1. Registrar ou fazer login → recebe `access_token`
2. Armazenar token no localStorage do frontend
3. Enviar token no header `Authorization: Bearer {token}` em requisições protegidas

## 📝 Exemplos de Requisições

### Registro
```bash
POST /api/register
Content-Type: application/json

{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

### Login
```bash
POST /api/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "password": "senha123"
}
```

### Criar Personagem
```bash
POST /api/characters
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "name": "Aragorn",
    "playerName": "João",
    "stats": {
      "body": 3,
      "senses": 2,
      "mind": 2,
      "soul": 3
    },
    "hp": { "current": 30, "max": 30 },
    "determination": { "current": 5, "max": 5 },
    "rd": 0,
    "block": 0,
    "skills": [],
    "conditions": [],
    "attacks": [],
    "abilities": [],
    "feats": [],
    "notes": "",
    "origin": "",
    "investigationNotes": [],
    "inventory": [],
    "credits": 0
  }
}
```

### Atualizar Personagem (Autosave)
```bash
PUT /api/characters/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "data": {
    "name": "Aragorn",
    "hp": { "current": 25, "max": 30 },
    ...
  }
}
```

## 🗄️ Schema do Banco de Dados

### Tabela `users`
- `id` - BigInt (PK)
- `name` - String
- `email` - String (único)
- `password` - String (hash bcrypt)
- `created_at`, `updated_at` - Timestamps

### Tabela `characters`
- `id` - BigInt (PK)
- `user_id` - BigInt (FK → users.id, CASCADE DELETE)
- `name` - String
- `data` - JSONB (toda estrutura do personagem)
- `created_at`, `updated_at` - Timestamps

### Tabela `personal_access_tokens`
- `id` - BigInt (PK)
- `user_id` - BigInt (FK → users.id, CASCADE DELETE)
- `token` - String (hash SHA-256, único)
- `last_used_at`, `expires_at` - Timestamps

## 🔄 Migração do Laravel

### Se você tem dados existentes no Laravel:

1. **Exportar dados do Laravel:**
```bash
cd ../kaosekai-api
php artisan tinker

# Exportar usuários e personagens para JSON
User::with('characters')->get()->toJson();
```

2. **Criar script de importação** (adicione em `src/scripts/import.ts`):
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const laravelData = require('./laravel-export.json');

async function importData() {
  for (const user of laravelData) {
    const newUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: user.password, // já está hasheado
        createdAt: new Date(user.created_at),
      }
    });
    
    for (const char of user.characters) {
      await prisma.character.create({
        data: {
          userId: newUser.id,
          name: char.name,
          data: char.data,
          createdAt: new Date(char.created_at),
        }
      });
    }
  }
}

importData();
```

## 🛠️ Scripts Úteis

```bash
# Desenvolvimento com hot reload
npm run dev

# Build
npm run build

# Produção
npm start

# Prisma Studio (GUI para banco)
npm run prisma:studio

# Criar nova migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset

# Gerar Prisma Client
npm run prisma:generate
```

## 🔍 Compatibilidade com Frontend

Esta API é **100% compatível** com o frontend Vue.js existente em `ficha-rpg-kaosekai/`.

**Mudanças necessárias no frontend:**

1. Atualizar a base URL em `src/services/api.ts`:
```typescript
const BASE_URL = 'http://localhost:8000/api'; // era: http://localhost/api
```

2. **Nenhuma outra mudança é necessária!** 🎉

Todos os endpoints, formatos de resposta e códigos de status são idênticos ao Laravel.

## 🐛 Debug

### Ver logs do Prisma:
```bash
DEBUG=prisma:* npm run dev
```

### Verificar queries SQL:
Edite `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

## 📦 Estrutura de Pastas

```
new-api/
├── prisma/
│   └── schema.prisma          # Schema do banco
├── src/
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   └── CharacterController.ts
│   ├── middleware/
│   │   └── auth.ts            # Middleware JWT
│   ├── routes/
│   │   └── api.ts             # Definição de rotas
│   ├── utils/
│   │   └── token.ts           # Helpers de token
│   ├── types.ts               # TypeScript types
│   └── server.ts              # Servidor principal
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Deploy

### Variáveis de ambiente de produção:
```env
NODE_ENV=production
PORT=8000
DATABASE_URL="postgresql://..."
JWT_SECRET="production-secret-key-very-long-and-random"
CORS_ORIGIN="https://seu-dominio.com"
```

### Recomendações:
- Use variáveis de ambiente seguras
- Configure HTTPS
- Use PostgreSQL em produção
- Configure rate limiting (adicione express-rate-limit)
- Configure helmet para segurança
- Use PM2 ou similar para gerenciar o processo

## 📄 Licença

MIT

## 👨‍💻 Autor

Recriação da API Laravel original em Node.js/Express.
