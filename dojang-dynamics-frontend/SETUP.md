# Dojang Dynamics — Full Setup Guide

## Repository Structure

```
dojang-dynamics/
├── dojang-dynamics-frontend/   ← Next.js static site (GitHub Pages)
└── dojang-dynamics-backend/    ← Express + Prisma API (Railway)
```

---

## Prerequisites

- Node.js 20+
- PostgreSQL (local or Railway)
- Stripe account
- Cloudflare R2 bucket (or similar S3-compatible storage)
- GitHub account
- Railway account

---

## 1. Backend — Local Development

### 1.1 Install dependencies

```bash
cd dojang-dynamics-backend
npm install
```

### 1.2 Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

Required `.env` values:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/dojang_dynamics"
JWT_SECRET="minimum-32-character-secret-key-here"
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."   # Get from Stripe CLI
STRIPE_SUCCESS_URL="http://localhost:3000/store?success=true"
STRIPE_CANCEL_URL="http://localhost:3000/store?cancelled=true"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret"
R2_BUCKET_NAME="dojang-dynamics"
R2_PUBLIC_URL="https://pub-xxx.r2.dev"
CORS_ORIGIN="http://localhost:3000"
ADMIN_EMAIL="admin@dojangdynamics.com"
ADMIN_PASSWORD="Admin@123!"
```

### 1.3 Database setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed admin user + sample products
npm run db:seed
```

### 1.4 Start development server

```bash
npm run dev
# API running at http://localhost:3001
```

### 1.5 Test the API

```bash
# Health check
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@dojangdynamics.com","password":"Admin@123!"}'

# Get products
curl http://localhost:3001/products
```

---

## 2. Backend — Railway Deployment

### 2.1 Install Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### 2.2 Create Railway project

1. Go to https://railway.app
2. New Project → Deploy from GitHub repo (or empty project)
3. Add a PostgreSQL plugin to your project

### 2.3 Set environment variables in Railway

In your Railway service settings, add all variables from `.env.example`:
- `DATABASE_URL` — Railway will auto-set this when you add PostgreSQL plugin
- `JWT_SECRET` — generate with: `openssl rand -base64 32`
- `STRIPE_SECRET_KEY` — from Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` — see Step 4 below
- `STRIPE_SUCCESS_URL` — `https://yourusername.github.io/dojang-dynamics/store?success=true`
- `STRIPE_CANCEL_URL` — `https://yourusername.github.io/dojang-dynamics/store?cancelled=true`
- `R2_*` — from Cloudflare R2 dashboard
- `CORS_ORIGIN` — `https://yourusername.github.io`
- `NODE_ENV` — `production`

### 2.4 Deploy

```bash
# Link to your Railway project
railway link

# Deploy
railway up
```

The `railway.toml` automatically runs:
1. `npm run build` — TypeScript compilation
2. `npm run db:generate` — Prisma client generation
3. `npm run db:migrate` — Apply migrations
4. `npm start` — Start server

### 2.5 Seed production database

```bash
# Connect to your Railway environment
railway run npm run db:seed
```

Your API will be live at: `https://your-app.railway.app`

---

## 3. Frontend — Local Development

### 3.1 Install dependencies

```bash
cd dojang-dynamics-frontend
npm install
```

### 3.2 Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3.3 Run development server

```bash
npm run dev
# Site at http://localhost:3000
```

---

## 4. Stripe Webhook Setup

### 4.1 Local development (using Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# or download from https://github.com/stripe/stripe-cli

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3001/webhook

# This outputs your webhook secret — copy it to .env as STRIPE_WEBHOOK_SECRET
```

### 4.2 Production webhook

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. URL: `https://your-app.railway.app/webhook`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
5. Copy "Signing secret" → set as `STRIPE_WEBHOOK_SECRET` in Railway

### 4.3 Test webhook

```bash
stripe trigger checkout.session.completed
```

---

## 5. Cloudflare R2 Setup

1. Go to Cloudflare dashboard → R2
2. Create bucket named `dojang-dynamics`
3. Settings → Public access → Enable
4. Create API token with `Object Read & Write` permissions
5. Copy Account ID, Access Key ID, Secret Access Key
6. Public URL format: `https://pub-<hash>.r2.dev`

---

## 6. GitHub Pages Deployment

### 6.1 Create GitHub repository

```bash
cd dojang-dynamics-frontend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/dojang-dynamics.git
git push -u origin main
```

### 6.2 Enable GitHub Pages

1. Repo Settings → Pages
2. Source: GitHub Actions

### 6.3 Add repository secrets

Settings → Secrets and variables → Actions → New repository secret:
- `NEXT_PUBLIC_API_URL` = `https://your-app.railway.app`
- `NEXT_PUBLIC_SITE_URL` = `https://yourusername.github.io/dojang-dynamics`

### 6.4 If deploying to a subdirectory (e.g., `/dojang-dynamics`)

Uncomment these lines in `next.config.js`:
```js
basePath: '/dojang-dynamics',
assetPrefix: '/dojang-dynamics/',
```

### 6.5 Deploy

```bash
git push origin main
# GitHub Actions will build and deploy automatically
# Check Actions tab for status
```

Site will be at: `https://yourusername.github.io/dojang-dynamics`

---

## 7. API Reference

### Authentication

```
POST /auth/login
Body: { email, password }
Response: { token, user: { id, email, role } }

GET /auth/me
Headers: Authorization: Bearer <token>
Response: { id, email, role }
```

### Products (Public)

```
GET /products
Query: category, featured, search, sort, order, limit, offset

GET /products/:slug
```

### Products (Admin — requires JWT)

```
POST /products
PUT /products/:id
DELETE /products/:id
GET /products/admin/all
```

### Orders

```
POST /orders/create-checkout-session
Body: { cart: [{ productId, quantity }], customerEmail? }
Response: { url, sessionId }
```

### Upload (Admin)

```
POST /upload
Content-Type: multipart/form-data
Field: images (multiple files)
Response: { urls: string[] }
```

### Webhook

```
POST /webhook
Stripe-Signature: <sig>
Body: raw Stripe event
```

---

## 8. Architecture Notes

### Static Export Strategy

The frontend is fully static. Dynamic data is fetched client-side from Railway API:
- Store page: fetches products on mount with filters
- Product page: fetches by slug on mount
- Admin: client-side JWT guard, all CRUD via API
- Cart: localStorage + React context (no server needed)

### Cart → Checkout Flow

1. User adds items → stored in React context + localStorage
2. User clicks Checkout → POST `/orders/create-checkout-session`
3. Backend fetches current prices from DB (not trusting frontend prices)
4. Stripe Checkout Session created → returns URL
5. User redirected to Stripe hosted checkout
6. On success → Stripe fires `checkout.session.completed` webhook
7. Backend creates Order + OrderItems records
8. User redirected to store with `?success=true`

### Security Model

- JWT expiry: 7 days (configurable)
- Passwords: bcrypt with 12 rounds
- Input validation: Zod on all endpoints
- CORS: restricted to GitHub Pages origin
- Admin routes: double-checked (JWT middleware + role check)
- Stripe: webhook signature verified on every request

---

## 9. Maintenance

### Add new admin user

```bash
# Via database
railway run npx prisma studio
# Or via Prisma directly:
railway run tsx -e "
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const p = new PrismaClient();
p.user.create({ data: { email: 'new@admin.com', passwordHash: await bcrypt.hash('password', 12), role: 'ADMIN' } }).then(console.log);
"
```

### View production database

```bash
railway run npx prisma studio
```

### View logs

```bash
railway logs
```
