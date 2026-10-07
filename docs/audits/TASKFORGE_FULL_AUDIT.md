# TaskForge — Complete Technical Reconnaissance & Architecture Audit
**Document Name:** `TASKFORGE_FULL_AUDIT.md`  
**Role:** Senior Staff-Level Full-Stack Software Engineer  
**Status:** Audit & Analysis Complete — Strictly Read-Only (Zero Code Alterations Performed)  
**Evaluated Against:** `Intern_Task_Full_Stack_Developer.pdf` (Authoritative Specification)

---

## 1. Executive Summary

This document presents a comprehensive, production-grade technical reconnaissance and architectural audit of the [TaskForge](https://github.com/engmaryamameen/TaskForge) repository. The assessment evaluates the existing codebase against the requirements stipulated in the authoritative assessment document: `Intern_Task_Full_Stack_Developer.pdf`.

### Key Conclusions:
1. **Core Web Implementation:** The repository is an exceptionally well-engineered, modular multi-tenant SaaS project management web platform. It leverages **NestJS 11** (modular monolith with Clean Architecture principles) and **Next.js 15 (App Router)** with React 19, Tailwind CSS v4, Zustand, and TanStack React Query.
2. **Architecture Philosophy Discrepancy:** TaskForge was developed around an **Organization-Scoped Multi-Tenant SaaS** model (workspaces, memberships, RBAC roles, invites, Stripe billing, BullMQ background worker queues, and Socket.IO real-time websockets). In contrast, the internship specification specifies a **User-Centric Project & Task Management System** (users own projects, tasks belong to projects, single backend serving both Web and Native Mobile).
3. **Critical Mobile Gap (100% Deficit):** The repository contains **ZERO native mobile application code**. There is no React Native, Expo, Flutter, or native Android/Java/Kotlin project anywhere in the repository. The only mobile references in the repository are responsive web screenshots within the `screenshots/mobile-view/` directory.
4. **Data Schema Gaps:**
   - **Projects:** Missing `status` (`Not Started`, `In Progress`, `Completed`), `startDate`, and `endDate`. Currently, projects only possess `id`, `name`, `description`, `organization_id`, `created_by`, `created_at`, `updated_at`, and `deleted_at`.
   - **Tasks:** Priorities and statuses use different enums (`todo`/`in_progress`/`done` vs. required `Pending`/`In Progress`/`Completed`; TaskForge includes `urgent` priority not in spec). Task field is named `title` instead of `name`.
5. **API Contract Mismatches:**
   - Routes are prefixed with `/api/v1/` instead of `/api/`.
   - **Dashboard API:** There is **NO** `/api/dashboard` or `/api/v1/dashboard` endpoint in the backend. The web frontend synthesizes dashboard statistics client-side by querying `/api/v1/projects` and `/api/v1/tasks?limit=100`.
   - **Task Creation:** Implemented at `POST /api/v1/projects/:projectId/tasks` rather than `POST /api/tasks` (with `projectId` in body).
   - **Resource Updates:** Implemented via `PATCH` rather than `PUT`.
   - **Registration:** Triggers an email verification cycle (stores opaque hash, dispatches SMTP email via Nodemailer) which blocks login until verified.
   - **Logout:** Requires a request body with `{ refreshToken: string }` to revoke the database refresh token session.
6. **Testing Deficit:** Although CI runs `npm test`, it runs `jest --passWithNoTests`. There are **zero test files** (`*.spec.ts`, `*.test.ts`) anywhere in the backend or frontend.

---

## 2. Repository Overview

- **Repository Root:** `c:\Users\sanya\OneDrive\Desktop\Intern`
- **Remote Origin URL:** `https://github.com/engmaryamameen/TaskForge`
- **Default / Active Branch:** `main`
- **Checked-out Commit Hash:** `8f23ba23104a91e7e847d9e34b3e059b3d748449`
- **Commit Author & Timestamp:** `engmaryamameen <155364505+engmaryameen@users.noreply.github.com>`, Sun Sep 20 21:23:15 2026 +0500
- **Total Tracked Files:** ~398 files (248 `.ts`, 91 `.tsx`, 20 `.png`, 10 `.json`, 9 `.md`, 4 `.sh`, 4 `.mjs`, 3 `.yml`, 3 `.gitignore`, 2 `.example`, 1 `.cjs`, 1 `.css`, 1 `.conf`, 1 `.dockerignore`, 1 `.test`, LICENSE, Dockerfile)
- **Primary Subsystems:**
  - `backend/`: NestJS 11 monolithic API + BullMQ queue worker + TypeORM database layer
  - `frontend/`: Next.js 15 App Router web client + Tailwind CSS 4 + Zustand + TanStack Query
  - `nginx/`: Reverse proxy configuration for production Docker deployment
  - `scripts/`: Shell scripts for production deployment and rollback
  - `docs/`: Comprehensive architecture, product brief, and developer documentation
  - `screenshots/`: Visual assets showcasing UI and responsive views

---

## 3. Complete Folder Structure

```
c:/Users/sanya/OneDrive/Desktop/Intern/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug-report.md
│   │   └── feature-request.md
│   ├── workflows/
│   │   └── ci.yml
│   └── pull_request_template.md
├── backend/
│   ├── postman/
│   │   └── TaskForge-API.postman_collection.json
│   ├── scripts/
│   │   ├── migrate-prod.cjs
│   │   ├── start-api-prod.sh
│   │   └── verify-build.mjs
│   ├── src/
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── current-user.decorator.ts
│   │   │   │   ├── org-scoped.decorator.ts
│   │   │   │   ├── public.decorator.ts
│   │   │   │   └── roles.decorator.ts
│   │   │   ├── filters/
│   │   │   │   └── app-exception.filter.ts
│   │   │   ├── guards/
│   │   │   │   ├── custom-throttler.guard.ts
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   ├── org-membership.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── response-transform.interceptor.ts
│   │   │   └── middleware/
│   │   │       └── request-id.middleware.ts
│   │   ├── config/
│   │   │   ├── auth.config.ts
│   │   │   ├── billing.config.ts
│   │   │   ├── database.config.ts
│   │   │   ├── db-ssl.ts
│   │   │   ├── env.validation.ts
│   │   │   ├── index.ts
│   │   │   ├── mail.config.ts
│   │   │   └── redis.config.ts
│   │   ├── infrastructure/
│   │   │   ├── cache/
│   │   │   │   ├── cache-invalidation.listener.ts
│   │   │   │   ├── cache.interface.ts
│   │   │   │   ├── cache.module.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── redis-cache.service.ts
│   │   │   ├── database/
│   │   │   │   ├── migrations/
│   │   │   │   │   ├── 1776114672180-InitialSchema.ts
│   │   │   │   │   ├── 1776762803865-AddProjectsTasksActivities.ts
│   │   │   │   │   ├── 1776762803865-AddSoftDeleteAndFixIndexes.ts
│   │   │   │   │   ├── 1776763432603-IndexActivityTriggeredBy.ts
│   │   │   │   │   ├── 1776871250146-AddBillingTables.ts
│   │   │   │   │   ├── 1777000000000-CreateNotificationsTable.ts
│   │   │   │   │   └── 1778010000000-EmailVerificationAndPasswordReset.ts
│   │   │   │   ├── database.module.ts
│   │   │   │   └── typeorm.config.ts
│   │   │   ├── queue/
│   │   │   │   ├── workers/
│   │   │   │   │   └── activity.worker.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── queue-producer.module.ts
│   │   │   │   ├── queue-worker.module.ts
│   │   │   │   ├── queue.interface.ts
│   │   │   │   ├── queue.module.ts
│   │   │   │   └── queue.service.ts
│   │   │   ├── redis/
│   │   │   │   ├── index.ts
│   │   │   │   ├── redis-shutdown.service.ts
│   │   │   │   ├── redis.module.ts
│   │   │   │   └── throttler-redis.storage.ts
│   │   │   └── storage/
│   │   │       ├── index.ts
│   │   │       ├── local-storage.service.ts
│   │   │       └── storage.interface.ts
│   │   ├── modules/
│   │   │   ├── activity/
│   │   │   │   ├── controllers/activity.controller.ts
│   │   │   │   ├── dto/activity-filter.dto.ts, index.ts
│   │   │   │   ├── entities/activity.entity.ts
│   │   │   │   ├── listeners/activity.listener.ts
│   │   │   │   ├── repositories/activity.repository.ts
│   │   │   │   ├── services/activity.service.ts
│   │   │   │   └── activity.module.ts
│   │   │   ├── auth/
│   │   │   │   ├── controllers/auth.controller.ts
│   │   │   │   ├── dto/ (login, register, refresh, verify-email, reset, update-profile)
│   │   │   │   ├── entities/ (refresh-token, email-verification-token, password-reset-token)
│   │   │   │   ├── repositories/ (refresh-token, email-verification, password-reset)
│   │   │   │   ├── services/ (auth.service.ts, token.service.ts)
│   │   │   │   ├── strategies/jwt.strategy.ts
│   │   │   │   └── auth.module.ts
│   │   │   ├── billing/ (plans, subscriptions, stripe, webhooks, usage, guards, listeners)
│   │   │   ├── health/ (health.controller.ts, health.module.ts, redis.health-indicator.ts)
│   │   │   ├── mail/ (mail.service.ts, mail.module.ts, templates/)
│   │   │   ├── notifications/ (notifications.controller, entity, listener, repo, service)
│   │   │   ├── organizations/ (invites, memberships, organizations controller/service/repo/entity)
│   │   │   ├── projects/ (projects.controller, dto, entity, repo, service, module)
│   │   │   ├── realtime/ (app.gateway, listener, service, events)
│   │   │   ├── tasks/ (tasks.controller, dto, entity, repo, service, module)
│   │   │   └── users/ (users.controller, dto, entity, repo, service, module)
│   │   ├── shared/ (constants, dto, enums, errors, interfaces)
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── run-migrations.ts
│   │   ├── worker.module.ts
│   │   └── worker.ts
│   ├── .dockerignore
│   ├── .env.example
│   ├── .env.test
│   ├── .gitignore
│   ├── Dockerfile
│   ├── eslint.config.mjs
│   ├── nest-cli.json
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.build.json
│   └── tsconfig.json
├── docs/
│   ├── backend-dev.md
│   ├── product-brief.md
│   └── system-design.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── auth/ (check-email, forgot-password, reset-password, signup, verify-email)
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   ├── (dashboard)/
│   │   │   │   ├── activity/page.tsx
│   │   │   │   ├── organizations/page.tsx
│   │   │   │   ├── projects/
│   │   │   │   │   ├── [id]/page.tsx
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── settings/page.tsx
│   │   │   │   ├── tasks/page.tsx
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx (dashboard root)
│   │   │   ├── invite/[token]/page.tsx
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── layout/ (shell, sidebar, topbar, modals-context)
│   │   │   ├── toast/ (toast-provider, toast-svgs)
│   │   │   ├── ui/ (avatar, badge, button, calendar, card, date-picker, modal, input, select, etc.)
│   │   │   └── icons.tsx
│   │   ├── features/
│   │   │   ├── activity/
│   │   │   ├── auth/
│   │   │   ├── command/
│   │   │   ├── dashboard/
│   │   │   ├── organizations/
│   │   │   ├── projects/
│   │   │   ├── settings/
│   │   │   └── tasks/
│   │   ├── hooks/ (useDebounce, useClickOutside, useSocketEvents, useSocketStatus)
│   │   ├── lib/ (api client, errors, socket, utils, query-client)
│   │   ├── store/ (auth.store, notification.store, ui.store)
│   │   └── types/ (activity, api, enums, organization, project, realtime, task, user)
│   ├── .gitignore
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── tsconfig.json
│   └── vercel.json
├── nginx/
│   └── nginx.conf
├── screenshots/
│   ├── auth/ (login.png, register.png, forgot-password.png)
│   ├── dashboard/ (1.png, 2.png, notifications.png, tasks.png, etc.)
│   └── mobile-view/ (dashboard.png, project-list.png, etc. - RESPONSIVE WEB ONLY)
├── scripts/
│   ├── deploy.sh
│   └── rollback.sh
├── .env.production.example
├── .gitignore
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── docker-compose.prod.yml
├── docker-compose.yml
├── LICENSE
└── README.md
```

---

## 4. File-by-File Analysis

### 4.1 Root Configuration & Infrastructure
- [README.md](file:///c:/Users/sanya/OneDrive/Desktop/Intern/README.md) (386 lines): Main repository documentation. Explains SaaS architecture, live demo at Vercel, tech stack, environment configuration, WebSocket event catalog, and API endpoints.
- [docker-compose.yml](file:///c:/Users/sanya/OneDrive/Desktop/Intern/docker-compose.yml) (92 lines): Local orchestration defining `postgres:16-alpine`, `redis:7-alpine`, `migrate` (ephemeral container running TypeORM migrations), `api` (`dist/main`), and `worker` (`dist/worker`).
- [docker-compose.prod.yml](file:///c:/Users/sanya/OneDrive/Desktop/Intern/docker-compose.prod.yml) (96 lines): Production orchestration using GHCR image (`ghcr.io/engmaryamameen/taskforge-backend:${TAG}`), adds `nginx:alpine` on port 80.
- [.env.production.example](file:///c:/Users/sanya/OneDrive/Desktop/Intern/.env.production.example): Production environment template covering DB, Redis, JWT, and Stripe credentials.
- [nginx/nginx.conf](file:///c:/Users/sanya/OneDrive/Desktop/Intern/nginx/nginx.conf) (82 lines): Nginx reverse proxy configuring gzip, request ID propagation, rate limit header pass-through, proxying `/api/` to `api:3000`, `/socket.io/` with websocket upgrades, and `/health`.
- [scripts/deploy.sh](file:///c:/Users/sanya/OneDrive/Desktop/Intern/scripts/deploy.sh) (80 lines): Deployment automation script checking health endpoint (`http://localhost/health`), inspecting worker process container logs for `"Worker process started"`, appending to `.deploy-history`.
- [scripts/rollback.sh](file:///c:/Users/sanya/OneDrive/Desktop/Intern/scripts/rollback.sh) (44 lines): Pulls previous tag from `.deploy-history` and re-runs `docker compose up -d`.
- [.github/workflows/ci.yml](file:///c:/Users/sanya/OneDrive/Desktop/Intern/.github/workflows/ci.yml) (162 lines): CI workflow. Runs lint check, audit, test (against test postgres + redis), Nest build verification, and GHCR Docker build & push. **Notice: Frontend is completely excluded from CI.**

### 4.2 Backend Core & Infrastructure
- [backend/package.json](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/package.json) (81 lines): Declares NestJS 11, TypeORM 0.3.28, pg 8.20, argon2 0.44, bullmq 5.75, ioredis 5.10, socket.io 4.8, stripe 22.0, nodemailer 8.0, and nestjs-pino 4.6.
- [backend/src/main.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/main.ts) (51 lines): Application bootstrap. Sets global prefix (`api/v1`), applies `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`, registers `AppExceptionFilter`, `ResponseTransformInterceptor`, enables CORS, attaches `IoAdapter` for WebSocket support.
- [backend/src/app.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/app.module.ts) (117 lines): Root Nest module. Registers ConfigModule, DatabaseModule, LoggerModule (Pino), HealthModule, EventEmitterModule, RedisModule, CacheModule, ThrottlerModule, and all domain modules. Injects global guards in strict order: `CustomThrottlerGuard` -> `JwtAuthGuard` -> `OrgMembershipGuard` -> `RolesGuard`.
- [backend/src/worker.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/worker.ts) (21 lines) & [worker.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/worker.module.ts): Standalone BullMQ worker bootstrap executing asynchronous jobs (e.g. audit log writing) decoupled from HTTP request loop.
- [backend/src/common/guards/jwt-auth.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/jwt-auth.guard.ts) (25 lines): Extends Passport JWT guard; respects `@Public()` decorator.
- [backend/src/common/guards/org-membership.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/org-membership.guard.ts) (91 lines): Enforces multi-tenancy. For `@OrgScoped()` routes, resolves `x-organization-id` header or fallback user `currentOrganizationId`, queries 3-tier cache (request -> Redis -> DB), attaches `user.organizationId` and `user.role` to request.
- [backend/src/common/guards/roles.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/roles.guard.ts) (52 lines): Verifies `user.role` against `@Roles(Role.ADMIN, ...)`.
- [backend/src/common/guards/custom-throttler.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/custom-throttler.guard.ts) (23 lines): Uses authenticated `userId` or fallback IP to prevent IP-clustering false positives.
- [backend/src/common/filters/app-exception.filter.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/filters/app-exception.filter.ts) (65 lines): Catches `AppError`, `HttpException`, and unhandled errors, formats uniform `{ success: false, error: { code, message } }` output and suppresses internal stack traces.
- [backend/src/common/interceptors/response-transform.interceptor.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/interceptors/response-transform.interceptor.ts) (23 lines): Wraps successful responses in `{ success: true, data: ..., meta: ... }`.

### 4.3 Backend Business Modules
- **Auth Module (`backend/src/modules/auth/`):**
  - [auth.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/controllers/auth.controller.ts): Routes for register, login, verify-email, resend-verification, forgot-password, reset-password, refresh, me, and logout.
  - [auth.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/auth.service.ts): Argon2 password hashing, email verification token issuance, verification check enforcing active & verified status before issuing tokens, refresh token rotation.
  - [token.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/token.service.ts): Issues 15m access JWT (`sub: userId`) and 7d opaque refresh tokens hashed with SHA-256 and stored in `refresh_tokens` table with family IDs to detect reuse.
  - [jwt.strategy.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/strategies/jwt.strategy.ts): Passport JWT strategy reading Bearer token, checks user active status in Redis cache/DB.
- **Users Module (`backend/src/modules/users/`):**
  - [user.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/users/entities/user.entity.ts): Defines `users` table (`id`, `email`, `password_hash`, `first_name`, `last_name`, `email_verified_at`, `status`, `current_organization_id`).
  - [users.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/users/services/users.service.ts): User queries and persistence.
- **Projects Module (`backend/src/modules/projects/`):**
  - [projects.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/controllers/projects.controller.ts): Endpoints: `POST /projects`, `GET /projects`, `GET /projects/:id`, `PATCH /projects/:id`, `DELETE /projects/:id`.
  - [project.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/entities/project.entity.ts): TypeORM entity with `name`, `description`, `organization_id`, `created_by`, `deleted_at`.
  - [projects.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/services/projects.service.ts): Project creation, soft deletion, emits `PROJECT_CREATED` and `PROJECT_DELETED` domain events.
- **Tasks Module (`backend/src/modules/tasks/`):**
  - [tasks.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/controllers/tasks.controller.ts): Endpoints: `POST /projects/:projectId/tasks`, `GET /projects/:projectId/tasks`, `GET /tasks`, `GET /tasks/:id`, `PATCH /tasks/:id`, `DELETE /tasks/:id`.
  - [task.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/entities/task.entity.ts): Defines `tasks` table (`title`, `description`, `status`, `priority`, `assigned_to`, `due_date`, `created_by`, `deleted_at`).
  - [tasks.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/services/tasks.service.ts): Validates project belongs to active organization, verifies assignee belongs to org, updates task, emits `TASK_CREATED`, `TASK_UPDATED`, `TASK_DELETED`.
- **Organizations Module (`backend/src/modules/organizations/`):**
  - Handles workspace multi-tenancy, member rosters, invitation links, token verification, and role assignments (`ADMIN` / `MEMBER`).
- **Realtime Module (`backend/src/modules/realtime/`):**
  - [app.gateway.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/realtime/gateway/app.gateway.ts): Socket.IO gateway authenticating incoming connections via handshake JWT token, joining clients to `user:${id}` and `org:${orgId}` rooms.
  - [realtime.listener.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/realtime/listeners/realtime.listener.ts): Subscribes to EventEmitter domain events and broadcasts them across Socket.IO rooms.
- **Notifications & Mail Modules (`backend/src/modules/notifications/`, `backend/src/modules/mail/`):**
  - Manages in-app persistent notifications (`notifications` table) and transactional emails via Nodemailer (templates for invitations, task assignments, email verification, password reset).
- **Billing Module (`backend/src/modules/billing/`):**
  - Manages Stripe subscriptions, plans (`free`, `pro`, `enterprise`), webhooks, usage limits (`LimitGuard`, `PlanGuard`).

### 4.4 Frontend Architecture & Components
- [frontend/package.json](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/package.json) (39 lines): Next.js 15.3.1, React 19.1.0, Tailwind CSS 4.1.4, `@dnd-kit/core` & `@dnd-kit/sortable`, TanStack Query 5.75, Zustand 5.0.5, Lucide React, Axios, and Recharts.
- [frontend/src/store/auth.store.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/store/auth.store.ts) (95 lines): Zustand persistent store keeping user object, access token, refresh token, and `currentOrganizationId` in browser `localStorage` (`taskforge-auth`).
- [frontend/src/lib/api/client.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/lib/api/client.ts) (93 lines): Axios instance targeting `${NEXT_PUBLIC_API_URL}/api/v1`. Implements request interceptors for `Authorization: Bearer <token>` and `x-organization-id`, and response interceptor for automatic 401 token refresh queue.
- [frontend/src/app/(dashboard)/page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx) (269 lines): Main dashboard view. **Computes KPIs client-side** using `useProjects()` and `useTasks({ limit: 100 })` without any backend dashboard endpoint.
- [frontend/src/app/(dashboard)/projects/page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/projects/page.tsx) & [[id]/page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/projects/%5Bid%5D/page.tsx): Project listing and single-project detail view with Kanban board or table view switcher.
- [frontend/src/app/(dashboard)/tasks/page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/tasks/page.tsx) (123 lines): Organization-wide task list and Kanban board with status indicators and search filters.
- [frontend/src/features/tasks/components/task-board.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/features/tasks/components/task-board.tsx) (263 lines): Drag-and-drop Kanban board powered by `@dnd-kit` with columns for `todo`, `in_progress`, and `done`.

---

## 5. Architecture Overview

### Complete End-to-End Request & Data Flow

```
[ USER / BROWSER ]
       │
       ▼
[ NEXT.JS 15 FRONTEND (App Router, Port 3001) ]
       │  • Client State: Zustand (tokens in localStorage)
       │  • Server State: TanStack React Query (cache & optimistic updates)
       │  • Realtime: Socket.IO Client (joined to org & user rooms)
       │  • HTTP: Axios Client (interceptors inject JWT & x-organization-id)
       ▼
[ NGINX REVERSE PROXY (Port 80 in Prod) / DIRECT DEV (Port 3000) ]
       │  • Rate limiting, SSL termination, Request ID injection, Gzip
       ▼
[ NESTJS 11 BACKEND API (/api/v1/...) ]
       │
       ├──► 1. RequestIdMiddleware (propagates / generates x-request-id)
       │
       ├──► 2. Global Guard Pipeline (Ordered Execution):
       │      a. CustomThrottlerGuard (Redis-backed rate limiting per userId / IP)
       │      b. JwtAuthGuard (Passport JWT validation, checks active status in Redis/DB)
       │      c. OrgMembershipGuard (Resolves x-organization-id or user default,
       │                             checks membership via Redis / DB, assigns user.role)
       │      d. RolesGuard (Verifies user.role matches @Roles decorator)
       │
       ├──► 3. ValidationPipe (class-validator DTO validation, strip unknown fields)
       │
       ├──► 4. Controller Layer (Maps HTTP verbs, parses UUIDs, delegates to Service)
       │
       ├──► 5. Service Layer (Executes business invariants, orchestrates repos, emits events)
       │
       ├──► 6. Data Access Layer (Repositories execute TypeORM queries with org-scoping)
       │      ├──► POSTGRESQL 16 (Primary relational storage)
       │      └──► REDIS 7 (Cache-aside for memberships, users, throttler counters)
       │
       ├──► 7. Domain Event Bus (EventEmitter2 wildcards)
       │      ├──► RealtimeListener ──► AppGateway (Socket.IO WebSocket broadcast to rooms)
       │      ├──► NotificationListener ──► NotificationsService (Inserts in-app notification)
       │      ├──► MailListener ──► MailService (Nodemailer SMTP transactional emails)
       │      └──► QueueProducer ──► BullMQ Redis Queue
       │                                     │
       │                              [ BULLMQ WORKER ] (Separate process: dist/worker)
       │                                     └──► ActivityWorker (Inserts audit log row)
       ▼
[ RESPONSE TRANSFORM INTERCEPTOR ]
       │  • Normalizes payload to { success: true, data: ..., meta: ... }
       ▼
[ APP EXCEPTION FILTER (On Failure) ]
       │  • Catches errors, masks internal traces, returns { success: false, error: { code, message } }
       ▼
[ FRONTEND QUERY CACHE & STATE UPDATE ] ──► [ RE-RENDER UI ]
```

---

## 6. Frontend Deep Analysis

- **Framework & Core Tech:** Next.js 15.3.1 (App Router), React 19.1.0, TypeScript 5.8.3, Tailwind CSS 4.1.4.
- **Routing Structure:**
  - `(auth)` group: `/login`, `/register`, `/auth/verify-email`, `/auth/check-email`, `/auth/forgot-password`, `/auth/reset-password`.
  - `(dashboard)` group: `/` (Dashboard overview), `/projects`, `/projects/[id]`, `/tasks`, `/activity`, `/organizations`, `/settings`.
  - Dynamic route: `/invite/[token]`.
- **State Architecture:**
  - **Client State:** Zustand (`auth.store.ts`, `notification.store.ts`, `ui.store.ts`).
  - **Server State:** TanStack React Query (`useProjects`, `useTasks`, `useOrganizations`, `useActivity`). Features optimistic mutations for task drag-and-drop.
  - **Real-Time Client:** Socket.IO client (`socket.io-client` 4.8.3) wired through `useSocketEvents.ts` hook.
- **UX & Design System:** Custom atomic UI components in `components/ui/` (`Button`, `Input`, `Select`, `Modal`, `DatePicker`, `Calendar`, `Badge`, `Card`, `StatCard`, `PageSkeleton`, `EmptyState`, `ErrorState`). Accessible command palette (`cmdk`).
- **Dashboard Implementation:**
  - Implemented in [frontend/src/app/(dashboard)/page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx).
  - Fetches project list and task list (capped at 100).
  - Calculates metrics in browser memory: `totalProjects`, `totalTasks`, `todoCount`, `inProgressCount`, `doneCount`, `completionRate`.
  - **Notice:** This violates the backend contract expected by the internship specification (`GET /api/dashboard`).

---

## 7. Backend Deep Analysis

- **Framework & Version:** NestJS 11.1.19, Express platform, TypeScript 6.0.2.
- **Bootstrapping:** In [backend/src/main.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/main.ts):
  - Sets global route prefix `api/v1`.
  - Configures `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.
  - Attaches `IoAdapter` for unified HTTP/WebSocket listening on the same port.
  - Global `AppExceptionFilter` and `ResponseTransformInterceptor`.
- **Modularity:** 11 business and infrastructure modules: `Auth`, `Users`, `Organizations`, `Projects`, `Tasks`, `Activity`, `Realtime`, `Notifications`, `Billing`, `Mail`, `Health`.
- **Dependency Injection & Separation of Concerns:**
  - Controllers contain no business logic; they validate DTOs and call Services.
  - Services orchestrate use cases, emit domain events, and invoke Repositories.
  - Repositories encapsulate TypeORM `Repository<T>` and enforce tenant constraints (`organizationId`).
- **Background Worker Subsystem:**
  - BullMQ (`bullmq` 5.75.2) runs in a separate process (`backend/src/worker.ts`), listening to the `activity` queue.

---

## 8. Database Architecture

### Technology & Setup
- **RDBMS:** PostgreSQL 16 (Alpine).
- **ORM:** TypeORM 0.3.28.
- **Migrations:** 7 versioned TypeORM migrations under `backend/src/infrastructure/database/migrations/`.

### Entity Relationship Model (Actual Implementation)

```
[ Users ]
   ├── (1:N) ──► [ Memberships ] ◄── (N:1) ── [ Organizations ]
   ├── (1:N) ──► [ Invites ] (created_by)
   ├── (1:N) ──► [ RefreshTokens ]
   ├── (1:N) ──► [ EmailVerificationTokens ]
   ├── (1:N) ──► [ PasswordResetTokens ]
   ├── (1:N) ──► [ Notifications ] (userId & actorId)
   │
   └── (1:N) ──► [ Projects ] (created_by) ◄── (N:1) ── [ Organizations ]
                      │
                      └── (1:N) ──► [ Tasks ] ◄── (N:1) ── [ Organizations ]
                                       ├── (N:1) ──► [ Users ] (assigned_to)
                                       └── (N:1) ──► [ Users ] (created_by)

[ Organizations ]
   ├── (1:N) ──► [ Activities ]
   ├── (1:1) ──► [ Subscriptions ] ──► [ Plans ]
   └── (1:1) ──► [ OrganizationUsage ]
```

### Table Definitions & Column Types

| Table Name | Primary Key | Key Columns | Foreign Keys & Cascades |
|---|---|---|---|
| `users` | `id` (UUID) | `email` (UNIQUE), `password_hash`, `first_name`, `last_name`, `email_verified_at`, `status`, `current_organization_id` | Self-contained |
| `organizations` | `id` (UUID) | `name`, `slug` (UNIQUE), `created_by` | `created_by` -> `users.id` (RESTRICT) |
| `memberships` | `id` (UUID) | `user_id`, `organization_id`, `role` (`admin`/`member`) | `user_id` -> `users.id` (CASCADE), `organization_id` -> `organizations.id` (CASCADE). UNIQUE(`user_id`, `organization_id`) |
| `projects` | `id` (UUID) | `organization_id`, `name`, `description`, `created_by`, `deleted_at` | `organization_id` -> `organizations.id` (CASCADE), `created_by` -> `users.id` (RESTRICT) |
| `tasks` | `id` (UUID) | `project_id`, `organization_id`, `title`, `description`, `status`, `priority`, `assigned_to`, `due_date`, `created_by`, `deleted_at` | `project_id` -> `projects.id` (CASCADE), `organization_id` -> `organizations.id` (CASCADE), `assigned_to` -> `users.id` (RESTRICT) |
| `refresh_tokens` | `id` (UUID) | `user_id`, `token_hash`, `family_id`, `device`, `ip`, `expires_at`, `revoked_at` | `user_id` -> `users.id` (CASCADE) |
| `activities` | `id` (UUID) | `organization_id`, `event_type`, `entity_type`, `entity_id`, `payload` (JSONB), `triggered_by` | `organization_id` -> `organizations.id` (CASCADE), `triggered_by` -> `users.id` (RESTRICT) |
| `notifications` | `id` (UUID) | `userId`, `organizationId`, `type`, `title`, `message`, `read`, `actorId` | `userId` -> `users.id` (CASCADE), `actorId` -> `users.id` (SET NULL) |

---

## 9. Authentication & Security Audit

| Security Domain | Implementation in TaskForge | Exact File(s) | Production Assessment |
|---|---|---|---|
| **Password Hashing** | Argon2id (`argon2.hash()`) | [auth.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/auth.service.ts#L63) | ✅ Excellent. Surpasses standard bcrypt. |
| **JWT Access Tokens** | 15-minute expiration, HS256, payload `{ sub: userId }` | [token.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/token.service.ts#L20-L23) | ✅ Secure, short-lived. |
| **Refresh Tokens** | 7-day expiration, stored as SHA-256 hash in DB, Token Family rotation | [token.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/token.service.ts#L24-L51) | ✅ Excellent. Detects token reuse/theft. |
| **Rate Limiting** | Redis-backed Throttler (100 req/min general; 10/min login/register; 5/min forgot/resend) | [custom-throttler.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/custom-throttler.guard.ts), [throttler-redis.storage.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/infrastructure/redis/throttler-redis.storage.ts) | ✅ Excellent brute-force protection. |
| **SQL Injection** | TypeORM QueryBuilder and Repository methods using parameterization | `*.repository.ts` | ✅ Safe. No unescaped raw string concatenation. |
| **Multi-Tenant Isolation** | `@OrgScoped()` guard checks membership before handler execution | [org-membership.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/org-membership.guard.ts) | ✅ High rigor. Prevents cross-tenant leaks. |
| **CORS Configuration** | Default `app.enableCors()` without explicit origin restriction; WebSocket `origin: '*'` | [main.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/main.ts#L41), [app.gateway.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/realtime/gateway/app.gateway.ts#L19) | ⚠️ Permissive. Should be locked down to frontend domain. |
| **Client Token Storage** | Zustand `persist` saves tokens in browser `localStorage` | [auth.store.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/store/auth.store.ts#L64) | ⚠️ Susceptible to XSS. Standard for SPAs, but mobile spec requires Keystore/Keychain. |

---

## 10. API Inventory & Specification Comparison

### Comprehensive Endpoint Inventory

| HTTP Method | Implemented Path in TaskForge | Auth Guard | Org Scoped | Purpose | Corresponding Internship Spec Endpoint | Comparison Status |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | None (`@Public`) | No | Register new account (sends email token) | `POST /api/auth/register` | 🟡 Route prefix diff; requires email verification |
| `POST` | `/api/v1/auth/login` | None (`@Public`) | No | Login with email & password | `POST /api/auth/login` | 🟡 Route prefix diff; blocks unverified emails |
| `POST` | `/api/v1/auth/logout` | JWT (`@CurrentUser`) | No | Revokes refresh token in database | `POST /api/auth/logout` | 🟡 Requires `{ refreshToken }` in body |
| `GET` | `/api/v1/auth/me` | JWT (`@CurrentUser`) | No | Retrieves authenticated user profile | `GET /api/auth/me` | 🟡 Route prefix diff (`/api/v1` vs `/api`) |
| `POST` | `/api/v1/auth/refresh` | None (`@Public`) | No | Rotates refresh token pair | *(Bonus)* | ✅ Implemented |
| `POST` | `/api/v1/auth/verify-email` | None (`@Public`) | No | Validates opaque email token | N/A | Feature beyond spec |
| `GET` | `/api/v1/projects` | JWT | Yes | List projects in active organization | `GET /api/projects` | 🟡 Scoped to active organization |
| `GET` | `/api/v1/projects/:id` | JWT | Yes | Get single project detail | `GET /api/projects/{id}` | 🟡 Scoped to active organization |
| `POST` | `/api/v1/projects` | JWT | Yes | Create project | `POST /api/projects` | 🟡 Scoped to active organization |
| `PATCH`| `/api/v1/projects/:id` | JWT | Yes | Update project details | `PUT /api/projects/{id}` | 🟡 HTTP verb is `PATCH`, not `PUT` |
| `DELETE`| `/api/v1/projects/:id`| JWT + Admin | Yes | Soft-delete project and cascade tasks | `DELETE /api/projects/{id}`| 🟡 Restricted to Admin role |
| `GET` | `/api/v1/tasks` | JWT | Yes | List all tasks in organization | `GET /api/tasks` | 🟡 Scoped to active organization |
| `GET` | `/api/v1/projects/:projectId/tasks` | JWT | Yes | List tasks under a specific project | *(Nested query)* | ✅ Implemented |
| `GET` | `/api/v1/tasks/:id` | JWT | Yes | Get single task detail | `GET /api/tasks/{id}` | 🟡 Scoped to active organization |
| `POST` | `/api/v1/projects/:projectId/tasks` | JWT | Yes | Create task under project | `POST /api/tasks` | 🟡 Nested under project URL, not `/api/tasks` |
| `PATCH`| `/api/v1/tasks/:id` | JWT | Yes | Update task details | `PUT /api/tasks/{id}` | 🟡 HTTP verb is `PATCH`, not `PUT` |
| `DELETE`| `/api/v1/tasks/:id` | JWT | Yes | Soft-delete task | `DELETE /api/tasks/{id}` | 🟡 Scoped to active organization |
| **NONE** | **N/A** | **N/A** | **N/A** | **Dashboard aggregated statistics** | `GET /api/dashboard` | ❌ **COMPLETELY MISSING ON BACKEND** |

---

## 11. Dashboard Analysis

- **Required by PDF:**
  - Dedicated endpoint: `GET /api/dashboard`.
  - Required metrics: `Total Projects`, `Total Tasks`, `Completed Tasks`, `Pending Tasks`, `Projects In Progress`.
  - Must update based on authenticated user's data.
- **Implemented in TaskForge:**
  - **No backend endpoint exists.**
  - Next.js page ([frontend/src/app/(dashboard)/page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx)) runs client-side calculation:
    ```typescript
    const totalProjects = projectsData?.meta?.total ?? 0;
    const totalTasks = tasksData?.meta?.total ?? 0;
    const todoCount = allTasks.filter((t: Task) => t.status === 'todo').length;
    const inProgressCount = allTasks.filter((t: Task) => t.status === 'in_progress').length;
    const doneCount = allTasks.filter((t: Task) => t.status === 'done').length;
    ```
  - **Gap:** A mobile client cannot query `/api/dashboard` or `/api/v1/dashboard`. Without a dedicated backend endpoint, the mobile app would be forced to fetch entire datasets and calculate metrics on device, violating specification instructions.

---

## 12. Project Management Analysis

- **Required Project Fields:** `Project Name`, `Description`, `Status` (`Not Started`, `In Progress`, `Completed`), `Start Date`, `End Date`, `Created Date`.
- **Implemented Entity Fields:**
  - `name`: VARCHAR(255)
  - `description`: TEXT (nullable)
  - `organizationId`: UUID (foreign key)
  - `createdBy`: UUID (foreign key)
  - `createdAt`: TIMESTAMP
  - `updatedAt`: TIMESTAMP
  - `deletedAt`: TIMESTAMP (soft delete)
- **Deficiencies:**
  - No `status` column or enum on `projects`.
  - No `startDate` column.
  - No `endDate` column.
  - CRUD operations do not accept or return dates or project status.

---

## 13. Task Management Analysis

- **Required Task Fields:** `Task Name`, `Description`, `Priority` (`Low`, `Medium`, `High`), `Status` (`Pending`, `In Progress`, `Completed`), `Due Date`, `Created Date`.
- **Implemented Entity Fields:**
  - `title`: VARCHAR(255) (differs in property naming from `Task Name`)
  - `description`: TEXT (nullable)
  - `status`: VARCHAR enum (`todo`, `in_progress`, `done`) — differs from `Pending`, `In Progress`, `Completed`
  - `priority`: VARCHAR enum (`low`, `medium`, `high`, `urgent`) — includes extra `urgent`
  - `dueDate`: DATE (nullable)
  - `assignedTo`: UUID (nullable foreign key to user)
  - `createdBy`: UUID (foreign key to user)
  - `createdAt`: TIMESTAMP
  - `updatedAt`: TIMESTAMP
  - `deletedAt`: TIMESTAMP
- **Task Creation Endpoint:** Requires `projectId` in the URL path (`POST /api/v1/projects/:projectId/tasks`), whereas specification expects `POST /api/tasks` with `projectId` in payload.

---

## 14. Search & Filtering Analysis

| Dimension | Specification Requirement | Web Implementation | Backend Support |
|---|---|---|---|
| **Search Projects by Name** | Required | ✅ Debounced search input | ✅ Supported via `?search=` query in `ProjectsRepository` |
| **Search Tasks by Name** | Required | ✅ Debounced search input | ✅ Supported via `?search=` query in `TasksRepository` |
| **Filter Projects by Status** | Required | ❌ Not available (no status field) | ❌ Not supported in schema or repository |
| **Filter Tasks by Status** | Required | ✅ Dropdown filter | ✅ Supported via `?status=` query |
| **Filter Tasks by Priority** | Required | ✅ Dropdown filter | ✅ Supported via `?priority=` query |

---

## 15. Notifications / Real-Time Analysis

- **WebSockets:** Implemented via Socket.IO in [app.gateway.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/realtime/gateway/app.gateway.ts). Clients connect with JWT token and join rooms:
  - `user:${userId}` (for direct user notifications)
  - `org:${orgId}` (for project/task updates)
- **In-App Notifications:** Implemented in `notifications` table, with endpoints `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`, `POST /notifications/read-all`.
- **Email Notifications:** Implemented via Nodemailer with SMTP templates for invitations and task assignments.
- **Push Notifications (Mobile):** **Not implemented.** No Firebase Cloud Messaging (FCM) or Expo Push Notification service exists.

---

## 16. Testing Analysis

- **Unit Tests:** 0 tests exist.
- **Integration Tests:** 0 tests exist.
- **E2E Tests:** 0 tests exist.
- **Test Configuration:**
  - `backend/package.json` specifies `"test": "jest --passWithNoTests"`.
  - CI test job passes solely because `--passWithNoTests` suppresses failure when zero test files are located.
  - No frontend testing libraries (Vitest, Jest, Playwright, Cypress) are installed or configured.
- **Quality Score:** **F** (Zero test coverage across entire monorepo).

---

## 17. CI/CD Analysis

- **File:** [.github/workflows/ci.yml](file:///c:/Users/sanya/OneDrive/Desktop/Intern/.github/workflows/ci.yml)
- **Pipeline Structure:**
  1. `quality`: Runs `npm ci`, `npm run lint:check`, `npm audit --audit-level=high` (backend only).
  2. `test`: Spins up Postgres and Redis service containers, runs `npm test` (passes trivially due to 0 tests).
  3. `build`: Verifies `npm run build` compiles `dist/main.js` and `dist/worker.js`.
  4. `docker`: Builds Docker container using Buildx and pushes to GitHub Container Registry (GHCR).
- **Major Blindspots:**
  - Frontend is completely absent from the CI pipeline (no Next.js build verification, no frontend typecheck or lint in CI).
  - Mobile build pipeline does not exist.

---

## 18. Docker & Deployment Analysis

- **Local Development:** `docker-compose.yml` provides reproducible local environments for Postgres, Redis, migrations, API, and worker.
- **Production Deployment:**
  - Backend: Deploys via `docker-compose.prod.yml` behind Nginx on port 80.
  - Database: Persistent named volume `pgdata`.
  - Frontend: Deployed independently to Vercel ([task-forge-demo.vercel.app](https://task-forge-demo.vercel.app)).
- **Realism:** Very clean, production-ready DevOps setup for backend and web hosting.

---

## 19. Documentation Analysis

- **Repository Documentation:**
  - `README.md`: Very comprehensive, covers architecture, screenshots, local startup, and endpoints.
  - `docs/system-design.md`: 747 lines detailing request lifecycles, consistency models, and caching.
  - `docs/backend-dev.md`: 753 lines of strict engineering guidelines and architectural mental models.
  - `docs/product-brief.md`: Product positioning and roadmap.
- **API Documentation:**
  - Postman collection provided at `backend/postman/TaskForge-API.postman_collection.json`.
  - No Swagger / OpenAPI UI (`@nestjs/swagger`) is mounted in the API runtime.
- **Missing Documentation:**
  - No mobile app setup instructions.
  - No guide on running a mobile app against the deployed backend.

---

## 20. Mobile Application Gap Analysis

| Mobile Requirement from Internship Specification | Status | Findings in TaskForge Repository |
|---|---|---|
| **Native Mobile App (Android required)** | ❌ MISSING | Zero mobile codebase. No React Native, Expo, Flutter, or native Android. |
| **Unified Backend / Database** | ❌ UNCONNECTED | Since mobile app does not exist, there is no client connected. |
| **Secure Device Storage (Keystore / Keychain)** | ❌ MISSING | No Keystore or Keychain integration. (Web uses `localStorage`). |
| **Pull-to-Refresh Support** | ❌ MISSING | No mobile client implementation. |
| **Offline / Network Error Handling** | ❌ MISSING | No mobile offline caching or network status interceptor. |
| **Token Expiry UX (Redirect to Login with Message)** | ❌ MISSING | Handled on Web, but missing on Mobile due to lack of app. |
| **Android APK / Expo Distribution Link** | ❌ MISSING | No build pipeline or binary distribution exists. |
| **Cross-Platform Sync Screen Recording** | ❌ MISSING | Requires both platforms running simultaneously. |

---

## 21. Internship Requirement Matrix

| Requirement | Status | Evidence | Exact File(s) | Notes & What Would Need To Change |
|---|:---:|---|---|---|
| **AUTHENTICATION** | | | | |
| User Registration | 🟡 | Implemented | [auth.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/controllers/auth.controller.ts#L25-L28) | Needs bypass or auto-verification option for seamless mobile evaluation. |
| User Login | ✅ | Implemented | [auth.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/controllers/auth.controller.ts#L31-L37) | Argon2 authentication with JWT issuance. |
| User Logout | 🟡 | Implemented | [auth.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/controllers/auth.controller.ts#L89-L95) | Expects `{ refreshToken }` payload in body. |
| User Fields: Full Name | 🟡 | Split fields | [user.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/users/entities/user.entity.ts#L22-L27) | Implemented as `first_name` and `last_name`. Needs concatenation or schema adjustment. |
| Unique Email | ✅ | Unique index | [user.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/users/entities/user.entity.ts#L15-L17) | Enforced at DB and DTO level. |
| Password Hashing | ✅ | Argon2id | [auth.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/auth.service.ts#L63) | Surpasses specification requirements. |
| Persistent Login | ✅ | JWT + Refresh | [token.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/token.service.ts) | Refresh token rotation maintains session. |
| Unified Account | 🟡 | Web ready | [auth.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/auth.module.ts) | Backend supports unified accounts, but no mobile app exists to log in. |
| **PROJECT MANAGEMENT** | | | | |
| Create Project | 🟡 | Implemented | [projects.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/controllers/projects.controller.ts#L25-L31) | Missing `status`, `startDate`, `endDate`. |
| View Project Details | ✅ | Implemented | [projects.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/controllers/projects.controller.ts#L43-L49) | Returns project record. |
| Edit Project | 🟡 | Implemented | [projects.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/controllers/projects.controller.ts#L52-L65) | Uses `PATCH` instead of `PUT`. Lacks date/status edits. |
| Delete Project | 🟡 | Implemented | [projects.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/controllers/projects.controller.ts#L67-L75) | Soft delete; restricted to `Role.ADMIN`. |
| View Own Projects | 🟡 | Org scoped | [projects.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/services/projects.service.ts#L40) | Scoped by organization rather than personal creator ID. |
| Project Fields: Status | ❌ | Missing | [project.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/entities/project.entity.ts) | No `status` field exists on project entity. |
| Project Fields: Start/End Date | ❌ | Missing | [project.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/entities/project.entity.ts) | No `startDate` or `endDate` fields exist. |
| **TASK MANAGEMENT** | | | | |
| Create Task | 🟡 | Nested route | [tasks.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/controllers/tasks.controller.ts#L23-L35) | Located at `/projects/:projectId/tasks`, not `/tasks`. |
| Edit Task | 🟡 | `PATCH` method | [tasks.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/controllers/tasks.controller.ts#L70-L82) | HTTP method is `PATCH`, not `PUT`. |
| Delete Task | ✅ | Implemented | [tasks.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/controllers/tasks.controller.ts#L84-L96) | Soft delete implemented. |
| Mark as Completed | ✅ | Supported | [tasks.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/services/tasks.service.ts#L173) | Sets status to `'done'`. |
| View Tasks under Project | ✅ | Implemented | [tasks.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/controllers/tasks.controller.ts#L38-L49) | Implemented at `/projects/:projectId/tasks`. |
| Task Fields: Priority | 🟡 | Extra enum | [task-priority.enum.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/shared/enums/task-priority.enum.ts) | Has `low`, `medium`, `high`, `urgent`. |
| Task Fields: Status | 🟡 | Enum diff | [task-status.enum.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/shared/enums/task-status.enum.ts) | Has `todo`, `in_progress`, `done` (spec: `Pending`, `In Progress`, `Completed`). |
| Task Fields: Due Date | ✅ | Implemented | [task.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/entities/task.entity.ts#L58-L59) | Stored as `DATE`. |
| **DASHBOARD** | | | | |
| Backend Endpoint `GET /api/dashboard` | ❌ | Missing | N/A | Must be created in backend. |
| Total Projects Count | 🟡 | Frontend only | [page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx#L66) | Calculated on client side. |
| Total Tasks Count | 🟡 | Frontend only | [page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx#L67) | Calculated on client side. |
| Completed Tasks Count | 🟡 | Frontend only | [page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx#L77) | Calculated on client side. |
| Pending Tasks Count | 🟡 | Frontend only | [page.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/app/%28dashboard%29/page.tsx#L72) | Calculated on client side. |
| Projects In Progress Count | ❌ | Missing | N/A | Cannot compute (projects lack status). |
| **SEARCH & FILTERING** | | | | |
| Search Projects by Name | ✅ | Implemented | [project-filters.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/features/projects/components/project-filters.tsx) | Works via search query. |
| Search Tasks by Name | ✅ | Implemented | [task-filters.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/features/tasks/components/task-filters.tsx) | Works via search query. |
| Filter Projects by Status | ❌ | Missing | N/A | Projects lack status. |
| Filter Tasks by Status | ✅ | Implemented | [task-filters.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/features/tasks/components/task-filters.tsx#L42-L48) | Supported in UI and DB query. |
| Filter Tasks by Priority | ✅ | Implemented | [task-filters.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/features/tasks/components/task-filters.tsx#L50-L56) | Supported in UI and DB query. |
| **MOBILE APP** | | | | |
| Android App (React Native/Expo/Flutter) | ❌ | Completely Missing | N/A | Must be developed from scratch. |
| Shared Backend & DB | ❌ | Missing App | N/A | No mobile client talking to backend. |
| Secure Token Storage (Keystore) | ❌ | Missing App | N/A | Needs `expo-secure-store` or similar. |
| Pull-to-Refresh | ❌ | Missing App | N/A | Needs mobile UI implementation. |
| Network Error / Offline UX | ❌ | Missing App | N/A | Needs NetInfo / error boundary. |
| Android APK / Distribution Link | ❌ | Missing App | N/A | Needs build script / EAS configuration. |
| 5-Minute Sync Video | ❌ | Not Recorded | N/A | Awaiting dual-platform completion. |
| **TECHNICAL & SECURITY** | | | | |
| PostgreSQL Relational DB | ✅ | Implemented | [database.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/infrastructure/database/database.module.ts) | PostgreSQL 16 with TypeORM. |
| Normalized FK Design | ✅ | Implemented | Migrations | Foreign keys with ON DELETE CASCADE / RESTRICT. |
| JWT Authentication | ✅ | Implemented | [jwt.strategy.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/strategies/jwt.strategy.ts) | Passport JWT strategy. |
| Protected Routes & Middleware | ✅ | Implemented | [app.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/app.module.ts#L106-L109) | Guard chain registered globally. |
| Rate Limiting on Auth | ✅ | Implemented | [custom-throttler.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/custom-throttler.guard.ts) | Redis throttler with route decorators. |
| Input Validation | ✅ | Implemented | DTOs + ValidationPipe | Class-validator on all incoming payloads. |
| SQL Injection Protection | ✅ | Implemented | Repositories | TypeORM parameterization throughout. |
| CORS Configured | 🟡 | Too Permissive | [main.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/main.ts#L41) | Wildcard/default; needs strict origin. |
| Logging | ✅ | Implemented | Pino (`nestjs-pino`) | Structured JSON with Request ID tracing. |
| Documentation | 🟡 | Detailed docs | `README.md`, `docs/` | Missing mobile guide & Swagger UI. |
| **BONUS FEATURES** | | | | |
| Docker Support | ✅ | Implemented | `docker-compose.yml`, `Dockerfile` | Full multi-container composition. |
| Unit & Integration Tests | ❌ | 0 Tests | N/A | Needs comprehensive test suite. |
| Pagination & Sorting | ✅ | Implemented | `pagination.dto.ts` | Supported on lists. |
| Audit Logs | ✅ | Implemented | `ActivityModule` | BullMQ worker processes audit logs. |
| Role-Based Access Control (RBAC)| ✅ | Implemented | `RolesGuard` | Admin and Member roles enforced. |
| CI/CD Pipeline | 🟡 | Partial | `ci.yml` | Backend only; lacks frontend and tests. |
| Refresh Tokens | ✅ | Implemented | `TokenService` | Family-based refresh token rotation. |
| Push Notifications | ❌ | Not Implemented | N/A | Only in-app & email implemented. |

---

## 22. Missing Features

1. **Native Mobile Application (Highest Priority):** Entire Android/mobile client is absent.
2. **Backend Dashboard API (`GET /api/dashboard`):** Endpoint missing; aggregation currently trapped in web client.
3. **Project Status, Start Date, End Date:** Missing columns, DTO fields, and UI controls.
4. **Task Project Assignment in Create Body:** Task creation requires URL parameter rather than accepting `projectId` in body at `/api/tasks`.
5. **PUT Endpoints:** Web relies exclusively on `PATCH` for projects and tasks.
6. **API Route Aliasing:** Endpoints reside under `/api/v1/...` while specification requests `/api/...`.
7. **Automated Test Suite:** Zero tests in either repository tier.
8. **OpenAPI / Swagger Documentation:** No interactive API explorer exposed.
9. **Single-User / Direct Ownership Mode:** Everything is forced through an organization tenant workspace.

---

## 23. Risks & Technical Debt

1. **Email Verification Blocker for Mobile / Evaluation:** If a reviewer registers on mobile or locally without an active SMTP server configured, registration succeeds with `nextStep: 'VERIFY_EMAIL'`, but login is rejected (`403 EMAIL_NOT_VERIFIED`). In development, this creates severe onboarding friction unless auto-verification or fallback logging is streamlined.
2. **Multi-Tenancy Overhead for Evaluators:** The specification describes a simpler model where a user logs in and immediately sees their own projects. TaskForge forces every user to belong to an organization and pass `x-organization-id` or select an active workspace. A mobile client built for this backend must carefully automate default workspace resolution.
3. **No Tests in CI:** CI gives a false sense of security because `npm test` passes with `--passWithNoTests`.
4. **Frontend Omission from CI:** A broken TypeScript build in `frontend/` will not be detected by GitHub Actions.

---

## 24. Architectural Strengths

- **Enterprise-Grade Modularity:** Clean module structure, strict boundary rules, dependency injection, and decoupled domain events.
- **Robust Security Primitives:** Argon2id password hashing and SHA-256 hashed refresh token families with theft detection.
- **Asynchronous Event Processing:** Decoupling audit logging via BullMQ ensures fast HTTP response times.
- **Reactive Real-Time Infrastructure:** Socket.IO integration synchronized with NestJS EventEmitter provides instant state updates.
- **Sophisticated Web UX:** Kanban drag-and-drop, debounced search, optimistic mutations, and modern aesthetics.

---

## 25. Architectural Weaknesses

- **Over-Engineered Multi-Tenancy for Stated Assessment:** The requirement asks for user ownership, but the codebase enforces organization multi-tenancy, requiring header interception and membership lookups on every query.
- **Client-Side Heavy Dashboard:** Fails to provide an aggregation API, offloading data crunching to the web browser.
- **Lack of Verification:** Zero automated unit or integration tests.
- **Mobile Completely Ignored:** Repository was evidently developed as a web-only platform.

---

## 26. Recommended Adaptation Strategy

To satisfy 100% of the internship requirements without destabilizing the existing web codebase, follow this non-destructive strategy:

### Strategy Step 1: Backward-Compatible API Expansion
- Add `/api/...` route prefix compatibility or mount route rewrites alongside `/api/v1/...`.
- Implement `GET /api/dashboard` (and `GET /api/v1/dashboard`) returning `{ totalProjects, totalTasks, completedTasks, pendingTasks, projectsInProgress }`.
- Add `PUT /api/projects/:id` and `PUT /api/tasks/:id` as aliases to the respective update handlers.
- Add `POST /api/tasks` accepting `{ projectId, title, ... }` in the body.
- Enhance `Project` entity with `status`, `startDate`, and `endDate` columns via a new TypeORM migration.

### Strategy Step 2: Authentication Dev-Friendly Mode
- Allow optional auto-verification in non-production environments so evaluators can register and immediately log in on both web and mobile without requiring real SMTP credentials.

### Strategy Step 3: Build Native Mobile Application (React Native / Expo)
- Create a `mobile/` directory at repository root using **Expo (React Native + TypeScript)**.
- Implement screens:
  - Auth: Login, Register.
  - Dashboard: Consuming `GET /api/dashboard` with stat cards.
  - Projects: List, Detail, Create, Edit.
  - Tasks: List under project, Create, Edit, Status toggle, Priority badges.
- Store JWT tokens using **`expo-secure-store`** (backed by Android Keystore).
- Implement Pull-to-Refresh via React Native `RefreshControl`.
- Integrate network status detection (`@react-native-community/netinfo`) to show offline banners instead of crashing.
- Support token expiration interceptor redirecting to login with a friendly message.

### Strategy Step 4: Add Test Suite & CI Updates
- Add unit and integration tests using Jest and Supertest for auth, projects, tasks, and dashboard.
- Update `.github/workflows/ci.yml` to test both backend and frontend.

---

## 27. Exact Files Likely To Be Reused

### Backend (Unmodified / Leveraged as-is):
- [backend/src/infrastructure/database/database.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/infrastructure/database/database.module.ts)
- [backend/src/infrastructure/redis/redis.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/infrastructure/redis/redis.module.ts)
- [backend/src/infrastructure/cache/redis-cache.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/infrastructure/cache/redis-cache.service.ts)
- [backend/src/modules/auth/services/token.service.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/services/token.service.ts)
- [backend/src/modules/auth/strategies/jwt.strategy.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/auth/strategies/jwt.strategy.ts)
- [backend/src/common/guards/jwt-auth.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/jwt-auth.guard.ts)
- [backend/src/common/guards/custom-throttler.guard.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/guards/custom-throttler.guard.ts)
- [backend/src/common/filters/app-exception.filter.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/filters/app-exception.filter.ts)
- [backend/src/common/interceptors/response-transform.interceptor.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/common/interceptors/response-transform.interceptor.ts)
- [backend/src/modules/realtime/gateway/app.gateway.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/realtime/gateway/app.gateway.ts)

### Frontend (Unmodified / Leveraged as-is):
- [frontend/src/store/auth.store.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/store/auth.store.ts)
- [frontend/src/lib/api/client.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/lib/api/client.ts)
- [frontend/src/features/tasks/components/task-board.tsx](file:///c:/Users/sanya/OneDrive/Desktop/Intern/frontend/src/features/tasks/components/task-board.tsx)
- All UI component primitives in `frontend/src/components/ui/`

---

## 28. Exact Files Likely To Need Modification

| File Path | Nature of Necessary Modification |
|---|---|
| [backend/src/modules/projects/entities/project.entity.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/entities/project.entity.ts) | Add `status`, `startDate`, `endDate` fields. |
| [backend/src/modules/projects/dto/create-project.dto.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/dto/create-project.dto.ts) | Add `status`, `startDate`, `endDate` validation. |
| [backend/src/modules/projects/dto/update-project.dto.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/dto/update-project.dto.ts) | Add `status`, `startDate`, `endDate` validation. |
| [backend/src/modules/projects/controllers/projects.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/projects/controllers/projects.controller.ts) | Add `PUT :id` endpoint decorator. |
| [backend/src/modules/tasks/controllers/tasks.controller.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/controllers/tasks.controller.ts) | Add `POST tasks` (with `projectId` in body) and `PUT tasks/:id`. |
| [backend/src/modules/tasks/dto/create-task.dto.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/modules/tasks/dto/create-task.dto.ts) | Allow optional `projectId` in body for top-level `POST /tasks`. |
| **NEW:** `backend/src/modules/dashboard/` | New module, controller, and service providing `GET /api/dashboard`. |
| [backend/src/app.module.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/app.module.ts) | Register new `DashboardModule`. |
| [backend/src/main.ts](file:///c:/Users/sanya/OneDrive/Desktop/Intern/backend/src/main.ts) | Ensure `/api` and `/api/v1` routes both resolve cleanly. |
| [.github/workflows/ci.yml](file:///c:/Users/sanya/OneDrive/Desktop/Intern/.github/workflows/ci.yml) | Add frontend build check and unit test execution. |

---

## 29. Suggested Final Architecture

```
                                  ┌──────────────────────────────┐
                                  │   PostgreSQL 16 Database     │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
                                  ┌──────────────────────────────┐
                                  │    Redis 7 (Cache & Queue)   │
                                  └──────────────┬───────────────┘
                                                 │
                                                 ▼
       ┌──────────────────────────────────────────────────────────────────────────────────┐
       │                       NestJS 11 Unified API Server                               │
       │   Endpoints: /api/auth/*, /api/projects/*, /api/tasks/*, /api/dashboard          │
       │   Guards: Throttler -> JWT -> OrgContext (Auto-resolves for personal mode)       │
       └────────────────────────┬────────────────────────────────────────┬────────────────┘
                                │                                        │
           REST + WebSocket     │                                        │ REST (Bearer Token)
                                ▼                                        ▼
    ┌─────────────────────────────────────────┐        ┌──────────────────────────────────┐
    │       Next.js 15 Web Application        │        │    React Native (Expo) Android   │
    │  • App Router (React 19)                │        │  • Native Android UI             │
    │  • Kanban Board & Analytics             │        │  • Android Keystore SecureStore  │
    │  • TanStack Query Server State          │        │  • Pull-to-Refresh               │
    │  • Realtime Socket.IO Sync              │        │  • Offline / NetInfo Handling    │
    └─────────────────────────────────────────┘        └──────────────────────────────────┘
```

---

## 30. Questions & Unknowns Requiring Verification

1. **Multi-Tenancy vs. Single-User Model:** Should we retain the full organization workspace model (and have mobile transparently auto-select the user's primary organization), or add a direct personal project ownership mode? *(Recommendation: Retain organizations internally to keep the web app intact, but have the mobile app automatically default to the user's personal workspace so the evaluator experience is seamless).*
2. **API Route Prefix:** Should we alias all `/api/v1/*` routes to `/api/*` so both the existing frontend and the exact PDF specification routes work simultaneously? *(Recommendation: Yes, support both).*
3. **Mobile Framework Preference:** The specification accepts React Native (Expo/bare) or Flutter. Expo with TypeScript is strongly recommended because it shares TypeScript types and validation schemas with the web and backend.
4. **Email Verification in Local Dev:** Should we configure development mode to automatically mark registered users as email-verified, removing the SMTP setup requirement for mobile evaluators? *(Recommendation: Yes, conditionally auto-verify when `NODE_ENV !== 'production'` unless SMTP is explicitly configured).*

---
*Report compiled autonomously by Senior Staff-Level Full-Stack Engineering Agent. Zero project files have been modified. Standing by for user instruction.*
