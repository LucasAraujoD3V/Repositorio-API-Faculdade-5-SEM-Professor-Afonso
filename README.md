# Repositorio-API-Faculdade-5-SEM-Professor-Afonso

API de **cadastro de tecnologias de programação** em Node.js + Express + MongoDB (Mongoose),
com login por token JWT.

## Como rodar

1. Copie o `.env.example` para `.env` e preencha:
   ```
   PORT=3003
   MONGO_URL=mongodb+srv://USUARIO:SENHA@cluster0.xxxxx.mongodb.net/
   DB_NAME=tecnologias
   JWT_SECRET=sua_chave_secreta
   ADMIN_USER=seu_usuario
   ADMIN_PASSWORD=sua_senha
   ```
   No MongoDB Atlas, libere seu IP em **Network Access**.
2. Instale e rode:
   ```
   npm install
   npm run seed     # (opcional) coloca 3 tecnologias de teste
   npm start
   ```
3. Abra **http://localhost:3003**

Na página, cada requisição aparece na lista **"Requisicoes"**:
método (GET/POST/PUT/DELETE), URL, status (200, 201, 400, 401, 404, 409...),
**SUCESSO** em verde ou **ERRO** em vermelho, e a resposta da API.

## Tecnologia

| Campo | Tipo | Exemplo |
|---|---|---|
| nome | texto (único) | React |
| base | texto | JS, PHP, C# |
| curvaAprendizado | número (meses) | 3 |

## Rotas

| Método | Rota | Precisa de token? |
|---|---|---|
| GET | /status | não |
| POST | /login `{ "usuario", "senha" }` | não |
| GET | /tecnologias | não |
| GET | /tecnologias/:id | não |
| POST | /tecnologias | **sim** |
| PUT | /tecnologias/:id | **sim** |
| DELETE | /tecnologias/:id | **sim** |

O login usa o `ADMIN_USER` e `ADMIN_PASSWORD` do `.env` e devolve um token (vale 1h).
Envie o token no header: `Authorization: Bearer SEU_TOKEN`.

## Postman

Importe o arquivo `postman/API-Tecnologias.postman_collection.json`.
Em **Variables**, coloque `usuario` e `senha` iguais ao `.env`.
Rode o **Login** (salva o token) e depois o **Cadastrar** (salva o id).
Também tem requisições prontas de **erro** (401, 400, 404, 409).
