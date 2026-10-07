# Flowtide Architecture & System Design

> "Plan. Track. Deliver." — Flowtide System Architecture Guide

---

## 1. High-Level Architecture

Flowtide is built as a unified, high-performance project and task management platform sharing a single modular backend across both Web and Android mobile clients.

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│        Web Application Client        │       │        Mobile Android Client         │
│          Next.js 15 (React 19)       │       │       React Native / Expo SDK 52     │
│         Tailwind CSS / Zustand       │       │        SecureStore / NetInfo         │
└──────────────────┬───────────────────┘       └──────────────────┬───────────────────┘
                   │                                              │
                   │ HTTPS / JSON REST                            │ HTTPS / JSON REST
                   │ (Cookie / Bearer JWT)                        │ (Bearer JWT)
                   ▼                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                             Flowtide REST API Gateway                               │
│                         NestJS 10 (Node.js 20+ Runtime)                             │
│                                                                                     │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Auth & Token   │  │ Projects Module  │  │  Tasks Module   │  │   Dashboard   │  │
│  │   Management    │  │  CRUD & Status   │  │  CRUD & Board   │  │  Aggregations │  │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘  └───────────────┘  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────┐  ┌───────────────┐  │
│  │  Organizations  │  │  Activity Logs   │  │ Notifications / │  │ Compatibility │  │
│  │     & RBAC      │  │   Audit Trail    │  │ Mail (Nodemailer│  │ /api & /api/v1│  │
│  └─────────────────┘  └──────────────────┘  └─────────────────┘  └───────────────┘  │
└───────────────────────────┬───────────────────────────────┬─────────────────────────┘
                            │                               │
                            ▼                               ▼
       ┌────────────────────────────────────────┐     ┌────────────────────────────┐
       │         PostgreSQL Database            │     │        Redis Broker        │
       │    Normalized Relational Schema        │     │  BullMQ Queue & Throttler  │
       │  Strict Foreign Keys & Cascade Rules   │     │    Session & Cache Store   │
       └────────────────────────────────────────┘     └────────────────────────────┘
```

---

## 2. Shared Backend Philosophy

Both the Web portal and Mobile Android application interact with the exact same REST API endpoints and data model.
- **Unified Authentication:** Both clients register and log in via `/api/auth/login` and `/api/auth/register`, receiving identical JWT access tokens and persistent refresh tokens.
- **Cross-Platform Consistency:** An action taken on Mobile (e.g. creating a task or changing status to `DONE`) is immediately visible to Web users upon refresh or real-time polling.
- **Backward Compatibility Layer:** Flowtide provides automatic transparent URL rewriting: requests made to `/api/projects`, `/api/tasks`, `/api/dashboard`, `/api/auth` are cleanly routed to the underlying `/api/v1` handler without breaking legacy consumers.

---

## 3. Technology Stack & Responsibilities

| Tier | Component | Technology | Role |
| :--- | :--- | :--- | :--- |
| **Frontend** | Web Application | Next.js 15, React 19, TypeScript, Tailwind CSS | Responsive dashboard, Kanban board, project list, modal management |
| **Mobile** | Android App | React Native 0.86, Expo SDK 52, TypeScript | Mobile management, offline indicators, pull-to-refresh, SecureStore |
| **Backend** | API Server | NestJS 10, TypeScript, TypeORM 0.3 | Modular monolith, validation, guards, business logic, Swagger |
| **Background**| Worker Engine | BullMQ, Redis 7+ | Asynchronous email dispatch, webhook processing, cleanup jobs |
| **Database** | Primary Store | PostgreSQL 16+ | ACID relational storage, foreign keys, cascade deletes, indexing |
| **Cache** | In-Memory Cache | Redis 7+ | Rate limiting, worker job queues, pub/sub messaging |
| **Infra** | Containerization | Docker & Docker Compose | Multi-container reproducible development and production orchestration |

---

## 4. Key Architectural Patterns

### 4.1 Modular Monolith
The backend is structured into domain-specific modules:
- `auth`: Credentials verification, token issuance, refresh token rotation, user registration.
- `projects`: Project entity lifecycle, date validation (`startDate` <= `endDate`), ownership isolation.
- `tasks`: Task management, priority and status transitions, project relations.
- `dashboard`: Real-time SQL aggregations for total counts, completion rates, and status distributions.
- `organizations`: Multi-tenant workspace scoping.
- `activity`: Immutable audit trail of creations, updates, and deletes.

### 4.2 Guard & Interceptor Pipeline
Every incoming HTTP request passes through a structured execution chain:
1. **Global Prefix & Compat Middleware:** Transparently routes `/api/*` to `/api/v1/*`.
2. **CorsMiddleware:** Restricts cross-origin requests to configured domains.
3. **ThrottlerGuard:** Enforces rate limits (e.g. 10 requests / 60 seconds on auth endpoints).
4. **ValidationPipe:** Strips non-whitelisted fields, coerces types, and runs `class-validator` rules.
5. **JwtAuthGuard:** Validates Bearer tokens and extracts authenticated `User` context.
6. **Controller / Service Execution:** Performs parameterized SQL queries via TypeORM repositories.
7. **ResponseTransformInterceptor:** Wraps successful outputs into `{ success: true, data: ... }`.
8. **AppExceptionFilter:** Catches errors, formats consistent JSON responses, and prevents internal stack leakages.
