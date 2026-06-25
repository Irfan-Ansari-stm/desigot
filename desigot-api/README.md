# Desigot API — Express.js Backend

Production-grade REST API for the **Desigot** UI/UX Design Marketplace.  
Built with **Express.js + PostgreSQL + Redis + BullMQ**.

---

## Architecture

```
src/
├── config/          # App config & Winston logger
├── db/              # PostgreSQL pool, schema.sql, migrate.js
├── middleware/       # auth, validate, rateLimiter, upload, audit, errorHandler
├── modules/
│   ├── auth/        # Register, login, JWT, 2FA, OAuth
│   ├── users/       # Profile, KYC, sessions, balance
│   ├── categories/  # Listing category tree
│   ├── listings/    # CRUD, media upload, collections, quality scores
│   ├── orders/      # Purchase flow, licenses, downloads
│   ├── payments/    # Stripe intents, escrow, payouts, subscriptions, promo codes
│   ├── projects/    # Service workspace, milestones, files, messages
│   ├── reviews/     # Verified reviews, moderation, flags
│   ├── disputes/    # Dispute lifecycle, evidence, resolution
│   ├── notifications/ # In-app, push, email logs, preferences
│   ├── search/      # FTS, autocomplete, trending, recommendations
│   ├── wishlists/   # Buyer saved lists (shareable)
│   ├── admin/       # Metrics, audit logs, config, feature flags, webhooks
│   └── analytics/   # Seller + platform dashboards
├── shared/
│   ├── errors/      # AppError hierarchy
│   ├── utils/       # Slug, paginate, response helpers
│   └── validators/  # Common express-validator chains
├── workers/         # BullMQ escrow, notification, email, health score workers
├── app.js           # Express factory
└── server.js        # HTTP server bootstrap
```

---

## Quick Start (Without Docker)

### Prerequisites
- Node.js ≥ 18
- PostgreSQL 16+
- Redis 7+

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your DB, Redis, Stripe credentials
```

### 3. Create the database
```bash
psql -U postgres -c "CREATE DATABASE desigot;"
psql -U postgres -c "CREATE USER desigot_app WITH PASSWORD 'secret';"
psql -U postgres -c "GRANT ALL ON DATABASE desigot TO desigot_app;"
```

### 4. Run migrations (loads schema.sql)
```bash
npm run db:migrate
```

### 5. Start API server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Start background worker (separate terminal)
```bash
npm run worker
```

---

## Quick Start (With Docker)

```bash
# Start all services (API + Worker + PostgreSQL + Redis)
docker compose up --build

# With PgAdmin on http://localhost:5050
docker compose --profile tools up --build

# Stop all
docker compose down

# Stop and remove volumes (full reset)
docker compose down -v
```

The schema is automatically applied via `docker-entrypoint-initdb.d/`.

---

## API Base URL

```
http://localhost:4000/api/v1
```

### Health Checks
```
GET /health   → { status: "ok" }
GET /ready    → { status: "ready" }  (checks DB connection)
```

---

## Key API Endpoints

| Domain          | Base Path                  |
|-----------------|---------------------------|
| Auth            | `/api/v1/auth`            |
| Users           | `/api/v1/users`           |
| Categories      | `/api/v1/categories`      |
| Listings        | `/api/v1/listings`        |
| Orders          | `/api/v1/orders`          |
| Payments        | `/api/v1/payments`        |
| Projects        | `/api/v1/projects`        |
| Reviews         | `/api/v1/reviews`         |
| Disputes        | `/api/v1/disputes`        |
| Notifications   | `/api/v1/notifications`   |
| Search          | `/api/v1/search`          |
| Wishlists       | `/api/v1/wishlists`       |
| Admin           | `/api/v1/admin`           |
| Analytics       | `/api/v1/analytics`       |

---

## Authentication

All protected routes require:
```
Authorization: Bearer <access_token>
```

Refresh token is stored as an `httpOnly` cookie (`refreshToken`).

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_PRIMARY_URL` | PostgreSQL write connection |
| `DATABASE_REPLICA_URL` | PostgreSQL read replica (falls back to primary) |
| `REDIS_URL` | Redis for BullMQ job queues |
| `JWT_ACCESS_SECRET` | Min 64 chars in production |
| `JWT_REFRESH_SECRET` | Min 64 chars in production |
| `STRIPE_SECRET_KEY` | Stripe secret for payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signature secret |

---

## Database Tables Covered

All 46 tables from the schema are touched by this API:

`users` · `user_oauth_accounts` · `user_sessions` · `user_kyc_verifications` ·
`user_2fa_backup_codes` · `listing_categories` · `listings` · `listing_versions` ·
`listing_media` · `listing_quality_scores` · `listing_collections` ·
`listing_collection_items` · `wishlists` · `wishlist_items` · `orders` ·
`escrow_records` · `licenses` · `payment_intents` · `payout_methods` · `payouts` ·
`commission_ledger` · `seller_balances` · `seller_plans` · `subscription_records` ·
`projects` · `project_milestones` · `project_files` · `project_messages` ·
`reviews` · `review_responses` · `review_flags` · `notification_preferences` ·
`notifications` · `push_subscriptions` · `email_logs` · `disputes` ·
`search_queries` · `recommendation_events` · `audit_logs` · `platform_config` ·
`feature_flags` · `promo_codes` · `api_keys` · `webhook_endpoints` ·
`webhook_deliveries` · `seller_health_scores`

---

## Security Highlights

- **Helmet** security headers on all responses
- **bcrypt** (rounds=12) password hashing
- **JWT** access (15m) + refresh (30d) token rotation
- **TOTP 2FA** with backup codes
- **Rate limiting**: global, auth (20/15min), upload, search
- **CORS** with allowlist
- **RLS** context set per-request for sensitive queries
- **Immutable ledger**: commission_ledger and audit_logs cannot be modified
- **Parameterised queries** throughout — no SQL injection surface
- **httpOnly + secure** refresh token cookie

---

## License
Proprietary — © 2025 Desigot Inc.
