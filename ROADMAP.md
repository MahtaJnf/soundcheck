# Soundcheck Development Roadmap

**Last Updated:** 2026-05-07
**Current Phase:** Phase 1 (In Progress)

---

## Phase 1: Foundations + Domain Model ✅ (Partial)

### Completed ✅
- [x] NestJS scaffold
- [x] Docker Compose (Postgres + Redis)
- [x] Prisma setup with initial User model
- [x] PrismaModule with lifecycle management
- [x] HealthModule with database connectivity check
- [x] Project README

### Next Steps 🔨

**1. Complete Prisma Schema (30-45 min)**
- [ ] Add Event model (title, description, date, venue, price, tags, embedding)
- [ ] Add Venue model (name, address, capacity, seatMap)
- [ ] Add Seat model (seatNumber, row, section, eventId, status: AVAILABLE | HELD | BOOKED)
- [ ] Add Booking model (userId, seatId, status: HELD | PAID | CANCELLED, holdExpiresAt, holdToken)
- [ ] Add Payment model (bookingId, stripePaymentIntentId, amount, status)
- [ ] Create relationships between models
- [ ] Run migration: `npx prisma migrate dev --name add-domain-models`

**2. Implement JWT Authentication (45-60 min)**
- [ ] Install dependencies: `npm install @nestjs/jwt @nestjs/passport passport-jwt bcrypt @types/bcrypt`
- [ ] Create AuthModule: `nest g module auth && nest g service auth && nest g controller auth`
- [ ] Implement JwtStrategy and JwtAuthGuard
- [ ] Add `/auth/register` endpoint (hash password with bcrypt)
- [ ] Add `/auth/login` endpoint (return JWT token)
- [ ] Create `@CurrentUser()` decorator for extracting user from request
- [ ] Add JWT_SECRET to .env

**3. Seed Database (15-20 min)**
- [ ] Create `prisma/seed.ts` with sample events, venues, and seats
- [ ] Add seed script to package.json: `"seed": "ts-node prisma/seed.ts"`
- [ ] Run: `npm run seed`

---

## Phase 2: Concurrency + Booking Core 🚧 (Next)

**Timeline:** 4-6 hours

### 4. Set up Redis for Seat Holds (20-30 min)
- [ ] Install: `npm install ioredis @nestjs/ioredis`
- [ ] Create RedisModule: `nest g module redis && nest g service redis`
- [ ] Configure RedisService with ioredis client
- [ ] Wire into app.module imports
- [ ] Add REDIS_URL to .env (already exists)

### 5. Implement Seat Hold Logic (45-60 min)
- [ ] Create BookingsModule: `nest g module bookings && nest g service bookings && nest g controller bookings`
- [ ] POST `/bookings/hold` endpoint
  - Check seat availability in Postgres
  - Create Redis lock with SETNX: `seat-hold:{seatId}` (TTL: 600s)
  - Return holdToken (UUID)
- [ ] GET `/bookings/hold/:token` to check hold status
- [ ] Background cleanup (optional - Redis TTL handles expiry)

### 6. Implement Booking with Row-Level Locking (60-90 min)
- [ ] POST `/bookings/book` endpoint
  - Validate holdToken exists in Redis
  - Start Postgres transaction
  - `SELECT FOR UPDATE` on seat row (prevents concurrent access)
  - Verify seat status is AVAILABLE
  - Update seat status to BOOKED
  - Create Booking record with status HELD
  - Delete Redis hold: `DEL seat-hold:{seatId}`
  - Commit transaction
- [ ] Handle race conditions (return 409 Conflict if seat taken)
- [ ] Add proper error handling and rollback

### 7. Write ADR-001: Concurrency Strategy (20-30 min)
- [ ] Create `docs/adr/` directory
- [ ] Write `001-concurrency-control.md`
  - Problem: Race condition on last seat
  - Decision: Two-layer locking (Redis + Postgres)
  - Rationale: Redis for speed, Postgres for consistency
  - Tradeoffs: Complexity vs correctness
  - Alternatives considered: Optimistic locking, queue-based

### 8. Test Concurrency (30-45 min)
- [ ] Install testing dependencies if needed
- [ ] Write integration test simulating 2 concurrent hold requests
- [ ] Write integration test simulating 2 concurrent book requests
- [ ] Verify only one succeeds in both cases
- [ ] Test hold expiry behavior

---

## Phase 3: Stripe + Idempotency 🔜

**Timeline:** 4-5 hours

### 9. Stripe Integration
- [ ] Install: `npm install stripe`
- [ ] Create PaymentsModule
- [ ] POST `/payments/create-intent` endpoint
- [ ] Webhook endpoint: POST `/payments/webhook`
- [ ] Signature verification with `stripe.webhooks.constructEvent`
- [ ] Handle `payment_intent.succeeded` event
- [ ] Update Booking status to PAID

### 10. Idempotency Middleware
- [ ] Create IdempotencyMiddleware
- [ ] Hash request body for idempotency key
- [ ] Store in Redis with TTL (24 hours)
- [ ] Return cached response for duplicate requests
- [ ] Apply to booking + payment endpoints

### 11. Write ADR-002: Idempotency Design
- [ ] Document why idempotency matters (retry storms, double-charges)
- [ ] Explain hash-based key generation
- [ ] Redis as cache layer
- [ ] Tradeoffs: Storage vs safety

---

## Phase 4: RAG Concierge 🔜

**Timeline:** 5-6 hours

### 12. pgvector Setup
- [ ] Enable pgvector extension in Postgres
- [ ] Add embedding column to Event model (vector type)
- [ ] Create vector index

### 13. Embeddings Pipeline
- [ ] Install: `npm install @anthropic-ai/sdk`
- [ ] Create embedding generation script
- [ ] Generate embeddings for existing events
- [ ] Background job for new events

### 14. Concierge Endpoint
- [ ] Create ConciergeModule
- [ ] POST `/concierge/ask` endpoint
- [ ] Embed user question
- [ ] pgvector similarity search (top 5 events)
- [ ] Stream Claude response with event context
- [ ] Handle streaming properly with SSE

### 15. Write ADR-003: RAG vs Fine-tuning
- [ ] Why RAG over fine-tuning
- [ ] Freshness and cost tradeoffs
- [ ] pgvector performance considerations

---

## Phase 5: Ship + Document 🔜

**Timeline:** 3-4 hours

### 16. Deployment
- [ ] Create Railway account
- [ ] Configure Railway Postgres + Redis
- [ ] Add environment variables
- [ ] Deploy NestJS app
- [ ] Run migrations on production DB
- [ ] Test production endpoints

### 17. Documentation
- [ ] Create architecture diagram (system design)
- [ ] Add API documentation with Swagger/OpenAPI
- [ ] Polish README with live demo link
- [ ] Add screenshots/demo video
- [ ] Update roadmap checkboxes

### 18. CI/CD
- [ ] Create GitHub Actions workflow
- [ ] Run tests on PR
- [ ] Auto-deploy to Railway on merge to main

---

## Quick Start Commands (Reference)

```bash
# Start infrastructure
docker compose up -d

# Check services
docker compose ps

# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# Start dev server
npm run start:dev

# Run tests
npm run test

# Seed database
npm run seed
```

---

## Environment Variables Checklist

Current `.env`:
```
PORT=3000
DATABASE_URL="postgresql://soundcheck:soundcheck@localhost:5432/soundcheck"
REDIS_URL="redis://localhost:6379"
```

TODO - Add in future phases:
- `JWT_SECRET` (Phase 1)
- `STRIPE_SECRET_KEY` (Phase 3)
- `STRIPE_WEBHOOK_SECRET` (Phase 3)
- `ANTHROPIC_API_KEY` (Phase 4)

---

## Notes for Next Session

**Start here:**
1. Review this roadmap
2. Continue from Phase 1, step 1 (Complete Prisma Schema)
3. Work through tasks sequentially
4. Update checkboxes as you complete items
5. Commit after each major milestone

**Learning approach:**
- Ask Claude to explain WHY before implementing
- Understand the tradeoffs
- Don't just copy-paste
- Write ADRs to document decisions

**Session goals:**
- Phase 1: Get domain model + auth working (foundation for everything)
- Phase 2: Solve the concurrency problem (the core engineering challenge)
- Phase 3: Handle payments safely (real-world integration)
- Phase 4: Add AI layer (modern stack demo)
- Phase 5: Ship it (portfolio-ready)

---

**Last Status:** Docker ✅ | Prisma ✅ | Health Check ✅ | Auth ⏳ | Domain Model ⏳
