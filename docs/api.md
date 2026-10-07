# Flowtide REST API Documentation

> Complete endpoint reference for Flowtide Web and Mobile clients.

Interactive OpenAPI / Swagger documentation is available at runtime:
`http://localhost:3000/api/docs`

---

## 1. Routing & Versioning

Flowtide supports both direct `/api/` endpoints and `/api/v1/` versioned endpoints transparently:
- Standard: `/api/auth/login`, `/api/projects`, `/api/tasks`, `/api/dashboard`
- Versioned: `/api/v1/auth/login`, `/api/v1/projects`, `/api/v1/tasks`, `/api/v1/dashboard`

Both paths resolve to identical business handlers.

---

## 2. Global Headers & Response Structure

### Request Headers
- `Content-Type: application/json`
- `Authorization: Bearer <access_token>` (for all protected endpoints)
- `x-organization-id: <uuid>` (optional organization scope override)

### Successful Response Format
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-07T03:00:00.000Z"
}
```

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed: name must be a string",
  "error": "Bad Request",
  "timestamp": "2026-10-07T03:00:00.000Z"
}
```

---

## 3. Endpoints Reference

### 3.1 Authentication

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Create a new user account & organization | No |
| `POST` | `/api/auth/login` | Authenticate with email and password | No |
| `POST` | `/api/auth/refresh` | Exchange valid refresh token for a new access token | No |
| `POST` | `/api/auth/logout` | Revoke current refresh token and clear session | Yes |
| `GET` | `/api/auth/me` | Retrieve profile information for the authenticated user | Yes |

#### Register Payload
```json
{
  "email": "user@flowtide.app",
  "password": "SecurePassword123!",
  "firstName": "Alex",
  "lastName": "Vance",
  "organizationName": "Vance Engineering"
}
```

#### Login Payload
```json
{
  "email": "user@flowtide.app",
  "password": "SecurePassword123!"
}
```

---

### 3.2 Projects

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List projects (supports `search`, `status`, pagination) | Yes |
| `POST` | `/api/projects` | Create a new project | Yes |
| `GET` | `/api/projects/:id` | Get details and task summary of a specific project | Yes |
| `PUT` | `/api/projects/:id` | Update project fields (name, description, status, dates) | Yes |
| `DELETE` | `/api/projects/:id` | Delete a project and cascade delete associated tasks | Yes |

#### Create Project Payload
```json
{
  "name": "Mobile Redesign Sprint",
  "description": "Revamp the mobile client for Android SDK 52",
  "status": "in_progress",
  "startDate": "2026-10-01",
  "endDate": "2026-11-15"
}
```
*Allowed statuses: `planned`, `in_progress`, `completed`, `on_hold`*

---

### 3.3 Tasks

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | List tasks (supports `search`, `status`, `priority`, `projectId`) | Yes |
| `POST` | `/api/tasks` | Create a new task associated with a project | Yes |
| `GET` | `/api/tasks/:id` | Get details for a single task | Yes |
| `PUT` | `/api/tasks/:id` | Update task title, description, status, priority, or dates | Yes |
| `DELETE` | `/api/tasks/:id` | Delete a specific task | Yes |

#### Create Task Payload
```json
{
  "name": "Implement Offline Banner",
  "description": "Show subtle banner when NetInfo detects disconnected state",
  "priority": "high",
  "status": "todo",
  "dueDate": "2026-10-25T18:00:00.000Z",
  "projectId": "10000000-0000-0000-0000-000000000001"
}
```
*Allowed priorities: `low`, `medium`, `high`, `urgent`*
*Allowed statuses: `todo`, `in_progress`, `in_review`, `done`*

---

### 3.4 Dashboard

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard` | Aggregated metrics for projects and tasks | Yes |

#### Dashboard Response
```json
{
  "success": true,
  "data": {
    "totalProjects": 8,
    "totalTasks": 24,
    "completedTasks": 14,
    "pendingTasks": 10,
    "projectsInProgress": 5,
    "projectStatusDistribution": {
      "planned": 2,
      "in_progress": 5,
      "completed": 1,
      "on_hold": 0
    },
    "taskStatusDistribution": {
      "todo": 6,
      "in_progress": 4,
      "in_review": 0,
      "done": 14
    },
    "taskPriorityDistribution": {
      "low": 4,
      "medium": 12,
      "high": 6,
      "urgent": 2
    }
  }
}
```
