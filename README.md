# SmartOps — Smart Internal Operations Management System

> A production-grade internal operations platform built for engineering teams who need structured task tracking, accountable workflows, and automated SOPs — not just a to-do list.

---

## What Is This?

SmartOps is a full-stack monorepo application that solves a real problem: **internal teams operating without visibility, accountability, or workflow structure.**

It was built in response to an open-ended engineering assignment. Rather than producing the minimum viable submission, this implementation deliberately exceeded the scope — treating the assignment as a real product build, not an exercise.

---

## Assignment Requirements — All Met

| Requirement | Status | Notes |
|---|---|---|
| JWT Authentication (signup/login) | ✅ | Secure bcrypt hashing + JWT with expiry |
| 3 Roles: Admin, Manager, User | ✅ | Full RBAC at middleware + service layers |
| Core Module (Task Management) | ✅ | Kanban board with 4-stage state machine |
| Create / Update / Assign / Track | ✅ | Full task lifecycle in UI and API |
| REST APIs with validation | ✅ | Zod schemas on every POST/PATCH |
| Proper error handling | ✅ | Centralised error middleware |
| Well-structured DB schema | ✅ | Prisma ORM with relational models on Postgres |

---

##  Above & Beyond — Features I Added

These are features that were **not in the requirements** but were added deliberately to solve real engineering problems:

---

### 1.  Playbooks — Automated SOP System *(Invented Feature)*

**What it is:** Playbooks are Standard Operating Procedure documents written in Markdown. They are attached to tasks and are **automatically triggered via webhook** when a task transitions to a specific state (e.g. when a task enters `IN_REVIEW`, fire a webhook to your incident management tool).

**Why I built it:**
The assignment mentioned "notifications" as a suggestion. Instead of building a basic email notification, I designed a **webhook-based SOP trigger** — a pattern used by real ops platforms like PagerDuty and Linear. This solves the problem of "what happens next?" when a task changes state. It makes workflow automation extensible without tying the system to any specific notification provider.

**What problem it solves:**
- Teams forget what to do at each stage of a workflow
- Manual escalations are unreliable
- Integrating with Slack/email/JIRA requires custom logic per tool — webhooks solve this generically

---

### 2.  Task State Machine *(Not Just Status Fields)*

Status is **not a free-form field** — it follows enforced transitions:

```
TODO → IN_PROGRESS → IN_REVIEW → DONE
             ↑____________↓
```

Invalid transitions (e.g. jumping from `TODO` to `DONE`) are **rejected at the service layer**, not just the UI. This is how real project management systems work.

---

### 3.  Idempotency Key Middleware

Every `POST /tasks` request requires an `Idempotency-Key` header, which the frontend auto-generates. The backend middleware **deduplicates requests** using an in-memory store — so if a user double-clicks "Create Task" or a network retry fires, only one task is created.

This is a pattern borrowed from payment processing APIs (Stripe, Braintree) applied to task creation.

---

### 4.  Role-Scoped Data Isolation

Tasks are not just tagged with roles — they are **filtered at the database query level**:

| Role | Sees |
|------|------|
| `ADMIN` | All tasks in the system |
| `MANAGER` | Tasks they created **or** are assigned to |
| `USER` | Only tasks assigned to them |

This is enforced in the `TaskService` layer, not just the frontend.

---

### 5.  Full-Featured React Frontend *(Glass Design System)*

The frontend is not a default template. It includes:

- **Glassmorphism UI** with a curated dark colour palette (HSL-based, no generic colours)
- **Sidebar navigation** with role-aware links (Playbooks hidden from `USER` role)
- **Role badge colour coding** — purple for Admin, green for Manager, blue for User
- **Kanban board** with 4 swimlane columns, per-column task counts, and empty states
- **Task cards** showing: status badge, creator, assignee, playbook tag, and a role-gated delete button
- **Playbooks page** with creation modal (Markdown editor), trigger state selector, webhook URL
- **NewTaskModal** with assignee dropdown + playbook selector (auto-fetched, ADMIN/MANAGER only)
- **PlaybookModal** with Markdown rendering, state-machine-aware action buttons, delete (role-gated)
- **Cursor-based "Load More" pagination** connected to the backend's `nextCursor` response

---

### 6.  Prisma Postgres (Cloud DB, Zero Local Setup)

Rather than shipping with SQLite or requiring a local PostgreSQL install, the database runs on **Prisma's managed Postgres service**. The only setup step is pasting a connection string — no `pg_ctl start`, no local Docker, no devops.

---

## Architecture

```
     HTTP/REST      
   React + Vite          Express + TypeScript 
   (Port 5173)                            (Port 3000)          
                                                                
  AuthContext (JWT)                       Middlewares:          
  Sidebar nav                             - JWT Auth            
  Kanban board                            - RBAC                
  Playbooks page                          - Zod Validation      
  Role-aware UI                           - Idempotency         
                     - Error Handler       
                                                                  
                                            Services:             
                                            - TaskService         
                                            - WebhookService      
                                          
                                                      Prisma ORM
                                                      (pg adapter)
                                          
                                            Prisma Postgres        
                                            (Cloud — db.prisma.io) 
                                          
```

---

## Database Schema

```
User  createdTasks  Task  assignedTasks  User
                                    
                                     Playbook
```

| Model | Key Fields |
|-------|-----------|
| `User` | `id`, `email`, `passwordHash`, `role` (ADMIN/MANAGER/USER), `deletedAt` |
| `Task` | `id`, `title`, `description`, `status` (4-state enum), `creatorId`, `assignedTo`, `playbookId`, `deletedAt` |
| `Playbook` | `id`, `title`, `contentMarkdown`, `webhookUrl`, `triggerState`, `deletedAt` |

All models use **soft deletes** (`deletedAt`) — nothing is permanently destroyed.

---

## Key Engineering Decisions

### Why Prisma v7 + pg adapter?
Prisma v7 moved to a Rust-free architecture requiring a JS driver adapter. Using `@prisma/adapter-pg` gives native `postgres://` connectivity without the Prisma Accelerate proxy.

### Why Webhook-based Playbooks over notifications?
Notifications are a closed system — you'd need to build an email/Slack integration per channel. Webhooks let the SOP trigger integrate with *any* tool the team already uses (Slack, PagerDuty, Zapier, n8n), making the system extensible by design.

### Why Soft Deletes everywhere?
Operational data should never be permanently deleted without a grace period. Soft deletes allow audit trails and recovery without a separate history table.

### Why Cursor-based Pagination?
Offset-based pagination (`LIMIT 10 OFFSET 100`) degrades on large tables. Cursor-based pagination (`WHERE id > cursor LIMIT 10`) is O(log n) regardless of dataset size.

---

## What I Intentionally Did NOT Build

| Feature | Reason |
|---------|--------|
| Activity/audit logs | Would require a separate `ActivityLog` table and background worker — adds significant scope |
| Comments system | Nice-to-have, but not core to operational workflow |
| Search & filtering | UI filters could be added with minimal backend changes (`WHERE title LIKE ?`) — saved for iteration |
| Email notifications | Solved more generically via the Playbook webhook system |
| Swagger/OpenAPI docs | Time trade-off — the API structure is self-documenting via the route/controller/schema pattern |

---

## Scaling Strategy

**At 10,000+ users, what breaks first?**

1. **The idempotency store is in-memory** — this is the most critical bottleneck. It works on a single server but fails on multi-instance deployments. Fix: replace with a Redis-backed store (`SET NX EX`).

2. **Webhook delivery is synchronous fire-and-forget** — at scale, slow webhooks would block the event loop. Fix: push webhook jobs to a queue (BullMQ + Redis) and process with a dedicated worker.

3. **Cursor pagination is per-request** — no caching of task lists. Fix: add Redis caching on `GET /tasks` with cache invalidation on task mutations.

4. **Single Postgres instance** — Prisma Postgres is managed but still a single write node. Fix: read replicas for `GET` queries.

---

## If I Had 2 More Days

1. **Activity feed** — a `TaskEvent` table logging every status change, assignment, and deletion, rendered as a timeline inside the PlaybookModal
2. **Real-time updates** — WebSocket or SSE push so the Kanban board updates live when a teammate changes a task status
3. **Search + filter bar** — title search and filter-by-assignee on the dashboard
4. **Swagger/OpenAPI** — auto-generated from the Zod schemas using `zod-to-openapi`
5. **E2E tests** — Playwright tests for the critical flows: register → create task → advance to DONE

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Vanilla CSS (Glassmorphism) |
| State | React Context (AuthContext) |
| Routing | react-router-dom v7 |
| Backend | Node.js, Express, TypeScript, ts-node |
| Validation | Zod |
| ORM | Prisma v7 + `@prisma/adapter-pg` |
| Database | Prisma Postgres (managed cloud PostgreSQL) |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Icons | lucide-react |
| Markdown | react-markdown |

---

## Setup

See [SETUP.md](./SETUP.md) for full step-by-step instructions.

**Quick start:**
```bash
# 1. Configure backend/.env with your DATABASE_URL and JWT_SECRET
# 2. Run:
npm run setup   # installs everything + creates DB tables
npm run dev     # starts backend :3000 and frontend :5173
```
