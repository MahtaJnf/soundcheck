# Soundcheck

> _The engineering work that happens before the audience arrives_

**Backend Project · 2026**

---

## What This Is

**Soundcheck** is a concert booking backend that handles ticket reservations at the seat level — the kind of system that breaks publicly when a tour goes on sale. Users browse events, hold a specific seat for a few minutes, complete payment via Stripe, and receive confirmation. There's also an AI concierge endpoint that answers natural-language questions about events using semantic search.

The frontend is intentionally minimal. **Every interesting engineering decision lives server-side** — concurrency control, payment idempotency, retrieval-augmented generation, deployment infrastructure. This is a portfolio project built to demonstrate mid-level backend competence, not a product.

---

## What It Does

### The User-Facing Flow

**01 · Browse events**
GET endpoints expose paginated event listings, with filters by date, venue, and tags. Cached in Redis with a short TTL so popular events don't hammer the database.

**02 · Hold a seat**
POST a hold and Soundcheck reserves that exact seat for 10 minutes via a Redis SETNX lock. You get a `holdToken` back. Two people can't hold the same seat — the second request fails cleanly.

**03 · Book the seat**
With a valid `holdToken`, the booking endpoint runs a Postgres transaction with row-level locking (`SELECT FOR UPDATE`) to prevent double-selling, transitions the seat to BOOKED, and creates a Booking record in HELD state.

**04 · Pay via Stripe**
A PaymentIntent is created server-side. The client confirms with Stripe directly. A webhook (signature-verified) tells Soundcheck the payment succeeded, and the booking transitions to PAID. The whole flow is idempotent — replaying the request never double-charges.

**05 · Ask the concierge**
A chat endpoint takes natural-language queries like _"any indie shows in LA next month under $50?"_ — embeds the question, runs a pgvector semantic search over event descriptions, and streams a Claude response with the matching events as context.

---

## What I Learned Building It

### The Six Concepts

| Concept                                 | What I Learned                                                                                                                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **01 · NestJS Architecture**            | Modules, providers, dependency injection, guards. Clean module boundaries that map to real domain concepts (Auth, Events, Bookings, Payments, Concierge).                        |
| **02 · Postgres Concurrency**           | Transactions, isolation levels, row-level locking with `SELECT FOR UPDATE`. The mechanism that prevents two users from buying the same seat at the same instant.                 |
| **03 · Redis for Ephemeral State**      | `SETNX` with TTL for seat holds — a pattern that survives process restarts, scales horizontally, and expires automatically. Also used for the idempotency cache.                 |
| **04 · Idempotency + Webhooks**         | Stripe webhook signature verification, raw body parsing, replay protection. Idempotency-Key middleware that dedups client retries via a hashed-body cache.                       |
| **05 · Retrieval-Augmented Generation** | Embeddings, pgvector semantic search, streaming responses from the Anthropic API. Real RAG — the LLM grounded in the actual event database, not making things up.                |
| **06 · Architecture Decision Records**  | Three ADRs documenting the locking strategy, idempotency design, and RAG-vs-fine-tuning tradeoff. The artifacts that turn "I built a project" into "I reasoned about tradeoffs." |

---

## Why a Booking System, Specifically

### ⚡ The race condition you don't see in tutorials

Two users click "buy" on the last seat at the same millisecond. Without proper concurrency control, both transactions read "1 seat available," both write "0 seats available," and the system happily confirms both purchases. The customer-facing result: someone shows up to the venue with a valid ticket and no seat.

**Soundcheck is built to make that bug impossible** — Redis holds prevent it at the application layer, Postgres row locks prevent it at the database layer, and a documented ADR explains why both layers exist. This is the engineering moment most "CRUD with auth" portfolio projects never reach.

---

## Stack

### Backend

- NestJS (TypeScript)
- PostgreSQL + Prisma
- Redis
- Stripe SDK
- pgvector
- Anthropic API

### Infrastructure

- Docker Compose (local)
- Railway (production)
- GitHub Actions (CI)
- OpenAPI / Swagger
- Vercel (frontend)

---

## Roadmap

- [x] **Phase 1 · Foundations + domain model** — NestJS scaffold, Docker Compose, Prisma schema, JWT auth
- [ ] **Phase 2 · Concurrency + booking core** — Redis seat holds, row-level locking, ADR-001
- [ ] **Phase 3 · Stripe + idempotency** — PaymentIntent flow, webhook verification, idempotency middleware, ADR-002
- [ ] **Phase 4 · RAG concierge** — pgvector, embeddings pipeline, streaming Claude responses, ADR-003
- [ ] **Phase 5 · Ship + document** — Railway deploy, architecture diagram, README polish

---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm or yarn

### Local Development

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd soundcheck
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start infrastructure**

   ```bash
   docker compose up -d
   ```

4. **Run database migrations**

   ```bash
   npx prisma migrate dev
   ```

5. **Start the development server**

   ```bash
   npm run start:dev
   ```

6. **Verify setup**
   Visit `http://localhost:3000/health` — you should see:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-05-07T..."
   }
   ```

---

## Project Structure

```
soundcheck/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Migration history
├── src/
│   ├── auth/                  # JWT authentication
│   ├── events/                # Event browsing
│   ├── bookings/              # Seat holds + bookings
│   ├── payments/              # Stripe integration
│   ├── concierge/             # AI chat endpoint
│   ├── prisma/                # Database service
│   └── health/                # Health check endpoint
├── docker-compose.yml         # Local infrastructure
├── prisma.config.ts           # Prisma 6 configuration
└── README.md
```

**Built by Mahta Jannatifar · 2026**
