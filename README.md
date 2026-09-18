# German Word Trainer

[![License: MIT](https://img.shields.io/badge/License-MIT-0f766e.svg)](LICENSE)
[![Catalog: CC BY-SA 4.0](https://img.shields.io/badge/Catalog-CC%20BY--SA%204.0-4338ca.svg)](data/ATTRIBUTION.md)
[![CI](https://github.com/nimausername/German-Word-Trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/nimausername/German-Word-Trainer/actions/workflows/ci.yml)

This repository is **the web application only**. It does not include Keycloak, PostgreSQL, or any other infrastructure. You run those on your own servers and point the app at them with environment variables.

Open-source spaced-repetition trainer for about **4000 high-frequency German words**. The app UI is English. Meanings, extra notes, and grammatical hints are **Persian (Farsi)**.

Sign-in and sign-up are custom pages in this app. They talk to **your** Keycloak realm (password grant + Admin API). There is no redirect to Keycloak's hosted login.

## What is in this repo

| Included | Not included |
| --- | --- |
| Next.js app (UI, API, SM-2 study loop) | Keycloak / identity server |
| Word catalog JSON and seed scripts | PostgreSQL server |
| Drizzle schema and migrations (applied **to** your database) | Any hosted database |
| `Dockerfile` for this app container | Compose stacks for Keycloak or Postgres |

Bring your own:

- **PostgreSQL** — study data (`words`, `user_cards`, `user_settings`)
- **Keycloak** — accounts and tokens

The [`Dockerfile`](Dockerfile) builds **only this Next.js app**. It does not start Keycloak or a database. At runtime the container reads `DATABASE_URL` and `KEYCLOAK_*` from the environment and connects to the servers you already operate.

## Features

- Flip-card study sessions: German lemma first, Persian gloss on the back
- SM-2 scheduling with **Again / Hard / Good / Easy**
- Reviews are always served before new words
- Daily cap for new words (default 20, configurable per user)
- Progress: due today, remaining new words, learned count
- Light and dark theme
- REST JSON API under `/api/v1`

## Stack

| Layer | Choice |
| --- | --- |
| App (this repo) | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn (Base UI), ReUI |
| Auth (external) | Your Keycloak realm, via Auth.js credentials |
| Data (external) | Your PostgreSQL, via Drizzle ORM |
| Scheduling | SM-2 |
| Package manager | pnpm |

## Architecture

```text
Browser  →  this Next.js app (pages, server actions, /api/v1)
         →  study-service
         →  YOUR PostgreSQL  (words, user_cards, user_settings)

Auth     →  Auth.js in this app
         →  YOUR Keycloak     (password grant + Admin API)
```

- `userId` is always the Keycloak subject (`sub`). Clients never choose it.
- Route handlers stay thin. Study rules live in `src/services/study-service.ts`.
- Environment is validated with Zod in `src/lib/env.ts`.

## Requirements

To run the app you need:

- Node.js 22+
- pnpm 10+ (`packageManager` in `package.json` is `pnpm@12.4.2`)
- Network access to **your** PostgreSQL
- Network access to **your** Keycloak realm (confidential client)
- Python 3, only if you rebuild the word catalog

This repo does not install or start those servers.

## Quick start

```bash
git clone git@github.com:nimausername/German-Word-Trainer.git
cd German-Word-Trainer
cp .env.example .env
```

1. Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

2. Point `.env` at **your** Keycloak and **your** Postgres (see [`.env.example`](.env.example)). Do not commit `.env`.

3. Install, apply the schema to your database, seed, and run the app:

```bash
pnpm install
pnpm db:push
pnpm db:seed:full
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`pnpm db:seed` loads a small sample set instead of the full 4000 words.

### Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Next.js dev server |
| `pnpm build` / `pnpm start` | Production build and start |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `pnpm test` | Vitest (SM-2, cards, catalog) |
| `pnpm db:push` | Push Drizzle schema to **your** Postgres |
| `pnpm db:migrate` | Run SQL migrations on **your** Postgres |
| `pnpm db:seed` | Seed ~20 sample DE→FA words |
| `pnpm db:build-words` | Rebuild `data/words-4000.json` |
| `pnpm db:seed:full` | Seed the 4000-word catalog |
| `pnpm verify:keycloak` | Check Keycloak service-account access |

`pnpm db:seed:full` replaces the `words` table. User cards cascade-delete with their words.

## Connecting to your Keycloak

The app expects a realm and confidential client you create on **your** Keycloak server. Suggested names:

- Realm: `germanword`
- Client: `german-word-web` (confidential)

Enable:

- Client authentication
- Direct access grants
- Service accounts roles

Standard flow can stay off. Add these service-account roles from `realm-management`:

- `manage-users`
- `view-users`

Required env (see [`.env.example`](.env.example)):

```env
KEYCLOAK_ISSUER=https://auth.example.com/realms/germanword
KEYCLOAK_CLIENT_ID=german-word-web
KEYCLOAK_CLIENT_SECRET=
DATABASE_URL=postgresql://user:password@db.example.com:5432/germanword
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
AUTH_SECRET=
NEW_WORDS_PER_DAY_DEFAULT=20
```

## API

All JSON responses use camelCase. Success and error envelopes:

```json
{ "data": {}, "meta": { "requestId": "…" } }
```

```json
{
  "error": {
    "code": "STABLE_CODE",
    "message": "Human readable message",
    "details": [{ "field": "name", "reason": "INVALID" }]
  },
  "meta": { "requestId": "…" }
}
```

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/v1/auth/sign-up` | No | Create a Keycloak user (`201`) |
| `GET` | `/api/v1/session/next` | Session | Next due review, or a new word |
| `POST` | `/api/v1/reviews` | Session | Submit `again` / `hard` / `good` / `easy` |
| `GET` | `/api/v1/progress` | Session | Due, remaining new, learned counts |
| `GET` | `/api/v1/settings` | Session | Daily new-word cap |
| `PATCH` | `/api/v1/settings` | Session | Update `newWordsPerDay` (1–100) |
| `GET` | `/api/health` | No | Process health (`{ "data": { "ok": true } }`) |

Auth.js also exposes `GET`/`POST` `/api/auth/*` for the session cookie.

Review payload:

```json
{ "wordId": 1, "rating": "good" }
```

## Word catalog

`data/words-4000.json` is 4000 German lemmas ranked from subtitle/corpus frequency, with Persian glosses, POS, and noun gender/plural when available.

Rebuild and reseed **your** database:

```bash
pnpm db:build-words
pnpm db:seed:full
```

Sources and licenses: [data/ATTRIBUTION.md](data/ATTRIBUTION.md). The compiled catalog is **CC BY-SA 4.0**.

## Deploy the app

The [`Dockerfile`](Dockerfile) is an **app image only**: it compiles this Next.js project and runs `node server.js`. It does not bundle Keycloak or PostgreSQL.

Typical Coolify (or any container host) flow:

1. Build this repo's Dockerfile.
2. Set production env so the container can reach **your existing** Keycloak and Postgres (`AUTH_URL`, `DATABASE_URL`, `KEYCLOAK_*`, `AUTH_SECRET`).
3. After the first deploy, run schema + seed once against that database (one-off job or local machine with the same `DATABASE_URL`):

```bash
pnpm db:push
pnpm db:seed:full
```

4. Health check: `GET /api/health`

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).

Security reports: [SECURITY.md](SECURITY.md).

## License

- **Application code:** [MIT](LICENSE)
- **Word catalog** (`data/words-4000.json` and rebuilds): [CC BY-SA 4.0](data/ATTRIBUTION.md)

See [NOTICE](NOTICE) for how the two licenses apply together.
