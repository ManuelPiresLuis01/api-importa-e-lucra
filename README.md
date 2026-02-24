# Importa e Lucra (frontend + backend)

Este repositório contém o código completo da aplicação, incluindo o frontend React/Vite e a API Node.js/Express.

---

## Frontend

O frontend está numa subpasta `importa-e-lucra` e utiliza Vite, React, TypeScript e Tailwind.

### Desenvolvimento

```sh
cd importa-e-lucra
npm install
npm run dev
```
O servidor de desenvolvimento irá iniciar em `http://localhost:5173`.

### Variáveis de ambiente

- `VITE_API_URL` deve apontar para a API (por exemplo `http://localhost:5000`).
- durante desenvolvimento o servidor Vite já está configurado para proxy `/api` para este endereço, por isso você pode deixar a variável vazia e simplesmente usar o caminho relativo (`/api/submit`).

### Construção

```sh
npm run build
```

---

## Backend

A API em Node.js recebe os formulários do frontend, armazena-os no MongoDB e envia emails de confirmação.

### Setup

1. Copie o ficheiro de exemplo:
   ```sh
   cp .env.example .env
   ```
2. Preencha os valores:
   - `MONGO_URI` – string de ligação ao MongoDB.
   - `ADMIN_EMAIL` – email que receberá notificações.
   - Configuração SMTP (`EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`).
3. Instale dependências:
   ```sh
   npm install
   ```

### Running

- Development (auto‑reinício):
  ```sh
  npm run dev
  ```
- Production:
  ```sh
  npm start
  ```

A API escuta no porto de `PORT` (por defeito 5000) e dispõe do simples endpoint:

```
POST /api/submit
Content-Type: multipart/form-data
```

Campos do formulário:

- `name` (string)
- `email` (string)
- `phone` (string)
- `tipo_formacao` (string: "presencial" ou "online")
- `file` (upload)

Depois de receber a submissão a API:

1. valida os campos e guarda um documento em MongoDB;
2. move o ficheiro para a pasta `uploads/`;
3. envia um email HTML de confirmação ao utilizador;
4. envia um email HTML ao `ADMIN_EMAIL` com os dados e o ficheiro em anexo.
