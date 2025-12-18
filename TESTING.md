# 🧪 Testes Manuais da API

## Endpoints de Autenticação

### 1. Health Check
```bash
curl http://localhost:8000/api
```

**Resposta esperada (200):**
```json
{
  "status": "ok",
  "message": "API is running"
}
```

---

### 2. Registro de Usuário
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "email": "joao@test.com",
    "password": "senha123"
  }'
```

**Resposta esperada (201):**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@test.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

**Guarde o `access_token` para os próximos testes!**

---

### 3. Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@test.com",
    "password": "senha123"
  }'
```

**Resposta esperada (200):**
```json
{
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@test.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer"
}
```

---

### 4. Obter Usuário Autenticado
```bash
curl http://localhost:8000/api/user \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "id": 1,
  "name": "João Silva",
  "email": "joao@test.com"
}
```

---

## Endpoints de Personagens

**IMPORTANTE:** Substitua `SEU_TOKEN_AQUI` pelo token obtido no login/registro!

### 5. Criar Personagem
```bash
curl -X POST http://localhost:8000/api/characters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "data": {
      "name": "Kael",
      "playerName": "João",
      "characterImage": null,
      "stats": {
        "body": 2,
        "senses": 3,
        "mind": 1,
        "soul": 2
      },
      "hp": { "current": 20, "max": 20 },
      "determination": { "current": 5, "max": 5 },
      "rd": 0,
      "block": 10,
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
  }'
```

**Resposta esperada (201):**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Kael",
  "data": { ... },
  "created_at": "2025-12-17T...",
  "updated_at": "2025-12-17T..."
}
```

---

### 6. Listar Personagens
```bash
curl http://localhost:8000/api/characters \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
[
  {
    "id": 1,
    "user_id": 1,
    "name": "Kael",
    "data": { ... },
    "created_at": "2025-12-17T...",
    "updated_at": "2025-12-17T..."
  }
]
```

---

### 7. Obter Personagem Específico
```bash
curl http://localhost:8000/api/characters/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Kael",
  "data": { ... },
  "created_at": "2025-12-17T...",
  "updated_at": "2025-12-17T..."
}
```

---

### 8. Atualizar Personagem
```bash
curl -X PUT http://localhost:8000/api/characters/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "data": {
      "name": "Kael - O Bravo",
      "playerName": "João",
      "characterImage": null,
      "stats": {
        "body": 3,
        "senses": 3,
        "mind": 1,
        "soul": 2
      },
      "hp": { "current": 25, "max": 25 },
      "determination": { "current": 5, "max": 5 },
      "rd": 1,
      "block": 12,
      "skills": [],
      "conditions": [],
      "attacks": [],
      "abilities": [],
      "feats": [],
      "notes": "Subiu de nível!",
      "origin": "",
      "investigationNotes": [],
      "inventory": [],
      "credits": 50
    }
  }'
```

**Resposta esperada (200):**
```json
{
  "id": 1,
  "user_id": 1,
  "name": "Kael - O Bravo",
  "data": { ... },
  "created_at": "2025-12-17T...",
  "updated_at": "2025-12-17T..." (atualizado)
}
```

---

### 9. Deletar Personagem
```bash
curl -X DELETE http://localhost:8000/api/characters/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "message": "Personagem deletado."
}
```

---

### 10. Logout
```bash
curl -X POST http://localhost:8000/api/logout \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**Resposta esperada (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

## 🔴 Testes de Erro

### Tentar acessar endpoint protegido sem token
```bash
curl http://localhost:8000/api/characters
```

**Resposta esperada (401):**
```json
{
  "message": "Unauthenticated."
}
```

---

### Tentar login com credenciais inválidas
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@test.com",
    "password": "senhaerrada"
  }'
```

**Resposta esperada (401):**
```json
{
  "message": "The provided credentials are incorrect."
}
```

---

### Tentar registrar email duplicado
```bash
curl -X POST http://localhost:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Outro João",
    "email": "joao@test.com",
    "password": "senha123"
  }'
```

**Resposta esperada (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

---

### Tentar acessar personagem de outro usuário
```bash
# Crie outro usuário, pegue o token, e tente acessar ID de outro user
curl http://localhost:8000/api/characters/1 \
  -H "Authorization: Bearer TOKEN_DE_OUTRO_USUARIO"
```

**Resposta esperada (404):**
```json
{
  "message": "Character not found."
}
```

---

## ✅ Checklist de Validação

- [ ] Health check retorna 200
- [ ] Registro cria usuário e retorna token
- [ ] Login retorna token válido
- [ ] GET /api/user retorna dados do usuário
- [ ] Criar personagem funciona
- [ ] Listar personagens retorna array
- [ ] Obter personagem específico funciona
- [ ] Atualizar personagem funciona
- [ ] Deletar personagem funciona
- [ ] Logout invalida token
- [ ] Endpoints protegidos retornam 401 sem token
- [ ] Login com senha errada retorna 401
- [ ] Email duplicado retorna 422
- [ ] Usuário só acessa seus próprios personagens
- [ ] Timestamps são ISO8601
- [ ] CORS permite localhost:5173

---

## 🎯 Compatibilidade com Frontend

Para testar com o frontend Vue.js:

1. Certifique-se que a API está rodando em `http://localhost:8000`
2. No frontend, altere a baseURL em `src/services/api.ts`:
   ```typescript
   const api = axios.create({
     baseURL: 'http://localhost:8000/api',
   });
   ```
3. Inicie o frontend: `npm run dev`
4. Teste login/registro e criação de personagens
5. Verifique que o autosave funciona (2s de debounce)
