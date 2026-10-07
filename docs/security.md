# Flowtide Security Architecture & Controls

> Detailed security specification and threat mitigation strategy for the Flowtide platform.

---

## 1. Authentication & Token Lifecycle

### 1.1 Password Hashing (Argon2id)
- User passwords are never stored in plaintext or with outdated hashing algorithms (such as MD5 or SHA-1).
- Flowtide utilizes **Argon2id**, the winner of the Password Hashing Competition (PHC), providing high resistance against GPU and ASIC cracking attacks.
- Passwords must be at least 8 characters long, contain uppercase and lowercase letters, a number, and a special character.

### 1.2 Access & Refresh Tokens
- **Short-Lived Access Tokens (15 minutes):** Signed with HMAC-SHA256 using `JWT_SECRET` (minimum 32 cryptographically random characters).
- **Long-Lived Refresh Tokens (7 days):** Stored hashed (SHA-256) in the database with strict revocation tracking.
- **Refresh Token Rotation:** Every refresh invocation revokes the used token and issues a fresh token pair. If a revoked token is reused, the session is invalidated immediately (theft detection).

---

## 2. Authorization & Tenant Isolation

### 2.1 Multi-Tenant Isolation
- All database entities (`projects`, `tasks`, `activities`, `memberships`) have a mandatory `organization_id` foreign key.
- The `JwtAuthGuard` extracts the authenticated user and validates membership in the current organization.
- Queries always filter by the active `organization_id`, preventing cross-tenant data leakage.

### 2.2 Ownership & Access Control
- Non-admin members cannot delete or alter resources belonging to other workspaces.
- Cascade delete operations (`ON DELETE CASCADE`) are confined strictly within the user's organization boundary.

---

## 3. Threat Mitigation & Defense in Depth

### 3.1 SQL Injection Protection
- All database queries are executed via **TypeORM parameterized queries** and object-relational mapping.
- Raw SQL strings with concatenated user inputs are strictly prohibited across the codebase.

### 3.2 Input Validation & Sanitation
- Global `ValidationPipe` with:
  - `whitelist: true` (automatically strips extraneous, unexpected properties)
  - `forbidNonWhitelisted: true` (rejects payloads containing unmapped attributes)
  - `transform: true` (coerces primitive query parameters safely)

### 3.3 Rate Limiting & Brute-Force Prevention
- Protected with `@nestjs/throttler` backed by Redis storage.
- Authentication endpoints (`/api/auth/login`, `/api/auth/register`) are rate-limited to 10 requests per minute per IP address.
- Prevents credential-stuffing and distributed brute-force attacks.

### 3.4 Cross-Origin Resource Sharing (CORS)
- CORS origin restriction dynamically enforces allowed domains via the `CORS_ORIGIN` environment variable.
- Defaults strictly allow `http://localhost:3000` and `http://localhost:3001` for development.
- Non-browser clients (such as the Android mobile app) without `Origin` headers are permitted authenticated access.

### 3.5 Secrets & Environment Variable Safety
- No secrets, credentials, or production tokens are hardcoded or tracked in git.
- `.env` and `.env.production` are strictly ignored by `.gitignore`.
- Complete safe template provided in `.env.example`.
