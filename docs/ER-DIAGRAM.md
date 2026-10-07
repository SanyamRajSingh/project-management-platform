# Flowtide Database Schema & Entity-Relationship (ER) Documentation

This document describes the relational database schema implemented in PostgreSQL for the Flowtide platform.

---

## 1. Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ MEMBERSHIPS : "has"
    USERS ||--o{ REFRESH_TOKENS : "owns"
    USERS ||--o{ EMAIL_VERIFICATION_TOKENS : "has"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "has"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ACTIVITIES : "performs"
    USERS ||--o{ PROJECTS : "creates"
    USERS ||--o{ TASKS : "creates / assigned"

    ORGANIZATIONS ||--o{ MEMBERSHIPS : "contains"
    ORGANIZATIONS ||--o{ PROJECTS : "owns"
    ORGANIZATIONS ||--o{ TASKS : "scopes"
    ORGANIZATIONS ||--o{ ACTIVITIES : "tracks"

    PROJECTS ||--o{ TASKS : "contains"

    USERS {
        uuid id PK
        varchar email UK "Indexed"
        varchar password_hash
        varchar first_name
        varchar last_name
        varchar status "active | suspended"
        timestamp email_verified_at
        uuid current_organization_id FK
        timestamp created_at
        timestamp updated_at
    }

    ORGANIZATIONS {
        uuid id PK
        varchar name
        varchar slug UK "Indexed"
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    MEMBERSHIPS {
        uuid id PK
        uuid user_id FK "Indexed"
        uuid organization_id FK "Indexed"
        varchar role "owner | admin | member"
        timestamp created_at
        timestamp updated_at
    }

    PROJECTS {
        uuid id PK
        uuid organization_id FK "Indexed"
        varchar name
        text description
        varchar status "Not Started | In Progress | Completed (Indexed with org_id)"
        date start_date
        date end_date
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "Soft delete"
    }

    TASKS {
        uuid id PK
        uuid project_id FK "Indexed"
        uuid organization_id FK "Indexed"
        varchar title "Task name"
        text description
        varchar status "todo (Pending) | in_progress | done (Completed)"
        varchar priority "low | medium | high | urgent"
        uuid assigned_to FK "Indexed, nullable"
        date due_date "Indexed, nullable"
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "Soft delete"
    }

    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK "Indexed"
        uuid family_id "Indexed for rotation"
        varchar token_hash UK
        varchar device
        varchar ip
        timestamp expires_at "Indexed"
        timestamp revoked_at
        timestamp created_at
    }

    NOTIFICATIONS {
        uuid id PK
        uuid user_id FK "Indexed"
        varchar type
        varchar title
        text message
        jsonb data
        timestamp read_at "Indexed, nullable"
        timestamp created_at
    }

    ACTIVITIES {
        uuid id PK
        uuid organization_id FK "Indexed"
        uuid user_id FK "Indexed, nullable"
        varchar action
        varchar entity_type
        uuid entity_id
        jsonb metadata
        timestamp created_at "Indexed"
    }
```

---

## 2. Table Specifications & Constraints

### 2.1 `users`
- **Primary Key:** `id` (UUID, `gen_random_uuid()`)
- **Unique Index:** `email` (lowercased)
- **Relationships:**
  - `current_organization_id` references `organizations(id)` (nullable, set during login/registration)

### 2.2 `organizations`
- **Primary Key:** `id` (UUID)
- **Unique Index:** `slug`
- **Multi-Tenant Scoping:** All core business objects (`projects`, `tasks`, `activities`, `memberships`) carry `organization_id` foreign keys with database-level cascading or soft-delete safety.

### 2.3 `projects`
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `organization_id` references `organizations(id)`
  - `created_by` references `users(id)`
- **Composite Index:** `(organization_id, status)` for instantaneous status-filtered project retrieval.
- **Assignment Attributes:**
  - `status`: `'Not Started'`, `'In Progress'`, `'Completed'`
  - `start_date`: optional project start date
  - `end_date`: optional project target delivery date (`start_date <= end_date`)

### 2.4 `tasks`
- **Primary Key:** `id` (UUID)
- **Foreign Keys:**
  - `project_id` references `projects(id)` ON DELETE CASCADE
  - `organization_id` references `organizations(id)`
  - `assigned_to` references `users(id)` (nullable)
  - `created_by` references `users(id)`
- **Composite Indexes:**
  - `(project_id, status)`
  - `(organization_id, status)`
  - `(organization_id, due_date)`
- **Assignment Attributes:**
  - `title` / name: Task title
  - `status`: `'todo'` (`'Pending'`), `'in_progress'` (`'In Progress'`), `'done'` (`'Completed'`)
  - `priority`: `'low'`, `'medium'`, `'high'`
  - `due_date`: optional deadline date

---

## 3. Data Integrity & Security Guarantees
1. **Relational Constraints:** Foreign keys strictly enforced in PostgreSQL engine.
2. **Multi-Tenant Ownership Isolation:** Queries are scoped at the ORM repository layer by `organizationId`, preventing cross-tenant and cross-user data leakage.
3. **No Plaintext Passwords:** Passwords hashed with Argon2id using cryptographically secure salts.
4. **Token Security:** Refresh tokens stored only as cryptographic hashes with token family rotation tracking to detect replay attacks.
