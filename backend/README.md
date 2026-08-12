# Sportzing Backend

Sportzing is a real-time sports data API that manages matches and live commentary. It exposes a REST API for creating and querying match and commentary records, and a WebSocket server that pushes live events — new matches and per-match commentary — to subscribed clients as they happen.

---

## Tech Stack

| Package | Version | Role |
|---|---|---|
| `express` | ^5.2.1 | HTTP server + routing |
| `ws` | ^8.21.3 | WebSocket server |
| `drizzle-orm` | ^0.45.2 | ORM + query builder |
| `pg` | ^8.22.0 | PostgreSQL driver |
| `zod` | ^4.4.3 | Input validation schemas |
| `@arcjet/node` | ^1.10.0 | Rate limiting, bot detection, shield |
| `helmet` | ^8.x | HTTP security headers |
| `cors` | ^2.x | Cross-Origin Resource Sharing |
| `dotenv` | ^17.4.2 | Environment variable loading |
| `drizzle-kit` | ^0.31.10 | DB migration tooling (dev) |
| `nodemon` | ^3.1.14 | Dev server with hot reload (dev) |

---

## Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment variables

Copy the template below into `backend/.env` and fill in real values:

```dotenv
# Server
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# Database — PostgreSQL connection string (Neon, Supabase, local, etc.)
DATABASE_URL=postgresql://user:password@hostname/dbname?sslmode=require

# Connection pool tuning (optional — shown are defaults)
DB_MAX_CONNECTIONS=5
DB_IDLE_TIMEOUT_MS=10000
DB_CONNECTION_TIMEOUT_MS=5000

# Arcjet — get a key at https://arcjet.com
ARCJET_KEY=ajkey_...
ARCJET_ENV=development
# Set to LIVE to enforce rules; DRY_RUN logs decisions without blocking
ARCJET_MODE=LIVE

# Auth — a shared secret for write routes; generate with:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
API_SECRET_KEY=<your-64-char-hex-string>

# CORS — comma-separated list of browser origins allowed to call the API
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

**Required at startup (server refuses to start if missing):**
- `DATABASE_URL`
- `ARCJET_KEY`
- `API_SECRET_KEY`

### 3. Run database migrations

```bash
npm run db:generate   # regenerate migration files from schema changes
npm run db:migrate    # apply pending migrations to the database
```

### 4. Start the dev server

```bash
npm run dev
```

The server starts on `http://0.0.0.0:8000` by default (configure with `PORT` / `HOST`).

---

## API Reference

### Authentication

Write routes (`POST`) require a bearer token:

```
Authorization: Bearer <API_SECRET_KEY>
```

Read routes (`GET`) are public.

---

### Matches

#### `GET /api/matches`

Returns a list of matches, newest first.

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `limit` | integer (1–100) | No | Max results to return. Default: 50 |

**Response `200`:**
```json
[
  {
    "id": 1,
    "sport": "football",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "status": "live",
    "startTime": "2026-08-12T18:00:00.000Z",
    "endTime": "2026-08-12T20:00:00.000Z",
    "homeScore": 1,
    "awayScore": 0,
    "createdAt": "2026-08-12T17:00:00.000Z"
  }
]
```

---

#### `POST /api/matches` 🔒

Creates a new match. Requires `Authorization: Bearer <API_SECRET_KEY>` header. On success, broadcasts a `match_created` event to all connected WebSocket clients.

**Request body:**
```json
{
  "sport": "football",
  "homeTeam": "Arsenal",
  "awayTeam": "Chelsea",
  "startTime": "2026-08-12T18:00:00.000Z",
  "endTime": "2026-08-12T20:00:00.000Z",
  "homeScore": 0,
  "awayScore": 0
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `sport` | string | Yes | min length 1 |
| `homeTeam` | string | Yes | min length 1 |
| `awayTeam` | string | Yes | min length 1 |
| `startTime` | ISO 8601 datetime | Yes | must be before `endTime` |
| `endTime` | ISO 8601 datetime | Yes | must be after `startTime` |
| `homeScore` | integer | No | ≥ 0, default 0 |
| `awayScore` | integer | No | ≥ 0, default 0 |

Match `status` is computed automatically from `startTime`/`endTime` and the current time:
- `scheduled` — current time is before `startTime`
- `live` — current time is between `startTime` and `endTime`
- `finished` — current time is after `endTime`

**Response `201`:**
```json
{
  "id": 1,
  "sport": "football",
  "homeTeam": "Arsenal",
  "awayTeam": "Chelsea",
  "status": "scheduled",
  "startTime": "2026-08-12T18:00:00.000Z",
  "endTime": "2026-08-12T20:00:00.000Z",
  "homeScore": 0,
  "awayScore": 0,
  "createdAt": "2026-08-12T17:00:00.000Z"
}
```

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Validation failed (see `details` array for Zod issues) |
| `401` | Missing or malformed `Authorization` header |
| `403` | Invalid API key |

---

### Commentary

#### `GET /api/matches/:id/commentary`

Returns commentary entries for a match, ordered newest-first.

**Path parameters:**

| Param | Type | Required |
|---|---|---|
| `id` | integer (positive) | Yes |

**Query parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `limit` | integer (1–100) | No | Max results. Default: 100 |

**Response `200`:**
```json
[
  {
    "id": 42,
    "matchId": 1,
    "minute": 45,
    "sequence": 3,
    "period": "first_half",
    "eventType": "goal",
    "actor": "Saka",
    "team": "Arsenal",
    "message": "GOAL! Bukayo Saka fires it into the bottom corner!",
    "metadata": { "xG": 0.73 },
    "tags": ["goal", "right-foot"],
    "createdAt": "2026-08-12T18:46:30.000Z"
  }
]
```

---

#### `POST /api/matches/:id/commentary` 🔒

Adds a commentary entry to a match. Requires `Authorization: Bearer <API_SECRET_KEY>` header. On success, broadcasts a `commentary` event to all WebSocket clients subscribed to this match.

**Path parameters:**

| Param | Type | Required |
|---|---|---|
| `id` | integer (positive) | Yes |

**Request body:**
```json
{
  "minute": 45,
  "sequence": 3,
  "period": "first_half",
  "eventType": "goal",
  "actor": "Saka",
  "team": "Arsenal",
  "message": "GOAL! Bukayo Saka fires it into the bottom corner!",
  "metadata": { "xG": 0.73 },
  "tags": ["goal", "right-foot"]
}
```

| Field | Type | Required | Constraints |
|---|---|---|---|
| `minute` | integer | Yes | ≥ 0 |
| `sequence` | integer | No | ≥ 0 |
| `period` | string | Yes | min length 1 |
| `eventType` | string | No | — |
| `actor` | string | No | — |
| `team` | string | No | — |
| `message` | string | Yes | min length 1 |
| `metadata` | object | No | arbitrary key/value JSON |
| `tags` | string[] | No | — |

**Response `201`:** the created commentary object (same shape as the GET entry above).

**Error responses:**

| Status | Condition |
|---|---|
| `400` | Validation failed |
| `401` | Missing or malformed `Authorization` header |
| `403` | Invalid API key |

---

### Common Error Shape

```json
{
  "error": "Validation failed",
  "details": [
    { "code": "too_small", "path": ["message"], "message": "String must contain at least 1 character(s)" }
  ]
}
```

Stack traces are included in `development` mode only (never in production).

---

## WebSocket Protocol

### Connection

Connect to `ws://host:port/ws`. Any other path is rejected with HTTP 403.

The server applies Arcjet shield + bot detection + rate limiting (max 5 connections per 2 seconds per IP) to the upgrade request before accepting the WebSocket.

On successful connection, the server immediately sends:

```json
{ "type": "Welcome" }
```

### Messages the client sends

#### Subscribe to a match

```json
{ "type": "subscribe", "matchId": 1 }
```

- `matchId` must be a positive safe integer.
- Each client can subscribe to at most **50** matches simultaneously.
- Server replies: `{ "type": "subscribed", "matchId": 1 }`

#### Unsubscribe from a match

```json
{ "type": "unsubscribe", "matchId": 1 }
```

- Server replies: `{ "type": "unsubscribed", "matchId": 1 }`

### Messages the server pushes

#### New match created (broadcast to all connected clients)

```json
{
  "type": "match_created",
  "data": {
    "id": 1,
    "sport": "football",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "status": "scheduled",
    "startTime": "2026-08-12T18:00:00.000Z",
    "endTime": "2026-08-12T20:00:00.000Z",
    "homeScore": 0,
    "awayScore": 0,
    "createdAt": "2026-08-12T17:00:00.000Z"
  }
}
```

#### New commentary (pushed only to subscribers of that match)

```json
{
  "type": "commentary",
  "data": {
    "id": 42,
    "matchId": 1,
    "minute": 45,
    "message": "GOAL! Bukayo Saka fires it into the bottom corner!",
    "createdAt": "2026-08-12T18:46:30.000Z"
  }
}
```

#### Error (sent to the originating client only)

```json
{ "type": "error", "message": "Invalid JSON" }
{ "type": "error", "message": "Unknown message type" }
{ "type": "error", "message": "Subscription limit reached" }
```

### Heartbeat

The server pings every client every **30 seconds**. Clients that do not respond with a pong are terminated, which automatically cleans up their subscriptions.

---

## Security

- **Authentication**: Write routes require `Authorization: Bearer <API_SECRET_KEY>`. Read routes are public.
- **Rate limiting**: Arcjet sliding-window rate limiter (50 req/10s on HTTP; 5 connections/2s on WS), bot detection, and shield applied globally.
- **Input validation**: All route parameters, query strings, and request bodies are validated with Zod schemas before reaching the controller.
- **SQL injection**: All database access goes through Drizzle ORM's parameterized query builder. No raw SQL.
- **HTTP security headers**: `helmet` sets `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, and others on every response.
- **CORS**: Explicit allowlist via `CORS_ALLOWED_ORIGINS`. Requests from unlisted browser origins are rejected.
- **Error handling**: Stack traces are never sent to clients in production. Unexpected errors are logged server-side.
- **Payload limits**: HTTP JSON bodies capped at 50 KB; WebSocket messages capped at 1 MB.
- **WebSocket cleanup**: Dead connections detected by heartbeat are terminated and their subscriptions removed, preventing resource leaks.

---

## No Test Suite

There is currently no automated test suite. The existing `test` script in `package.json` is a placeholder. Adding tests with a framework like [Vitest](https://vitest.dev/) + [supertest](https://github.com/ladjs/supertest) is recommended.
