# Flowtide

Plan. Track. Deliver.

Flowtide is a modern, unified project and task management platform engineered for high-velocity teams. Built as a full-stack system sharing a single backend across both a web portal and an Android mobile app, Flowtide delivers real-time visibility, fine-grained project tracking, multi-tenant workspace isolation, and automated reporting without unnecessary operational complexity.

---

## Overview

Modern software teams often struggle with fragmented tooling, where planning lives in one silo, execution in another, and status reports are manually compiled. Flowtide solves this by combining project roadmapping, Kanban-style task execution, aggregate health metrics, and mobile responsiveness into a cohesive platform. 

Every action taken—from creating sprints to updating task priorities—instantly propagates across both Web and Android clients through a unified REST API and normalized PostgreSQL data tier.

---

## Why Flowtide?

- **Unified Multi-Platform Experience:** A single backend powers both the responsive Next.js web application and the React Native / Expo mobile app.
- **Production-Ready Architecture:** Modular NestJS architecture, TypeORM data layer, Redis caching, BullMQ background jobs, and robust Argon2id/JWT security.
- **Enterprise-Grade Data Model:** Normalized relational schema with strict foreign keys, cascade safety, and tenant data isolation.
- **Fast, Intuitive UX:** Sleek dashboard analytics, visual task management, rapid filtering, and full keyboard/mobile ergonomics.

---

## Features

### Authentication & Identity
- **Registration & Onboarding:** Secure signup flow with automatic workspace initialization.
- **Secure Password Hashing:** Argon2id password encryption resistant to GPU cracking.
- **Persistent Sessions & JWTs:** Short-lived access tokens (15m) combined with rotating refresh tokens (7d).
- **Graceful Token Renewal:** Automatic silent token refresh on both Web and Mobile clients.
- **Current User Profile:** Dedicated `/api/auth/me` endpoint to verify session context.

### Project Management
- **Full Project CRUD:** Create, read, edit, and delete projects with instant UI reactivity.
- **Lifecycle Status Tracking:** Support for `planned`, `in_progress`, `completed`, and `on_hold` statuses.
- **Date Range Management:** Defined start dates and target completion dates with integrity validation.
- **Workspace Scoping:** Strict tenant and creator ownership isolation.

### Task Management
- **Full Task Lifecycle:** Create, edit, reorder, assign, and delete tasks.
- **Priority Matrix:** Categorization into `low`, `medium`, `high`, and `urgent` tiers.
- **Kanban & Status Flow:** Track tasks across `todo`, `in_progress`, `in_review`, and `done` states.
- **Project Associations:** Direct relational links to parent projects with cascade safety.
- **One-Tap Completion:** Quick status toggling directly from task lists or detail views.

### Dashboard Analytics
- **Project Metrics:** Aggregate counters for total projects and active in-progress initiatives.
- **Task Metrics:** Real-time visibility into completed vs. pending tasks.
- **Progress Visualizations:** Dynamic progress bars and status distributions calculated via SQL aggregations.

### Search & Filtering
- **Project Search & Filtering:** Case-insensitive search by project name and filter by status.
- **Task Search & Filtering:** Full-text filtering across task titles and descriptions.
- **Multi-Dimension Filters:** Combine status and priority filters simultaneously.

### Mobile App (Android)
- **Shared Backend:** Direct connection to the same NestJS API and PostgreSQL database.
- **Hardware-Backed Secure Storage:** Encrypted token persistence using `expo-secure-store`.
- **Offline Awareness:** Real-time network detection via NetInfo with non-intrusive offline banners.
- **Pull-to-Refresh:** Instant data synchronization across Dashboard, Projects, and Tasks.
- **Synchronized State:** Changes made on mobile are immediately available on web upon refresh.

---

## Architecture

Flowtide follows a modular, shared-backend architecture where both Web and Mobile clients consume the same RESTful API and relational database.

```
┌────────────────────────┐         ┌────────────────────────┐
│     Web Application    │         │   Android Mobile App   │
│  Next.js 15 / React 19 │         │   React Native / Expo  │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
            │ HTTPS / REST                     │ HTTPS / REST
            └─────────────────┬────────────────┘
                              ▼
                 ┌───────────────────────────┐
                 │       Flowtide API        │
                 │     NestJS 10 Engine      │
                 │  Auth / Projects / Tasks  │
                 │  Dashboard / Validation   │
                 └─────────────┬─────────────┘
                               │
                       ┌───────┴───────┐
                       ▼               ▼
            ┌────────────────────┐   ┌────────────────────┐
            │     PostgreSQL     │   │       Redis        │
            │ Normalized Relational│ │   BullMQ / Rate    │
            │      Database      │   │   Limiting / Cache │
            └────────────────────┘   └────────────────────┘
```

Both clients speak to the `/api` and `/api/v1` routes with identical authorization headers and data contracts.

---

## Technology Stack

### Frontend (Web)
- **Framework:** Next.js 15 (App Router), React 19
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **HTTP Client:** Native Fetch / Axios

### Backend (API)
- **Framework:** NestJS 10
- **Runtime:** Node.js 20+
- **Architecture:** Modular Monolith (Domain-Driven Modules)
- **ORM / Data Access:** TypeORM 0.3
- **Validation:** class-validator, class-transformer
- **Documentation:** Swagger / OpenAPI 3.0

### Database & Storage
- **Primary Database:** PostgreSQL 16+
- **Cache & Queue Broker:** Redis 7+
- **Background Jobs:** BullMQ

### Mobile (Android)
- **Framework:** React Native 0.86, Expo SDK 52
- **Language:** TypeScript 5
- **Navigation:** React Navigation (Native Stack + Bottom Tabs)
- **Secure Storage:** Expo SecureStore
- **Network State:** @react-native-community/netinfo
- **Icons:** @expo/vector-icons

### Testing & Quality
- **Unit & Service Testing:** Jest, ts-jest
- **Type Checking:** TypeScript strict mode
- **Linting:** ESLint, Prettier

---

## Project Structure

```
flowtide/
├── backend/                  # NestJS REST API & background worker
│   ├── src/
│   │   ├── config/           # Environment & database configurations
│   │   ├── infrastructure/   # Database connection & migrations
│   │   ├── modules/          # Auth, Projects, Tasks, Dashboard, Users, Mail
│   │   └── shared/           # Common enums, filters, and interceptors
│   ├── test/                 # Jest service and controller test suites
│   ├── package.json
│   └── tsconfig.json
├── frontend/                 # Next.js 15 web application
│   ├── src/
│   │   ├── app/              # Next.js App Router (dashboard, auth, projects, tasks)
│   │   ├── components/       # Shared UI, layouts, and brand components
│   │   ├── features/         # Domain-specific UI features (modals, filters, cards)
│   │   ├── lib/api/          # API client and endpoints
│   │   └── store/            # Client state stores (auth, UI)
│   ├── package.json
│   └── tsconfig.json
├── mobile/                   # React Native & Expo mobile application
│   ├── src/
│   │   ├── components/       # Native UI components (Button, Input, OfflineBanner)
│   │   ├── context/          # AuthContext and NetworkContext
│   │   ├── navigation/       # Bottom tabs & stack navigators
│   │   ├── screens/          # Login, Register, Dashboard, Projects, Tasks
│   │   └── services/         # Axios client and SecureStore wrapper
│   ├── app.json              # Expo application configuration
│   └── package.json
├── docs/                     # Engineering specifications
│   ├── architecture.md       # High-level architecture and execution pipeline
│   ├── api.md                # Complete API endpoint reference
│   ├── database.md           # Schema design, entities, and migrations
│   ├── deployment.md         # Production deployment operations
│   ├── mobile.md             # Mobile client architecture & APK guide
│   ├── security.md           # Security audit, threat model, and token rules
│   └── ER-DIAGRAM.md         # Entity-relationship diagrams
├── scripts/                  # Automated verification and deployment scripts
├── .github/workflows/        # CI/CD pipelines (Lint, Test, Build, Docker)
├── docker-compose.yml        # Development multi-container orchestration
├── docker-compose.prod.yml   # Production container orchestration
├── .env.example              # Canonical environment variables template
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js:** v20.x or higher
- **npm:** v10.x or higher
- **PostgreSQL:** v16+ running locally or in Docker
- **Redis:** v7+ running locally or in Docker

### Clone Repository
```bash
git clone https://github.com/SanyamRajSingh/project-management-platform.git
cd project-management-platform
```

### Environment Variables
Copy the template file to configure your local environment:
```bash
cp .env.example backend/.env
```
Ensure `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, and `JWT_SECRET` are set appropriately.

### Database Setup & Migrations
Ensure PostgreSQL is active, then run the database migrations:
```bash
cd backend
npm install
npm run build
node dist/run-migrations.js
```

### Backend Setup
```bash
cd backend
npm install
npm run start:dev
```
The backend API starts on `http://localhost:3000`.

### Frontend Setup
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The web dashboard opens at `http://localhost:3001` (or `http://localhost:3000`).

### Mobile Setup
In a new terminal window:
```bash
cd mobile
npm install
npx expo start
```
Press `a` to run on an attached Android emulator or device, or scan the QR code with Expo Go.

---

## API Documentation

Flowtide provides auto-generated OpenAPI documentation accessible via Swagger UI:
- **Swagger URL:** `http://localhost:3000/api/docs`
- **JSON Specification:** `http://localhost:3000/api/docs-json`

### Core Endpoint Summary

| Category | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register new account and workspace |
| **Auth** | `POST` | `/api/auth/login` | Log in and receive JWT token pair |
| **Auth** | `POST` | `/api/auth/refresh` | Rotate and issue fresh access token |
| **Auth** | `POST` | `/api/auth/logout` | Revoke session and clear refresh token |
| **Auth** | `GET` | `/api/auth/me` | Fetch authenticated user profile |
| **Projects** | `GET` | `/api/projects` | List projects (with search & status filter) |
| **Projects** | `POST` | `/api/projects` | Create a new project |
| **Projects** | `GET` | `/api/projects/:id` | Fetch specific project details |
| **Projects** | `PUT` | `/api/projects/:id` | Update project name, status, dates |
| **Projects** | `DELETE`| `/api/projects/:id` | Delete project and associated tasks |
| **Tasks** | `GET` | `/api/tasks` | List tasks (with search, status, priority) |
| **Tasks** | `POST` | `/api/tasks` | Create a task associated with a project |
| **Tasks** | `GET` | `/api/tasks/:id` | Fetch specific task details |
| **Tasks** | `PUT` | `/api/tasks/:id` | Update task fields (status, priority) |
| **Tasks** | `DELETE`| `/api/tasks/:id` | Delete specific task |
| **Dashboard**| `GET` | `/api/dashboard` | Fetch aggregated dashboard metrics |

*Note: All endpoints are also accessible under the `/api/v1/*` prefix.*

---

## Security

Flowtide implements multi-layered security controls designed for enterprise reliability:
- **Argon2id Hashing:** Password security using the industry's most robust hashing algorithm.
- **Stateless JWTs & Rotating Refresh Tokens:** 15-minute access tokens minimize exposure windows, while refresh token reuse detection invalidates compromised sessions.
- **Multi-Tenant Ownership Isolation:** Every project and task query scopes through the active `organization_id`.
- **Strict Parameterized Queries:** TypeORM prevents SQL injection vulnerabilities by separating user inputs from SQL logic.
- **Input Validation:** NestJS `ValidationPipe` with strict payload whitelisting.
- **Rate Limiting:** Guard protection limits sensitive auth routes to 10 requests/minute.
- **Zero-Secret Commits:** Strictly enforced `.gitignore` preventing accidental commits of `.env` files.

---

## Testing

Flowtide contains automated unit and service test suites verifying core business logic, permissions, and database operations.

Run the test suite:
```bash
cd backend
npm test
```

### Coverage Areas
- **Authentication Service (`auth.service.spec.ts`):** Validates password hashing, token issuance, refresh rotation, and invalid credential rejections.
- **Projects Service (`projects.service.spec.ts`):** Verifies project creation, status mapping, date validation, and ownership barriers.
- **Tasks Service (`tasks.service.spec.ts`):** Confirms task creation, priority assignments, status transitions, and project relationships.
- **Dashboard Service (`dashboard.service.spec.ts`):** Ensures accuracy of SQL aggregations for total counts, pending/completed metrics, and progress percentages.
- **Enum Mappings (`enum-mappings.spec.ts`):** Confirms bidirectional mapping between frontend query parameters and internal entity states.

---

## Deployment

### Docker Orchestration
Flowtide includes production Docker configurations with Nginx reverse proxying:
```bash
# Production deployment
cp .env.production.example .env.production
./scripts/deploy.sh latest
```

### Cloud Providers
- **Backend:** Deployable to Render, Railway, Fly.io, or AWS ECS as a containerized Node.js service.
- **Database:** Fully compatible with managed PostgreSQL providers (Neon, Supabase, AWS RDS).
- **Cache:** Compatible with Upstash Redis or AWS ElastiCache.
- **Frontend:** Zero-configuration deployment to Vercel or Cloudflare Pages.

---

## Mobile APK Distribution

To build an Android APK using Expo Application Services (EAS):
```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
The resulting standalone `.apk` can be installed directly on physical Android testing devices.

---

## Troubleshooting

### Port Conflicts (3000 / 3001)
If the backend or frontend fails to bind to ports 3000 or 3001:
- Check running processes: `netstat -ano | findstr :3000`
- Adjust ports in `.env` (`PORT=3000` for backend, `PORT=3001` for frontend).

### Database Connection Refused
- Verify PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check that credentials in `.env` match your local PostgreSQL configuration.

### Mobile Network Timeout
- When running on physical Android devices, set `EXPO_PUBLIC_API_BASE_URL` to your machine's local IP address (e.g. `http://192.168.1.10:3000/api`) rather than `localhost`.

---

## Evaluator Walkthrough (Demo Flow)

1. **Register Account:** Navigate to `http://localhost:3001/register` and register with a fresh email and workspace name.
2. **Access Dashboard:** View the initial zero-state metrics displaying 0 total projects and 0 tasks.
3. **Create Project:** Click **Create Project**, assign a title (e.g., "Mobile Release"), select status `In Progress`, and provide target start and end dates.
4. **Create Tasks:** Open the project, add tasks across different priorities (`High`, `Medium`), and view them in the Kanban board.
5. **Update Task Status:** Drag a task or toggle its status to `Done`.
6. **Verify Metrics:** Return to the Dashboard; verify that `Completed Tasks` incremented and `Progress` updated dynamically.
7. **Launch Mobile App:** Launch the mobile app on Android, log in using the exact same credentials.
8. **Verify Synchronization:** Confirm that the project and tasks created on web appear instantly on mobile.
9. **Update on Mobile:** Mark a task as complete on mobile; refresh the web application to see the change reflected immediately.
10. **Test Filters:** Use the project and task search bars and status filter pills to verify filtering accuracy.

---

## Future Improvements

- Granular role-based permissions (Custom RBAC rules).
- Automated webhook triggers for third-party integrations (Slack / GitHub).
- Native push notifications via Firebase Cloud Messaging (FCM).
- Real-time collaborative task editing with presence indicators.

---

## License

This project is licensed under the MIT License.

---

## Author

**Sanyam Raj Singh**  
GitHub: [https://github.com/SanyamRajSingh](https://github.com/SanyamRajSingh)
