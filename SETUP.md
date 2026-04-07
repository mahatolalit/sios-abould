# Setup Guide — SmartOps Internal Operations System

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | ≥ 20.x | [nodejs.org](https://nodejs.org) |
| npm | ≥ 10.x | Included with Node.js |
| Git | any | For cloning the repo |
| Prisma Postgres account | — | [console.prisma.io](https://console.prisma.io) — free tier available |

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-folder>
```

---

## 2. Configure Environment Variables

Create the backend environment file:

```bash
cp backend/.env.example backend/.env
```

> If `.env.example` doesn't exist, create `backend/.env` manually:

```env
# backend/.env

# Prisma Postgres connection string (from console.prisma.io)
DATABASE_URL="postgres://<user>:<password>@db.prisma.io:<port>/postgres?sslmode=require"

# JWT secret — change this in production
JWT_SECRET="your-secret-key-change-me"

# Backend port (optional, defaults to 3000)
PORT=3000
```

### Getting your `DATABASE_URL`

1. Go to [console.prisma.io](https://console.prisma.io)
2. Create a new project (e.g. `smart-ops`) in the region closest to you
3. Leave **connection pooling** and **Prisma Accelerate** **off**
4. Copy the connection string — it looks like:
   ```
   postgres://hash:sk_hash@db.prisma.io:5432/postgres?sslmode=require
   ```
5. Paste it as `DATABASE_URL` in `backend/.env`

---

## 3. Install All Dependencies

From the **root** of the project, run the single setup command:

```bash
npm run setup
```

This runs:
1. `npm install` — root tooling
2. `npm install --prefix backend` — backend dependencies
3. `npm install --prefix frontend` — frontend dependencies
4. `npx prisma generate` — generates the Prisma Client
5. `npx prisma db push` — creates all tables in your Postgres database

### Or step-by-step:

```bash
# Install all packages
npm run install:all

# Generate Prisma client + push schema to DB
npm run db:setup
```

---

## 4. Run the Application

```bash
npm run dev
```

This starts **both servers** in parallel:

| Server | URL | Description |
|--------|-----|-------------|
| Backend (Express) | http://localhost:3000 | REST API |
| Frontend (Vite/React) | http://localhost:5173 | UI |

---

## 5. Create Your First Account

1. Open http://localhost:5173/register
2. Enter your email, password, and select **Admin** role
3. You will be redirected to the Dashboard

> **Note:** The first registered user should be an `ADMIN`. Subsequent users can be any role.

---

## Project Structure

```
/
 backend/                  # Node.js + Express + Prisma
    prisma/
       schema.prisma     # Database schema
    prisma.config.ts      # Prisma v7 config (datasource + migrations path)
    src/
       app.ts            # Express server entry point
       controllers/      # Route handlers
       middlewares/      # Auth, RBAC, validation, idempotency
       routes/           # Route definitions
       services/         # Business logic
       utils/            # DB client (Prisma + pg adapter)
       validations/      # Zod input schemas
    .env                  # ← YOU CREATE THIS

 frontend/                 # React + Vite + TypeScript
    src/
       components/       # Layout, TaskCard, Modals
       contexts/         # AuthContext (JWT session)
       pages/            # Dashboard, Playbooks, Login, Register
       types/            # Shared TypeScript interfaces
       utils/            # apiFetch (auto auth + idempotency headers)
    index.html

 package.json              # Root monorepo scripts
 README.md
```

---

## Available Scripts (from root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend + frontend in parallel |
| `npm run setup` | Full first-time setup (install + DB init) |
| `npm run install:all` | Install all dependencies |
| `npm run db:setup` | Regenerate Prisma client + push schema |
| `npm run build` | Build both backend and frontend |

---

## API Overview

All API routes are prefixed with `http://localhost:3000/api`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login, returns JWT |

### Tasks _(requires Bearer token)_
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | List tasks (role-scoped, cursor-paginated) |
| POST | `/tasks` | Create task (+ idempotency key) |
| GET | `/tasks/:id` | Get task details |
| PATCH | `/tasks/:id/status` | Update task status (state machine) |
| DELETE | `/tasks/:id` | Soft-delete task (ADMIN/MANAGER only) |

### Playbooks _(requires Bearer token)_
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/playbooks` | List all playbooks |
| POST | `/playbooks` | Create playbook (ADMIN/MANAGER only) |
| DELETE | `/playbooks/:id` | Delete playbook (ADMIN only) |

### Users _(requires Bearer token, ADMIN/MANAGER only)_
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List all users (for assignee dropdown) |

---

## Troubleshooting

### Backend: `PrismaClientInitializationError`
- Ensure `DATABASE_URL` is set correctly in `backend/.env`
- Run `npm run db:setup` to regenerate the client

### `Cannot connect to database`
- Verify your Prisma Postgres project is active at [console.prisma.io](https://console.prisma.io)
- Check the connection string includes `?sslmode=require`

### Frontend: `fetch failed` on API calls
- Make sure the backend is running on port 3000
- Check CORS is not blocked (both servers should be started via `npm run dev`)

### Port conflicts
- Backend defaults to `3000`, frontend to `5173`
- To change backend port: set `PORT=XXXX` in `backend/.env`
