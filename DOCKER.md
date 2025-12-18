# 🐳 Setup Docker PostgreSQL

## Iniciar Banco de Dados

```bash
docker-compose up -d
```

Isso vai:
- ✅ Baixar PostgreSQL 15 (Alpine Linux - leve)
- ✅ Criar container `kaosekai-postgres`
- ✅ Expor porta 5432
- ✅ Criar database `kaosekai_db`
- ✅ Usar credenciais: `kaosekai / kaosekai123`
- ✅ Persistir dados em volume Docker

## Verificar Status

```bash
docker-compose ps
```

## Ver Logs

```bash
docker-compose logs -f postgres
```

## Parar Banco

```bash
docker-compose down
```

## Parar e Remover Dados

```bash
docker-compose down -v
```

## Comandos Após Docker Rodando

1. **Executar migrations:**
   ```bash
   npm run prisma:migrate
   ```

2. **Popular com dados teste:**
   ```bash
   npm run seed
   ```

3. **Iniciar API:**
   ```bash
   npm run dev
   ```

## Acessar PostgreSQL Direto

```bash
docker exec -it kaosekai-postgres psql -U kaosekai -d kaosekai_db
```

Comandos úteis no psql:
- `\dt` - Listar tabelas
- `\d users` - Descrever tabela users
- `SELECT * FROM users;` - Ver usuários
- `\q` - Sair
