# FinEdge API

A RESTful Personal Finance & Expense Tracker API built with Node.js and Express.
[check requirements](./project-requirements.md)

---

## Description

FinEdge allows users to register, log income and expense transactions, and view financial summaries. Built as a backend-only API demonstrating Node.js fundamentals — layered MVC architecture, async/await, middleware, modular design, and clean REST principles.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (CommonJS) |
| Framework | Express 5 |
| Database | MongoDB + Mongoose |
| Validation | Zod |
| Authentication | JWT (jsonwebtoken) |
| Password Hashing | bcryptjs |
| Config | dotenv + envalid |
| Rate Limiting | express-rate-limit |
| CORS | cors |
| Testing | Jest + Supertest |

---

## Setup

**Prerequisites**
- Node.js v18+
- MongoDB instance (local or Atlas)

**MongoDB setup**

You need a running MongoDB instance before starting the app. Two options:

- **MongoDB Atlas (recommended)** — create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas), then copy the connection string into `MONGO_URI` in your `.env`
- **Local MongoDB** — install MongoDB Community Edition and start it with `mongod`. Use `MONGO_URI=mongodb://localhost:27017/finedge`

**Install dependencies**
```bash
npm install
```

**Configure environment**

Copy `.env.example` to `.env` and fill in the values:
```bash
cp .env.example .env
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `NODE_ENV` | Environment (`development`, `test`, `production`) | `development` |
| `MONGO_URI` | MongoDB connection string — required, no default | — |
| `JWT_SECRET` | Secret key for signing JWT tokens — required, no default | — |
| `JWT_EXPIRY` | JWT token expiry duration | `1h` |
| `SUMMARY_CACHE_TTL_MS` | How long (ms) the summary cache entry lives before expiry | `60000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit time window in milliseconds | `120000` |
| `RATE_LIMIT_MAX` | Max requests per IP per window | `100` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated list of allowed origins for CORS | `http://localhost:3000,http://localhost:5173` |

---

## Running the App

**Development** (with auto-reload via nodemon)
```bash
npm run dev
```

**Production**
```bash
npm start
```

**Run tests**
```bash
# Coverage report
npm run test:coverage

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

```

---

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Server health check |
| POST | `/api/v1/users` | No | Register new user |
| POST | `/api/v1/users/login` | No | Login + receive JWT |
| POST | `/api/v1/transactions` | Yes | Add income/expense |
| GET | `/api/v1/transactions` | Yes | List all transactions |
| GET | `/api/v1/transactions/:id` | Yes | Get single transaction |
| PATCH | `/api/v1/transactions/:id` | Yes | Update transaction |
| DELETE | `/api/v1/transactions/:id` | Yes | Delete transaction |
| GET | `/api/v1/summary` | Yes | Income/expense summary (cached, filterable) |
| GET | `/api/v1/summary?category=food` | Yes | Summary filtered by category |
| GET | `/api/v1/summary?startDate=2026-01-01&endDate=2026-06-01` | Yes | Summary filtered by date range |
| GET | `/api/v1/summary/trends` | Yes | Monthly income/expense breakdown |

---

## Bonus Sections

### A. Analytics & Reporting
- ✅ Calculate total income, expenses, and balance
- ✅ Filter transactions by category/date
- ✅ Show monthly trends

### B. AI or Automation Feature
  (did not get time!)
- ❌ Suggest saving tips or budgets based on past spending
- ❌ Auto-categorize expenses using keyword matching
- ❌ Real-time updates on new transactions

### C. Data Persistence
- ✅ Store and retrieve data using MongoDB

### D. Advanced Middleware
- ✅ Rate limiter for requests
- ✅ CORS and request logging
- ✅ In-memory cache service with TTL expiry on `/summary`

---

## Design Decisions

### Layered Architecture
Strict separation of concerns: `routes → controllers → services → models`. Controllers handle request/response only. Services handle business logic and never touch `req`/`res`. This makes each layer independently testable and replaceable.

### Centralized Error Handling
All errors flow through a central `error.middleware.js` via `next(err)`. Custom `AppError` subclasses (`BadRequestError`, `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`) carry their own status codes. Controllers stay clean — they only call `next(err)` in the catch block.

### Zod Validation at the Boundary
Request bodies and query params are validated via Zod schemas before reaching controllers. Invalid input is rejected early with a 422 and field-level error details. `req.body` / `req.query` are replaced with Zod's parsed output — extra fields are stripped automatically.

### Currency Stored in Subunits
Transaction amounts are stored in subunits (e.g. paisa for INR, cents for USD) as integers to avoid floating-point arithmetic errors. Conversion between major units and subunits is handled in `src/utils/currency.js`. The client always sends and receives amounts in major units (e.g. `100.50`).

### Currency on Transaction Document
A user's currency preference lives on their profile. On transaction creation, the user's currency is fetched from the DB (one extra call) and stored on the transaction document. All subsequent operations (GET, PATCH, DELETE) use the transaction's own currency — no further DB calls needed. In production, this single lookup would be served from a Redis cache.

### Summary Caching
`GET /summary` with no filters is cached in-memory per user with a configurable TTL (`SUMMARY_CACHE_TTL_MS`). Filtered requests (`?category`, `?startDate`, `?endDate`) always bypass the cache. The cache is invalidated on any transaction mutation (create, update, delete) to prevent stale results — TTL acts as a safety net, not the primary invalidation mechanism.

The cache is implemented as a factory (`createCache`) that creates isolated `Map` instances per domain. Each cache instance has its own TTL baked in at creation time — callers never pass TTL per entry, keeping the cache policy centralised.

### CORS
CORS is configured to allow only explicitly whitelisted origins (`CORS_ALLOWED_ORIGINS`). This is a browser-only enforcement — Postman, curl, and Supertest are unaffected.

To observe CORS in action: serve a static HTML file with a `fetch()` call to this API from a different port (e.g. `npx serve -p 4444`). A request from `http://localhost:4444` will be blocked by the browser unless that origin is in `CORS_ALLOWED_ORIGINS`.

### Rate Limiting
All routes are rate-limited to `RATE_LIMIT_MAX` requests per `RATE_LIMIT_WINDOW_MS` per IP. Returns `429 Too Many Requests` when exceeded. Rate limiting is disabled in the `test` environment to prevent test failures from request volume.

### DB Error Handling Tradeoff
Mongoose-specific errors (`CastError`, `ValidationError`, `11000`) are not translated at the service layer. In edge cases they surface as 500s and are logged server-side only. The correct production pattern would be a repository layer that catches and translates DB errors to domain errors, keeping services DB-agnostic. This is out of scope for the assignment.

### JWT — Single Token
A single JWT is issued on login with a configurable expiry (`JWT_EXPIRY`). No refresh token flow. Password hashing uses `bcryptjs` with a salt round of 10.

### Transaction Date vs Created Date
Transactions carry an explicit `transactionDate` field (set by the client) separate from Mongoose's auto-managed `createdAt`. This distinction is intentional — a user may log a transaction that occurred in the past. `createdAt` records when it was logged; `transactionDate` records when it actually happened.

---

## API Reference

> Use the curl commands below for manual functional testing.

> Set your token after login:
> ```bash
> TOKEN="your_jwt_token_here"
> ```

---

### Health

```bash
# Health check
curl -s -i http://localhost:3000/health
# 200 OK — { "status": "ok" }
```

---

### Users

```bash
# Register — valid (201)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "alice@example.com", "password": "password123", "currency": "INR"}'

# Register — missing required field (422)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'

# Register — invalid email (422)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "email": "not-an-email", "password": "password123"}'

# Register — password too short (422)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "email": "bob@example.com", "password": "123"}'

# Register — duplicate email (409)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "alice2", "email": "alice@example.com", "password": "password123"}'

# Register — duplicate username (409)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "email": "different@example.com", "password": "password123"}'

# Register — no currency provided, defaults to INR (201)
curl -s -i -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "bob", "email": "bob@example.com", "password": "password123"}'

# Login — valid credentials (200)
curl -s -i -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "password123"}'

# Login — missing email (422)
curl -s -i -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"password": "password123"}'

# Login — missing password (422)
curl -s -i -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com"}'

# Login — user not found (404)
curl -s -i -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "unknown@example.com", "password": "password123"}'

# Login — wrong password (400)
curl -s -i -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alice@example.com", "password": "wrongpassword"}'
```

---

### Transactions

```bash
# Create — valid expense (201)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "amount": 100.50, "transactionDate": "2026-06-01"}'

# Create — valid income (201)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "income", "category": "salary", "amount": 5000, "transactionDate": "2026-06-01"}'

# Create — with optional description (201)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "amount": 50, "transactionDate": "2026-06-01", "description": "lunch"}'

# Create — missing Authorization header (401)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{"type": "expense", "category": "food", "amount": 100.50, "transactionDate": "2026-06-01"}'

# Create — invalid token (401)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer badtoken" \
  -d '{"type": "expense", "category": "food", "amount": 100.50, "transactionDate": "2026-06-01"}'

# Create — missing type (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category": "food", "amount": 100.50, "transactionDate": "2026-06-01"}'

# Create — invalid type value (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "transfer", "category": "food", "amount": 100.50, "transactionDate": "2026-06-01"}'

# Create — missing amount (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "transactionDate": "2026-06-01"}'

# Create — zero amount (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "amount": 0, "transactionDate": "2026-06-01"}'

# Create — negative amount (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "amount": -100, "transactionDate": "2026-06-01"}'

# Create — missing transactionDate (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "amount": 100.50}'

# Create — missing category (422)
curl -s -i -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "amount": 100.50, "transactionDate": "2026-06-01"}'

# Get all — valid (200)
curl -s -i http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN"

# Get all — missing Authorization header (401)
curl -s -i http://localhost:3000/api/v1/transactions

# Get all — invalid token (401)
curl -s -i http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer badtoken"

# Get all — cross-user isolation, returns empty array for another user (200)
curl -s -i http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN_BOB"

# Get by id — valid (200)
curl -s -i http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Authorization: Bearer $TOKEN"

# Get by id — missing Authorization header (401)
curl -s -i http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6

# Get by id — invalid token (401)
curl -s -i http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Authorization: Bearer badtoken"

# Get by id — transaction not found (404)
curl -s -i http://localhost:3000/api/v1/transactions/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"

# Get by id — invalid ObjectId format (400)
curl -s -i http://localhost:3000/api/v1/transactions/not-a-valid-id \
  -H "Authorization: Bearer $TOKEN"

# Get by id — cross-user isolation, returns 404 for another user's transaction (404)
curl -s -i http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Authorization: Bearer $TOKEN_BOB"

# Update — valid, multiple fields (200)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category": "travel", "amount": 200.75}'

# Update — partial update, single field (200)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"description": "flight tickets"}'

# Update — missing Authorization header (401)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -d '{"category": "travel"}'

# Update — invalid token (401)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer badtoken" \
  -d '{"category": "travel"}'

# Update — transaction not found (404)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category": "travel"}'

# Update — invalid ObjectId format (400)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/not-a-valid-id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"category": "travel"}'

# Update — zero amount (422)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 0}'

# Update — invalid type value (422)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "transfer"}'

# Update — cross-user isolation, returns 404 for another user's transaction (404)
curl -s -i -X PATCH http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_BOB" \
  -d '{"category": "travel"}'

# Delete — valid (200)
curl -s -i -X DELETE http://localhost:3000/api/v1/transactions/6a2d83d599af056473f47efc \
  -H "Authorization: Bearer $TOKEN"

# Delete — verify deleted transaction is gone (404)
curl -s -i http://localhost:3000/api/v1/transactions/6a2d83d599af056473f47efc \
  -H "Authorization: Bearer $TOKEN"

# Delete — missing Authorization header (401)
curl -s -i -X DELETE http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6

# Delete — invalid token (401)
curl -s -i -X DELETE http://localhost:3000/api/v1/transactions/6a2d827199af056473f47ef6 \
  -H "Authorization: Bearer badtoken"

# Delete — transaction not found (404)
curl -s -i -X DELETE http://localhost:3000/api/v1/transactions/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer $TOKEN"

# Delete — invalid ObjectId format (400)
curl -s -i -X DELETE http://localhost:3000/api/v1/transactions/not-a-valid-id \
  -H "Authorization: Bearer $TOKEN"

# Delete — cross-user isolation, returns 404 for another user's transaction (404)
curl -s -i -X DELETE http://localhost:3000/api/v1/transactions/6a2d829a99af056473f47ef9 \
  -H "Authorization: Bearer $TOKEN_BOB"

# Delete — verify cross-user isolated transaction is still intact (200)
curl -s -i http://localhost:3000/api/v1/transactions/6a2d829a99af056473f47ef9 \
  -H "Authorization: Bearer $TOKEN"
```

---

### Summary

```bash
# All-time summary (200)
curl -s -i http://localhost:3000/api/v1/summary \
  -H "Authorization: Bearer $TOKEN"

# Cache hit — second request returns fromCache: true (200)
curl -s -i http://localhost:3000/api/v1/summary \
  -H "Authorization: Bearer $TOKEN"

# Filter by category (200)
curl -s -i "http://localhost:3000/api/v1/summary?category=food" \
  -H "Authorization: Bearer $TOKEN"

# Filter by date range (200)
curl -s -i "http://localhost:3000/api/v1/summary?startDate=2026-04-01&endDate=2026-04-30" \
  -H "Authorization: Bearer $TOKEN"

# Filter by category and date range combined (200)
curl -s -i "http://localhost:3000/api/v1/summary?category=food&startDate=2026-04-01&endDate=2026-05-31" \
  -H "Authorization: Bearer $TOKEN"

# Missing Authorization header (401)
curl -s -i http://localhost:3000/api/v1/summary

# Invalid token (401)
curl -s -i http://localhost:3000/api/v1/summary \
  -H "Authorization: Bearer badtoken"

# Invalid startDate format (422)
curl -s -i "http://localhost:3000/api/v1/summary?startDate=not-a-date" \
  -H "Authorization: Bearer $TOKEN"

# startDate after endDate (422)
curl -s -i "http://localhost:3000/api/v1/summary?startDate=2026-06-01&endDate=2026-04-01" \
  -H "Authorization: Bearer $TOKEN"

# Cross-user isolation, returns zeroed summary for another user (200)
curl -s -i http://localhost:3000/api/v1/summary \
  -H "Authorization: Bearer $TOKEN_BOB"

# Trends — monthly breakdown sorted chronologically (200)
curl -s -i http://localhost:3000/api/v1/summary/trends \
  -H "Authorization: Bearer $TOKEN"

# Trends — missing Authorization header (401)
curl -s -i http://localhost:3000/api/v1/summary/trends

# Trends — invalid token (401)
curl -s -i http://localhost:3000/api/v1/summary/trends \
  -H "Authorization: Bearer badtoken"

# Trends — cross-user isolation, returns empty array for another user (200)
curl -s -i http://localhost:3000/api/v1/summary/trends \
  -H "Authorization: Bearer $TOKEN_BOB"
```
