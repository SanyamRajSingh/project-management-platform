# Flowtide Deployment & Production Operations

> Production operations guide for orchestrating Flowtide across Cloud and Container infrastructure.

---

## 1. Containerized Deployment (Docker Compose)

Flowtide provides production Docker configurations in `docker-compose.prod.yml` and `docker-compose.yml`.

### Architecture of Production Cluster
```
Internet ──> Nginx (Port 80/443) ──> Flowtide API (NestJS Port 3000)
                                      ├──> PostgreSQL 16
                                      ├──> Redis 7
                                      └──> Background Worker (BullMQ)
```

### Steps to Deploy with Docker
1. Copy the production environment template:
   ```bash
   cp .env.production.example .env.production
   ```
2. Configure mandatory production parameters:
   - `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`
   - `JWT_SECRET` (generate using `openssl rand -hex 32`)
   - `REDIS_HOST`
   - `FRONTEND_URL`
3. Execute the deployment script:
   ```bash
   chmod +x scripts/deploy.sh
   ./scripts/deploy.sh latest
   ```
   The script automatically pulls verified images, runs database migrations to completion, verifies API health checks, and launches background workers.

---

## 2. Cloud Infrastructure Recommendations

Flowtide can be hosted on popular managed cloud platforms:

### 2.1 Backend (NestJS API & Worker)
- **Render / Railway / Fly.io / AWS ECS:**
  - Build command: `npm run build`
  - Start command: `node dist/main`
  - Worker start command: `node dist/worker`
  - Required Environment Variables: `PORT=3000`, `NODE_ENV=production`, `DB_*`, `REDIS_*`, `JWT_SECRET`

### 2.2 Database (PostgreSQL)
- **Neon / Supabase / AWS RDS:**
  - Managed PostgreSQL 16+ instance.
  - Enable SSL: set `DB_SSL=true`.
  - Connection pooling recommended for serverless deployments.

### 2.3 Cache (Redis)
- **Upstash / AWS ElastiCache / Redis Cloud:**
  - TLS enabled connection (`REDIS_TLS=true`).
  - Auth token support (`REDIS_PASSWORD`).

### 2.4 Frontend (Next.js)
- **Vercel / Cloudflare Pages / Node.js Host:**
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `.next`
  - Environment variables: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`

---

## 3. Mobile Client Deployment (Android APK)

Flowtide's mobile client is built using Expo SDK 52 and React Native:
1. Ensure `EXPO_PUBLIC_API_BASE_URL` points to the live backend HTTPS endpoint.
2. Build an Android standalone APK via EAS (Expo Application Services):
   ```bash
   cd mobile
   npx eas login
   npx eas build -p android --profile preview
   ```
3. Distribute the resulting `.apk` directly to evaluators or upload to Google Play Internal Testing.
