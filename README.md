# NexView Backend

Node.js + Express + MongoDB (Mongoose) backend for IFMS, built to the
PRD/Technical Design document. Implements a **3-layer architecture**
(Controller → Service → Repository) inside a **feature-based module
structure**.

## Folder Structure

```
src/
  config/            env.js (env loader), db.js (Mongoose connection)
  common/
    middlewares/      authenticate, authorize (RBAC), errorHandler,
                       notFound, validateRequest, rateLimiter
    utils/             AppError, catchAsync, response envelope, logger,
                        shared Zod schemas (ObjectId/pagination)
    constants/          shared enums (roles, levels, statuses, etc.)
    services/           NotificationService (reserved, no delivery yet)
  modules/
    auth/               login, refresh, logout, forgot/reset password
    users/              Manager/Instructor account management
    students/           Student CRUD + Google Sheets import workflow
    interviews/         Interview lifecycle (start/cancel/status)
    feedback/           Feedback form, drafts, final submit, evaluations,
                         manager edits + audit log, technical summaries
    technologies/        Technology -> Topic -> Question catalog
    dashboard/            Instructor & Manager dashboard aggregations
    managerNotes/         Manager-only notes on students/interviews
    notifications/        Schema only - reserved for a future version
  routes/
    index.js              Mounts every module's router under /api/v1
  seed/
    seed.js                Seeds Technology catalog + a default Manager
  app.js                   Express app (middleware, routes, error handling)
  server.js                Process entry point (connects DB, then listens)
```

Each module with data follows the same pattern:

```
<name>.model.js        Mongoose schema
<name>.repository.js   All direct DB queries - no business logic
<name>.service.js       Business rules - calls the repository, never
                        the Mongoose model directly
<name>.controller.js    Parses req, calls the service, shapes the res
<name>.validation.js    Zod schemas for body/params/query
<name>.routes.js        Express router, wires middleware + validation
```

## Getting Started

```bash
npm install
cp .env.example .env
# then edit .env and set MONGO_URI to your connection string
npm run dev        # nodemon, restarts on file changes
# or
npm start
```

Seed the Technology catalog + a default Manager login:

```bash
node src/seed/seed.js
```

This creates `manager@programminghero.dev` / `ChangeMe123!` if no
Manager account exists yet (override via `SEED_MANAGER_EMAIL` /
`SEED_MANAGER_PASSWORD` env vars). **Change this password immediately**
in any real environment.

## Environment Variables

See `.env.example` for the full list with comments. The only one you
must fill in to get started is `MONGO_URI`. Everything else has a
sane development default.

env.example

# Server
NODE_ENV=development
PORT=5000

# MongoDB
# Fill this in later with your real Atlas / self-hosted connection string.
# Example: mongodb+srv://<user>:<password>@cluster0.mongodb.net/ifms?retryWrites=true&w=majority
MONGO_URI=mongodb+srv://<db_username>:8VDiqQQzEY9eHSbU@cluster0.u2x9tqz.mongodb.net/?appName=Cluster0

# JWT Auth
# Use long, random, high-entropy strings in real environments (openssl rand -hex 64)
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=replace-with-a-different-long-random-secret
JWT_REFRESH_EXPIRES_IN=7d

# Cookies
COOKIE_SECURE=false
COOKIE_DOMAIN=localhost

# CORS - comma separated list of allowed origins
CORS_ORIGINS=http://localhost:3000

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# Bcrypt
BCRYPT_SALT_ROUNDS=12


## API Overview

The API is fully documented and structured under the `/api/v1` base path.

Base path: `/api/v1`. Every route except `/auth/login`, `/auth/refresh`,
`/auth/forgot-password`, and `/auth/reset-password` requires
`Authorization: Bearer <accessToken>`.

| Module | Base path | Notes |
|---|---|---|
| Auth | `/api/v1/auth` | JWT access token (15m) + httpOnly refresh cookie (7d) |
| Users | `/api/v1/users` | Manager-only |
| Students | `/api/v1/students` | Scoped to assigned instructor unless Manager |
| Interviews | `/api/v1/interviews` | Start/cancel/list, scoped like Students |
| Feedback | `/api/v1/feedback` | Draft/submit/manager-edit/evaluations/summary |
| Technologies | `/api/v1/technologies` | Technology/Topic/Question catalog |
| Dashboard | `/api/v1/dashboard` | `/instructor` and `/manager` widgets |
| Manager Notes | `/api/v1/manager-notes` | Manager-only |

Every response follows the same envelope:

```json
{ "success": true, "data": {}, "meta": null, "error": null }
```

```json
{ "success": false, "data": null, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": ["..."] } }
```

## Key Design Decisions (carried over from the PRD)

- **Draft vs Final is one document, not two tables.** `feedback.status`
  (`draft` | `final`) flips in place on submit - no data duplication or
  migration between "draft" and "final" records.
- **Server-side re-validation of the camera conditional logic.** If
  `cameraOn` is false, the camera sub-fields are nulled out server-side
  regardless of what the client sends.
- **Manager edits to final feedback are never silent.** Every edit
  writes an immutable `FeedbackAuditLog` row with a before/after diff.
- **Catalog governance.** Topics/Questions created by an Instructor
  start `pending`; a Manager must approve them. Manager-created entries
  are auto-approved.
- **Topic/Technical summaries are computed at read time** from the
  `Evaluation` collection, never stored, so they can't drift out of
  sync with the raw evaluation rows.
- **Refresh tokens are stored server-side (hashed).** This allows
  instant session revocation on logout or account deactivation, which
  a purely stateless JWT refresh token cannot do.
- **Notifications module is schema-only.** Nothing sends an email or
  push notification yet (explicitly out of scope for MVP per the PRD) -
  the collection and a `NotificationService.send()` seam exist so a
  future version can add real delivery without a schema change.

## Not Implemented Yet (see PRD "Future Scope")

AI-generated feedback, voice notes, speech-to-text, interview
recording, Google Meet integration, PDF export, scheduled two-way
Google Sheets sync, and real notification delivery are intentionally
out of scope for this MVP.
