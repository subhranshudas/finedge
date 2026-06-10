# FinEdge API

A RESTful Personal Finance & Expense Tracker API built with Node.js and Express.

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
| Testing | Jest + Supertest |

---

## Setup

**Prerequisites**
- Node.js v18+
- MongoDB instance (local or Atlas)

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
| `MONGO_URI` | MongoDB connection string | — |
| `JWT_SECRET` | Secret key for signing JWT tokens | — |
| `JWT_EXPIRY` | JWT token expiry duration | `1h` |

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
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# All tests
npm test

# Coverage report
npm run test:coverage
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
| GET | `/api/v1/summary` | Yes | Income/expense summary |

---

## Design Decisions

### Layered Architecture
Strict separation of concerns: `routes → controllers → services → models`. Controllers handle request/response only. Services handle business logic and never touch `req`/`res`. This makes each layer independently testable and replaceable.

### Centralized Error Handling
All errors flow through a central `error.middleware.js` via `next(err)`. Custom `AppError` subclasses (`BadRequestError`, `NotFoundError`, `ConflictError`, `ValidationError`, `UnauthorizedError`) carry their own status codes. Controllers stay clean — they only call `next(err)` in the catch block.

### Zod Validation at the Boundary
Request bodies are validated via Zod schemas before reaching controllers. Invalid input is rejected early with a 422 and field-level error details. `req.body` is replaced with Zod's parsed (and sanitized) output — extra fields are stripped automatically.

### Currency Stored in Subunits
Transaction amounts are stored in subunits (e.g. paisa for INR, cents for USD) as integers to avoid floating-point arithmetic errors. Conversion between major units and subunits is handled in `src/utils/currency.js`. The client always sends and receives amounts in major units (e.g. `100.50`).

### Currency on Transaction Document
A user's currency preference lives on their profile. On transaction creation, the user's currency is fetched from the DB (one extra call) and stored on the transaction document. All subsequent operations (GET, PATCH, DELETE) use the transaction's own currency — no further DB calls needed. In production, this single lookup would be served from a Redis cache.

### DB Error Handling Tradeoff
Mongoose-specific errors (`CastError`, `ValidationError`, `11000`) are not translated at the service layer. In edge cases they surface as 500s and are logged server-side only. The correct production pattern would be a repository layer that catches and translates DB errors to domain errors, keeping services DB-agnostic. This is out of scope for the assignment.

### JWT — Single Token
A single JWT is issued on login with a configurable expiry (`JWT_EXPIRY`). No refresh token flow. Password hashing uses `bcryptjs` with a salt round of 10.

### Transaction Date vs Created Date
Transactions carry an explicit `transactionDate` field (set by the client) separate from Mongoose's auto-managed `createdAt`. This distinction is intentional — a user may log a transaction that occurred in the past. `createdAt` records when it was logged; `transactionDate` records when it actually happened.

---

## API Reference

> Set your token after login:
> ```bash
> TOKEN="your_jwt_token_here"
> ```

---

### Health

```bash
# Health check
curl http://localhost:3000/health
```

---

### Users

```bash
# Register
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "email": "test@example.com", "password": "123456"}'

# Login
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "123456"}'
```

---

### Transactions

```bash
# Create transaction
curl -X POST http://localhost:3000/api/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type": "expense", "category": "food", "amount": 100.50, "transactionDate": "2026-06-09"}'

# Get all transactions
curl http://localhost:3000/api/v1/transactions \
  -H "Authorization: Bearer $TOKEN"

# Get single transaction
curl http://localhost:3000/api/v1/transactions/:id \
  -H "Authorization: Bearer $TOKEN"

# Update transaction
curl -X PATCH http://localhost:3000/api/v1/transactions/:id \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"amount": 200.75}'

# Delete transaction
curl -X DELETE http://localhost:3000/api/v1/transactions/:id \
  -H "Authorization: Bearer $TOKEN"
```

---

### Summary

- Todo
