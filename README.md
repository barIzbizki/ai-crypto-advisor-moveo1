# moveo1

A crypto dashboard app: users sign up, pick an investor profile during onboarding, and land on a dashboard with live coin prices, market news, an AI-generated insight, a crypto meme, and section voting.

Monorepo with two apps:

- **[backend/](backend/)** — Node.js/Express REST API (PostgreSQL)
- **[frontend/](frontend/)** — React (Vite) single-page app

## Architecture overview

```
frontend (React + Vite, :5173)
   │  fetch, JWT in Authorization header
   ▼
backend (Express, :3000)
   │
   ├─ PostgreSQL (users, preferences, votes)
   ├─ CoinGecko API      → coin prices
   ├─ CryptoPanic API    → market news (falls back to static list if unset)
   └─ Hugging Face router → AI insight  (falls back to static list if unset)
```

**Backend** ([backend/src](backend/src/)):
- `app.js` / `server.js` — Express app wiring and boot (loads config, verifies DB connection, starts listening)
- `routes/` — one router per resource: `auth`, `preferences`, `news`, `prices`, `insight`, `meme`, `votes`, plus `GET /health`
- `services/` — external API clients (`coingecko.js`, `cryptopanic.js`, `llmInsight.js`), the meme picker, and static JSON fallbacks used when an external API isn't configured or fails
- `middleware/` — JWT auth guard (`auth.js`), 404 handler, centralized error handler
- `db/pool.js` — PostgreSQL connection pool
- `migrations/` — `node-pg-migrate` migrations (users, preferences, votes tables)

Auth is JWT-based: `POST /auth/signup` and `POST /auth/login` return a token, which the frontend attaches to subsequent requests; `requireAuth` middleware protects the dashboard/preferences/votes routes.

**Frontend** ([frontend/src](frontend/src/)):
- `pages/` — `LoginPage`, `SignupPage`, `OnboardingPage`, `DashboardPage`, `NotFoundPage`
- `components/dashboard/` — dashboard widgets: `CoinPricesSection`, `MarketNewsSection`, `AiInsightSection`, `CryptoMemeSection`, `VoteControl`
- `components/RequireAuth.jsx` — route guard that redirects unauthenticated users to `/login`
- `api/client.js` — fetch wrapper for calling the backend

### API endpoints

| Method | Path                 | Auth | Purpose                        |
|--------|----------------------|------|---------------------------------|
| POST   | `/auth/signup`       | –    | Create an account               |
| POST   | `/auth/login`        | –    | Log in, returns JWT             |
| GET    | `/auth/me`           | ✓    | Current user                    |
| POST   | `/preferences`       | ✓    | Save onboarding preferences     |
| GET    | `/preferences`       | ✓    | Get onboarding preferences      |
| GET    | `/dashboard/prices`  | ✓    | Coin prices (CoinGecko)         |
| GET    | `/dashboard/news`    | ✓    | Market news (CryptoPanic)       |
| GET    | `/dashboard/insight` | ✓    | AI-generated insight            |
| GET    | `/dashboard/meme`    | ✓    | Crypto meme                     |
| POST   | `/votes`             | ✓    | Vote on a dashboard section     |
| GET    | `/votes`             | ✓    | Get vote tallies                |
| GET    | `/health`            | –    | Health check                    |

## Setup instructions

### Prerequisites

- Node.js ≥ 18 (backend pins Node 22 via `.node-version`)
- Docker (for local PostgreSQL, via `docker-compose.yml`) — or a PostgreSQL instance of your own

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # defaults work out of the box for local dev
docker compose up -d      # starts Postgres on localhost:5434 + Adminer on :8081
npm run migrate:up
npm run dev                # starts on http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env      # defaults point at the local backend
npm run dev                # starts on http://localhost:5173
```

Open http://localhost:5173, sign up, and go through onboarding to reach the dashboard.

### Tests

```bash
cd backend
npm test
```

## Environment variables / API keys

### backend/.env

| Variable                     | Required          | Default (local dev)                                          | Notes |
|-------------------------------|--------------------|----------------------------------------------------------------|-------|
| `NODE_ENV`                    | no                 | `development`                                                   | `development` \| `test` \| `production` |
| `PORT`                        | no                 | `3000`                                                          | HTTP port |
| `DATABASE_URL`                | **yes in production** | local docker-compose Postgres (`localhost:5434/moveo1`)     | PostgreSQL connection string |
| `CORS_ORIGIN`                 | no                 | `http://localhost:5173`                                        | Allowed origin for the frontend |
| `JWT_SECRET`                  | **yes in production** | insecure local default                                       | Signs auth JWTs |
| `CRYPTOPANIC_API_KEY`         | no                 | — (unset → static news fallback)                                | [CryptoPanic](https://cryptopanic.com/developers/api/) API key for Market News |
| `CRYPTOPANIC_API_BASE_URL`    | no                 | `https://cryptopanic.com/api/v1`                                | |
| `COINGECKO_API_KEY`           | no                 | — (unset → shared anonymous rate limit)                         | [CoinGecko](https://www.coingecko.com/en/api) Demo API key, raises rate limit for Coin Prices |
| `COINGECKO_API_BASE_URL`      | no                 | `https://api.coingecko.com/api/v3`                              | |
| `LLM_API_KEY`                 | no                 | — (unset → static insight fallback)                             | [Hugging Face](https://huggingface.co/settings/tokens) token for the AI Insight section |
| `LLM_API_BASE_URL`            | no                 | `https://router.huggingface.co/v1/chat/completions`              | HF router (OpenAI-compatible chat completions) |
| `LLM_MODEL`                   | no                 | `Qwen/Qwen3.8-27B:ovhcloud`                                     | Model + serving provider, HF router format |

### frontend/.env

| Variable              | Required | Default                     | Notes |
|------------------------|----------|------------------------------|-------|
| `VITE_API_BASE_URL`    | no       | `http://localhost:3000`      | Backend base URL |
| `COINGECKO_API_KEY`    | no       | —                             | Present in `.env.example` but currently unused by frontend source — coin prices are fetched via the backend, which holds its own `COINGECKO_API_KEY` |

Everything besides `DATABASE_URL` and `JWT_SECRET` in production is optional — the app degrades gracefully to static fallback content (news, AI insight) when the corresponding key is unset.
