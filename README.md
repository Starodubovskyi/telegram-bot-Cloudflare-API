# Cloudflare Telegram Bot (Node.js + React + Cloudflare API)


> Розробка Telegram Бота на Node.js з інтеграцією Cloudflare API

## Коротко по стеку

- **Backend**: Node.js, TypeScript, Express, Telegraf, MongoDB (Atlas).
- **Frontend**: React, Vite, TypeScript, Ant Design.
- **Інтеграція**: Cloudflare API (зони + DNS записи).

Архітектура розділена нормально:

- `backend/src/modules/*` — домени, користувачі, Cloudflare‑сервіс, бот, вебхуки.
- `frontend/src` — окремо `api/`, `layout/`, `components/`, головний `App.tsx`.

---

## Основний функціонал

### Telegram‑бот

- Працює тільки в одному чаті (`TELEGRAM_ALLOWED_CHAT_ID` з `.env`).
- Додатково є whitelist користувачів у MongoDB (колекція `users`):
  - якщо користувача немає в whitelist — бот відповідає, що доступ закритий;
  - whitelist керується через адмінку (React + AntD).
- Команди:
  - `/start` — привітання + опис команд;
  - `/help` — список доступних команд;
  - `/register_domain example.com` — створення зони в Cloudflare, збереження в MongoDB, вивід NS серверів;
  - `/dns_add example.com A 1.2.3.4` — створення DNS запису;
  - `/dns_update zoneId recordId A 5.6.7.8` — оновлення DNS запису;
  - `/dns_delete zoneId recordId` — видалення DNS запису;
  - `/domains` — короткий список доменів, які вже зареєстровані через бота.

### Express‑сервер

- REST API:
  - `GET /api/users` — список whitelist‑користувачів;
  - `POST /api/users` — додати користувача (username або telegramId);
  - `DELETE /api/users/:id` — видалити користувача.
- Всі `/api/users` маршрути захищені заголовком `X-Admin-Key` (значення з `ADMIN_API_KEY`).
- Вебхуки:
  - `GET /webhook/test` — надсилає в Telegram чат дані про запит (метод, IP, query);
  - `POST /webhook/test` — те саме, але з `body`.

### Frontend (React + Ant Design)

- Проста адмін‑панель:
  - поле для введення `ADMIN_API_KEY`;
  - після успішної перевірки — таблиця whitelist‑користувачів і форма для додавання нового;
  - все оформлено через Ant Design `Layout`, `Form`, `Table`, `Button`.

### База даних

- **MongoDB Atlas** або локальна MongoDB.
- Моделі:
  - `User` — whitelist користувачів (username/telegramId);
  - `Domain` — домени, зареєстровані через Cloudflare.

### Секрети

Всі ключі і конфіденційні дані лежать в `.env`:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALLOWED_CHAT_ID`
- `MONGODB_URI`
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `ADMIN_API_KEY`

Файл `.env` в репозиторій не комітиться, є тільки `.env.example`.

---

## Як запускати

### 1. MongoDB

Якщо Atlas — просто виставити доступ по IP і зібрати URI.

Наприклад:

```env
MONGODB_URI=mongodb+srv://yulian:guzanu2001@cluster0.ins3yk1.mongodb.net/cloudflare-bot?retryWrites=true&w=majority
```

або будь‑яка інша твоя строка під свою базу.

### 2. Backend

```bash
cd backend
cp .env.example .env
# заповнюєш .env своїми значеннями
npm install
npm run dev
```

Сервер буде на `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Відкриваєш `http://localhost:5173`.

При бажанні можна задати URL бекенда у `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
```

