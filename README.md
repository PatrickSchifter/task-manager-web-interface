<div align="center">

# 💠 Solut Tasks — Web Interface

### The frontend for a task management SaaS you can actually *talk to*

[![Live Demo](https://img.shields.io/badge/live-tasks.solutlabs.com.br-2ea44f?style=flat-square)](https://tasks.solutlabs.com.br)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=000)](https://react.dev)
[![MUI](https://img.shields.io/badge/MUI-9-007fff?style=flat-square&logo=mui)](https://mui.com)
[![Coverage](https://img.shields.io/badge/coverage-98%25-2ea44f?style=flat-square&logo=vitest&logoColor=fff)](#-testing)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](#license)

**🔗 Live in production → [tasks.solutlabs.com.br](https://tasks.solutlabs.com.br)**

</div>

---

## 👋 Overview

This is the web client for **Solut Tasks** — a full SaaS platform where teams organize projects, tasks, comments, and **personal routines**, with a built-in **AI assistant** you can simply *talk to*:

> *"What are my high-priority tasks this week?"*
> *"What's blocking the team right now?"*
> *"Which tasks are overdue?"*
> *"What morning routines do I have scheduled?"*

The frontend owns the entire user-facing experience: a real-time collaborative **Kanban board**, the **AI chat** interface, a **personal routines tracker**, authentication, and every screen from landing page to dashboard. It's a thin-but-serious client — sensitive data is fetched on the server, the JWT never touches client-side JavaScript, and the API contract is type-safe end to end.

It's **live in production**, deployed on cloud infrastructure with automated CI/CD, and pairs with a NestJS + Prisma + RabbitMQ backend that powers the AI (RAG) pipeline.

> _Note: the product UI is in Brazilian Portuguese (pt-BR) by design. This README is in English to reach an international audience._

### Why this project is interesting

| | |
|---|---|
| 🤖 **Talk to your data** | A real AI chat UI that answers questions about your own projects and tasks — grounded in your data, with **real-time WebSocket delivery** of answers and HTTP polling as an automatic fallback. |
| 🔒 **Secure by design** | The session lives in an `HttpOnly` cookie (immune to XSS) and routes are guarded at the edge `middleware`. Authenticated data is fetched server-side and never exposed to the browser. |
| 🧩 **Type-safe to the contract** | The entire API layer is typed from the backend's **OpenAPI** schema — the frontend literally cannot drift from the API without TypeScript complaining. |
| ☁️ **Actually shipped** | Not a toy demo — it's deployed, reachable at a real domain, with automated build-and-deploy on every push to `main`. |
| ⚡ **Modern Next.js, done right** | App Router, React Server Components, Server Actions and hybrid rendering — used deliberately, not as boilerplate. |
| ✅ **Tested where it counts** | **~98% statement coverage** across **494 tests** (Vitest + Testing Library) — components, Server Actions, RSC pages, the Kanban, the AI chat (real-time WebSocket + polling fallback), and the auth/API layers. |

### What this project demonstrates

A complete, production-grade frontend built from scratch and shipped to real users — covering **modern Next.js (RSC + Server Actions)**, **secure cookie-based authentication**, **edge middleware route protection**, **a typed service layer generated from OpenAPI**, **a real-time drag-and-drop Kanban**, **an AI chat experience**, **a ~98%-covered test suite**, and **cloud deployment with CI/CD**. It shows not just *writing UI*, but *delivering a working product*.

> 💡 **In one line:** the web client for a task manager with a ChatGPT-style assistant that actually knows your projects — designed, built and deployed end to end.

<br>

---

<br>

# 🛠️ Technical Documentation

Everything below is the engineering deep-dive: architecture, the auth & API layers, the stack, and how to run it locally.

## What makes this project stand out (technically)

Beyond rendering screens, this frontend is built around a strict **server/client boundary**. Authenticated requests run inside React Server Components and Server Actions, where the JWT is injected from an `HttpOnly` cookie that client JavaScript can never read. The browser only ever receives rendered HTML and the data it's allowed to see.

The whole API surface is **typed from the backend's OpenAPI contract** via `openapi-typescript`, so DTOs are shared by construction — no hand-written, drift-prone interfaces. On top of that sits a per-domain service layer and a clean separation between isomorphic and `server-only` code.

---

## Features

### AI Chat Assistant

A conversational interface to the backend's RAG pipeline. The user sends a question and the UI handles the **asynchronous lifecycle**: the message is enqueued server-side, then status updates (`PROCESSING → DELIVERED`/`FAILED`) are pushed **in real time over a WebSocket** (Socket.IO), with a live loading state meanwhile.

The socket is authenticated with a **short-lived ticket**: a Server Action reads the `HttpOnly` cookie server-side and the backend mints a 60s token used only for the handshake — the session JWT never reaches client JavaScript. **HTTP polling remains as an automatic fallback**: if the socket can't connect or drops while a message is pending, the client transparently falls back to polling `GET /v1/chat/:id` (with a sensible attempt ceiling) so answers still arrive.

Ships with ready-made prompt suggestions ("Summarize my in-progress tasks", "What's overdue?", "What's blocking the team?").

### Real-time Kanban Board

A drag-and-drop board (To Do / In Progress / Done) powered by **`@dnd-kit`**, with optimistic reordering. Tasks carry priority, due dates, assignees (avatar groups) and colored tags. Cards with subtasks show a progress counter (e.g. `3/5`), while the subtasks themselves stay off the board. Status changes are persisted through Server Actions that revalidate the affected routes.

### Authentication & Session

Full auth flow — login, register, forgot-password and reset-password — built with `react-hook-form` + `zod` validation. The session token is stored in an **`HttpOnly` cookie** set by a `server-only` module, and an **edge `middleware`** protects every private route, redirecting unauthenticated users to login while preserving the intended destination (`callbackUrl`).

### Dashboard

An at-a-glance summary: big-number stat cards (active / in-progress / completed tasks), recent projects with progress bars, upcoming tasks grouped by priority, and a **Rotinas de hoje** section showing today's active routines with per-routine completion progress — all rendered server-side from an aggregated backend endpoint.

### Projects & Tasks

Create and edit projects (with per-project identity gradients), manage tasks through dialogs, assign collaborators, set priorities and due dates, and drill into a dedicated task detail page with comments. The detail page also hosts a **subtasks** section — break a task into one level of subtasks, each with its own status, assignee, priority and due date, reorderable via drag-and-drop, with quick status toggles and a live progress counter.

### Personal Routines

A habit-tracking interface for recurring daily activities. Users create routines with a title, optional description, and one or more **time slots** (start + end in HH:mm). Each slot can be checked off for today with a single tap — the icon toggles between empty and filled, the progress counter updates, and fully completed routines get a strikethrough. Day-of-week chips let users restrict a routine to specific days of the week (empty selection = every day). A pause toggle suspends the routine without deleting its history.

Technically, the form uses a **React 19 `useActionState` + `startTransition`** pattern: because MUI's controlled pickers never reflect in native `FormData`, the `onSubmit` handler manually serialises the time rows and day selection into the `FormData` before handing off to the Server Action — no hidden inputs, no stale reads.

### Tags & Collaboration

A tag system with **semantic colors** and automatic color suggestion hashed from the tag name (mirroring the backend). Collaborators can be invited per project and assigned to tasks; comments are attributed per author.

### Design System

A centralized MUI theme (dark mode) — palette, typography, shadows, component overrides and tokens all live in `src/theme/`. An extra accent color is registered via MUI **module augmentation**, so components reference `theme.palette.*` instead of loose hex values.

### Public Pages & SEO

Landing page plus contact, privacy, terms and security pages, each with proper metadata. Fully responsive across breakpoints.

---

## Tech Stack

**Framework:** Next.js 16 (App Router · RSC · Server Actions · Middleware) · React 19 · TypeScript

**UI:** Material UI 9 · Emotion · `@mui/x-date-pickers` · `lucide-react`

**Forms & Validation:** react-hook-form · zod

**Interactions:** `@dnd-kit` (core · sortable · utilities) · date-fns

**Real-time:** Socket.IO client (WebSocket chat delivery · ticket-authenticated · polling fallback)

**API Types:** openapi-typescript (generated from the backend OpenAPI schema)

**Infrastructure:** Oracle Cloud Infrastructure · PM2 · GitHub Actions (CI/CD)

**Testing:** Vitest · React Testing Library · `@vitest/coverage-v8` (~98% coverage)

**Tooling:** ESLint · Tailwind CSS 4 (PostCSS)

---

## Architecture

### Server / Client Boundary

```
Browser ──▶ Next.js (App Router)
              │
              ├─ middleware.ts ............ protects private routes (checks HttpOnly cookie)
              ├─ Server Components ........ fetch data via apiServer (JWT injected from cookie)
              ├─ Server Actions ........... mutations (create/edit task, login, ...) + revalidate
              ├─ Client Components ........ interactivity (Kanban, chat, dialogs)
              └─ WebSocket client ......... real-time chat status (Socket.IO) · polling fallback
              │
              ▼
         Backend API (NestJS · Prisma · RabbitMQ · WebSocket)  ──▶  PostgreSQL + pgvector
```

### API Layer (isomorphic + server-only)

A deliberate split between the two runtime environments:

| Client | Where it runs | Token | Use |
|---|---|---|---|
| `apiClient` | browser **and** server | none | Client Components / public-route Server Actions |
| `apiServer` | server only | injects the JWT via `next/headers` | authenticated Server Components |
| `createApiClient({ token })` | anywhere | explicit | one-off cases |

On top sits a **per-domain service layer** (`src/services/api/*.service.ts`): `projects`, `tasks`, `tags`, `users`, `comments`, `collaborators`, `chat`, `dashboard`, `auth`. Errors are normalized through `ApiError` + `map-api-error`.

### Type Generation from OpenAPI

`src/types/api.ts` is **auto-generated** from the backend's OpenAPI schema, so DTOs (`components["schemas"][...]`) are consumed directly across services and components — zero drift between frontend and API.

```bash
pnpm generate:api-types        # against the local API
pnpm generate:api-types:prod   # against the production API
```

### Production Deployment

Deployed on Oracle Cloud Infrastructure with an automated CI/CD pipeline. Pushes to `main` trigger a **GitHub Actions** workflow that runs `tsc --noEmit` + ESLint on a roomy runner, then SSHes into the server to `git pull`, `npm ci`, `npm run build` and `pm2 restart`. Because the production host is RAM-constrained (≈1 GB), the build deliberately offloads type-checking to CI and disables production source maps.

---

## Testing

The suite runs on **Vitest** + **React Testing Library** (`jsdom`), with `@vitest/coverage-v8` for coverage. It covers the full stack of the client — presentational and interactive components, Server Actions, React Server Component pages (awaited and rendered with mocked services), the auth/API layers, edge middleware, and the design-system helpers. Drag-and-drop handlers and the AI chat's real-time WebSocket delivery — together with its polling fallback — are exercised deterministically (Socket.IO is mocked).

**494 tests** across **53 files**, with the following coverage:

| Metric | Coverage |
|---|---|
| **Statements** | **98.3%** |
| **Lines** | **99.4%** |
| **Functions** | **98.7%** |
| **Branches** | **90.7%** |

```bash
npm test               # run the full suite once
npm run test:watch     # watch mode (re-runs on change)
npm run test:coverage  # run with the v8 coverage report
```

---

## Project Structure

```
src/
├── app/
│   ├── (public)/            # public routes: landing, auth, contact, legal
│   │   ├── auth/            # login, register, forgot/reset-password
│   │   ├── contact/  privacy/  terms/  security/
│   │   └── layout.tsx
│   ├── (workspace)/         # private routes (behind the middleware)
│   │   ├── dashboard/       # big numbers, recent projects, upcoming tasks, routines today
│   │   ├── projects/[id]/   # Kanban board + task detail
│   │   ├── routines/        # personal habit tracker (CRUD + daily completion toggle)
│   │   ├── chat/            # AI assistant
│   │   └── profile/
│   ├── layout.tsx           # root layout (global providers)
│   └── page.tsx             # landing page
├── actions/                 # Server Actions (tasks, projects, tags, comments, collaborators)
├── components/              # UI: forms, layouts, tasks, projects, collaborators, ui
├── services/api/            # per-domain service layer + HTTP clients
├── lib/                     # auth (session, actions) and API helpers (ApiError)
├── providers/               # contexts: workspace, user, theme, feedback, auth-status
├── theme/                   # design system (palette, typography, tokens, ...)
├── schemas/                 # validation schemas (zod)
├── types/api.ts             # types generated from OpenAPI
└── middleware.ts            # route protection
```

---

## Getting Started

### Prerequisites

- Node.js v22+
- A running instance of the [backend API](https://tasks-api.solutlabs.com.br)

### Installation

```bash
git clone git@github.com:SL-Tasks/web-interface.git
cd web-interface
npm install
```

### Environment Variables

```env
# Base URL of the backend API
NEXT_PUBLIC_API_URL=http://localhost:3030

# WebSocket endpoint for real-time chat delivery (the Socket.IO gateway runs on
# the same NestJS server). If unset, the chat runs in polling-only mode.
NEXT_PUBLIC_WS_URL=http://localhost:3030
```

### Generate API Types (optional)

```bash
npm run generate:api-types        # against the local API
```

### Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

```bash
npm run dev                      # development server (webpack)
npm run build                    # production build
npm run start                    # serve the build (heap-capped for low-RAM hosts)
npm run lint                     # ESLint
npm test                         # run the test suite once (Vitest)
npm run test:watch               # Vitest in watch mode
npm run test:coverage            # run tests with the coverage report
npm run generate:api-types       # regenerate types from the local OpenAPI
npm run generate:api-types:prod  # regenerate types from the production OpenAPI
```

---

## Roadmap

- [x] Per-card accent colors on the dashboard big numbers
- [x] WebSocket updates for chat delivery (primary path; HTTP polling kept as fallback)
- [x] Personal routines with start/end time slots, day-of-week scheduling, and daily completion toggle
- [x] Dashboard routines summary (today's active routines, slot progress, per-routine completion)
- [x] Mobile-responsive routines page and dialog
- [ ] Real-time board sync across collaborators
- [ ] Optimistic UI for comments and tag edits
- [ ] Light theme support
- [ ] E2E tests (Playwright) for the critical flows

---

## License

MIT

---

## Contact

Patrick Schifter · [schiftercorp@outlook.com](mailto:schiftercorp@outlook.com) · [GitHub](https://github.com/PatrickSchifter)
