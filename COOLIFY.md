# 🚀 Deploy no Coolify com HTTPS

## Setup Rápido (10 minutos)

### 1. Preparar Repositório
```bash
cd new-api
git init
git add .
git commit -m "API Kaosekai - ready for Coolify"
git remote add origin https://seu-repo.git
git push -u origin main
```

### 2. No Dashboard do Coolify

**Novo Projeto → Selecionar Repositório**

**Configurar Deploy:**
- **Repository:** seu-repo/kaosekai-api
- **Branch:** main
- **Dockerfile:** Usar (já existe)

**Build Configuration:**
```
Build Command: npm run build && npm run prisma:generate
Start Command: npm start
Port: 8000
```

**Variáveis de Ambiente (.env):**
```env
NODE_ENV=production
PORT=8000
DATABASE_URL=postgresql://seu-usuario:sua-senha@seu-db-host:5432/kaosekai_db
JWT_SECRET=gere-com-openssl-rand-base64-32
JWT_EXPIRES_IN=30d
CORS_ORIGIN=https://app.seudominio.com,https://api.seudominio.com
```

### 3. Banco de Dados

**Opção A (Recomendado):** PostgreSQL do Coolify
- Criar serviço PostgreSQL no Coolify
- Copiar URL automática em DATABASE_URL

**Opção B:** Banco Externo
- Usar Render, Railway, Supabase, etc
- Copiar URL em DATABASE_URL

### 4. Configurar Rota (Domain/URL)

No Coolify, na seção **Domains:**

Para usar seu wildcard DNS:

```
Domínio: api.seudominio.com
Tipo: HTTP
Collify vai gerar HTTPS automaticamente com seu certificado wildcard
```

### 5. Executar Migrations

Após primeiro deploy:

**Via SSH do Coolify:**
```bash
npx prisma migrate deploy
npm run seed  # opcional - popular dados de teste
```

**Ou via Coolify Terminal:**
Acessar terminal do container e rodar:
```bash
cd /app
npx prisma migrate deploy
```

### 6. Verificar Deploy

```bash
# Health check
curl https://api.seudominio.com/api

# Deve retornar:
# {"status":"ok","message":"API is running"}
```

### 7. Atualizar Frontend

Em `ficha-rpg-kaosekai/src/services/api.ts`:

```typescript
const api = axios.create({
  baseURL: 'https://api.seudominio.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});
```

## ✅ Checklist Final

- [ ] Repositório Git criado e sincronizado
- [ ] Dockerfile commitado
- [ ] Projeto criado no Coolify
- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado/conectado
- [ ] Deploy realizado com sucesso
- [ ] Build verde (✓)
- [ ] Migrations executadas
- [ ] Domínio `api.seudominio.com` apontando
- [ ] HTTPS funcionando
- [ ] Health check respondendo
- [ ] Frontend atualizado com novo baseURL

## 🔐 Segurança Produção

```env
NODE_ENV=production          # CRÍTICO
JWT_SECRET=algo-muito-forte  # Gerar: openssl rand -base64 32
CORS_ORIGIN=domínio-real     # Não usar localhost
```

## 📝 Gerar JWT_SECRET Forte

```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Random -Count 32 | ForEach-Object {[char]$_}) -join ''))

# Ou online: https://generate-random.org/ (32 caracteres)
```

## Troubleshooting

**Build falhando:**
- Verificar logs no Coolify
- `npm run build` funciona localmente?

**Migrations falhando:**
- Banco de dados criado e acessível?
- DATABASE_URL está correta?

**CORS error:**
- CORS_ORIGIN inclui exatamente `https://app.seudominio.com`?

**HTTPS não funciona:**
- Certificado wildcard está configurado no Coolify?
- DNS apontando para IP do Coolify?

## URLs Finais

```
API: https://api.seudominio.com
Frontend: https://app.seudominio.com
```

Pronto! 🎉
