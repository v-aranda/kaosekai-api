# 🚀 Quick Start - Kaosekai API Node.js

## Setup Rápido (5 minutos)

### 1. Instalar Dependências
```bash
cd new-api
npm install
```

### 2. Configurar Banco de Dados

**Opção A - PostgreSQL (Recomendado para produção)**
```bash
# Criar database
createdb kaosekai_db

# Executar migrations
npm run prisma:migrate
```

**Opção B - SQLite (Desenvolvimento rápido)**
```bash
# Editar .env e mudar para:
# DATABASE_URL="file:./dev.db"

# Push schema
npm run prisma:push
```

### 3. Popular com Dados de Teste (Opcional)
```bash
npm run seed
```

Credenciais:
- Email: `teste@kaosekai.com`
- Senha: `password123`

### 4. Iniciar Servidor
```bash
npm run dev
```

API rodando em: `http://localhost:8000`

## 🧪 Testar API

### Registro
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"123456"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
```

### Listar Personagens (substitua TOKEN)
```bash
curl http://localhost:8000/api/characters \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Comandos Úteis

- `npm run dev` - Desenvolvimento com hot reload
- `npm run build` - Build para produção
- `npm start` - Rodar build de produção
- `npm run prisma:studio` - Interface visual do banco
- `npm run seed` - Popular banco com dados teste
- `npm run migrate:laravel` - Migrar do Laravel (configure LARAVEL_DATABASE_URL no .env)

## 📝 Variáveis de Ambiente (.env)

```env
PORT=8000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kaosekai_db"
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="30d"
CORS_ORIGIN="http://localhost:5173,http://localhost:3000"
```

## 🔄 Migrar do Laravel

1. Configure a URL do banco Laravel no `.env`:
```env
LARAVEL_DATABASE_URL="mysql://user:pass@localhost:3306/laravel_db"
```

2. Execute a migração:
```bash
npm run migrate:laravel
```

## ✅ Verificar se Está Funcionando

Abra no navegador: http://localhost:8000

Você deve ver a documentação da API.

## 🎯 Próximos Passos

1. Configurar frontend para usar `http://localhost:8000/api`
2. Alterar `JWT_SECRET` no `.env` para uma chave forte
3. Configurar PostgreSQL para produção
4. Adicionar variáveis de ambiente de produção
