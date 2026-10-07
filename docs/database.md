# Flowtide Database Architecture & Schema

> Relational PostgreSQL architecture, TypeORM entities, and migration lifecycle.

---

## 1. Schema Philosophy

Flowtide uses a normalized PostgreSQL relational database with:
- **Strict Foreign Keys:** Foreign keys maintain referential integrity with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL`.
- **Indexing on Lookup Columns:** UUID primary keys, user emails, organization slugs, project foreign keys, task status, and priority fields are indexed for sub-millisecond query execution.
- **Tenant Isolation:** Every core entity belongs to an `organization_id`, ensuring strict tenant isolation across organizations.

---

## 2. Core Entities & Attributes

### `users`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, default `gen_random_uuid()` | Primary user identifier |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, INDEXED | Normalized login email |
| `password_hash` | VARCHAR(255) | NOT NULL | Argon2id cryptographically hashed password |
| `first_name` | VARCHAR(100) | NOT NULL | Given name |
| `last_name` | VARCHAR(100) | NOT NULL | Family name |
| `status` | VARCHAR(50) | DEFAULT `'active'` | Account status (`active`, `suspended`) |
| `current_organization_id`| UUID | FK -> `organizations(id)` | Currently selected workspace |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Profile update timestamp |

### `organizations`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique organization workspace identifier |
| `name` | VARCHAR(255) | NOT NULL | Human-readable company/team name |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | URL-safe slug |
| `created_by` | UUID | FK -> `users(id)` | Organization founder |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Workspace creation date |

### `projects`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique project identifier |
| `name` | VARCHAR(255) | NOT NULL | Project name |
| `description` | TEXT | NULLABLE | Detailed project brief |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT `'planned'` | Status (`planned`, `in_progress`, `completed`, `on_hold`) |
| `start_date` | DATE / TIMESTAMPTZ | NULLABLE | Project start date |
| `end_date` | DATE / TIMESTAMPTZ | NULLABLE | Project target completion date |
| `organization_id`| UUID | FK -> `organizations(id)` | Tenant workspace scoping |
| `created_by` | UUID | FK -> `users(id)` | Project creator |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Created date |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Last modified date |

### `tasks`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Unique task identifier |
| `name` | VARCHAR(255) | NOT NULL | Task title |
| `description` | TEXT | NULLABLE | Detailed task specifications |
| `priority` | VARCHAR(50) | NOT NULL, DEFAULT `'medium'` | Priority (`low`, `medium`, `high`, `urgent`) |
| `status` | VARCHAR(50) | NOT NULL, DEFAULT `'todo'` | Task status (`todo`, `in_progress`, `in_review`, `done`) |
| `due_date` | TIMESTAMPTZ | NULLABLE | Due date |
| `project_id` | UUID | FK -> `projects(id)`, CASCADE | Parent project relation |
| `organization_id`| UUID | FK -> `organizations(id)` | Workspace scoping |
| `created_by` | UUID | FK -> `users(id)` | Task author |
| `assigned_to` | UUID | FK -> `users(id)`, NULLABLE | Assignee user |
| `created_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Created date |
| `updated_at` | TIMESTAMPTZ | DEFAULT `NOW()` | Modified date |

### `refresh_tokens`
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK | Token record identifier |
| `token_hash` | VARCHAR(255) | NOT NULL, INDEXED | SHA-256 hash of issued refresh token |
| `user_id` | UUID | FK -> `users(id)`, CASCADE | Owning user |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Absolute expiration time (7 days) |
| `revoked_at` | TIMESTAMPTZ | NULLABLE | Token revocation timestamp |

---

## 3. Migrations & Seed Flow

Migrations are located in `backend/src/infrastructure/database/migrations/`:
- `1778000000000-InitialSchema.ts`: Sets up core users, organizations, memberships, projects, tasks, and refresh tokens.
- `1779000000000-AddProjectStatusAndDates.ts`: Introduces explicit project `status`, `startDate`, and `endDate` fields with bidirectional compatibility.

### Running Migrations
To run all outstanding migrations against the target PostgreSQL database:
```bash
cd backend
npm run build
node dist/run-migrations.js
```
Or in Docker:
```bash
docker compose run --rm migrate
```
