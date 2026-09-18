# German Word Trainer

[![License: MIT](https://img.shields.io/badge/License-MIT-0f766e.svg)](LICENSE)
[![Catalog: CC BY-SA 4.0](https://img.shields.io/badge/Catalog-CC%20BY--SA%204.0-4338ca.svg)](data/ATTRIBUTION.md)
[![CI](https://github.com/nimausername/German-Word-Trainer/actions/workflows/ci.yml/badge.svg)](https://github.com/nimausername/German-Word-Trainer/actions/workflows/ci.yml)

Open-source spaced-repetition trainer for about **4000 high-frequency German words**. The app UI is English. Meanings, extra notes, and grammatical hints are **Persian (Farsi)**.

Sign-in and sign-up are custom pages. Auth is backed by your own Keycloak realm (password grant + Admin API). There is no redirect to Keycloak's hosted login.

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
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn (Base UI), ReUI |
| Auth | Auth.js credentials + Keycloak |
| Data | PostgreSQL + Drizzle ORM |
| Scheduling | SM-2 |
| Package manager | pnpm |

## Architecture

```text
Browser  →  Next.js pages / server actions
         →  /api/v1  (session cookie)
         →  study-service  →  PostgreSQL (words, user_cards, user_settings)
Auth     →  Auth.js  →  Keycloak password grant + Admin API
```

- `userId` is always the Keycloak subject (`sub`). Clients never choose it.
- Route handlers stay thin. Study rules live in `src/services/study-service.ts`.
- Environment is validated with Zod in `src/lib/env.ts`.

## Requirements

- Node.js 22+
- pnpm 10+ (`packageManager` in `package.json` is `pnpm@12.4.2`)
- PostgreSQL 16+ (Docker Compose is included)
- A Keycloak realm with a confidential client
- Python 3, only if you rebuild the word catalog

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

2. Fill Keycloak values in `.env` (see below). The example `DATABASE_URL` matches Compose.

3. Start Postgres, install, migrate, and seed:

```bash
docker compose up -d postgres
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
| `pnpm db:push` | Push Drizzle schema to Postgres |
| `pnpm db:migrate` | Run SQL migrations |
| `pnpm db:seed` | Seed ~20 sample DE→FA words |
| `pnpm db:build-words` | Rebuild `data/words-4000.json` |
| `pnpm db:seed:full` | Seed the 4000-word catalog |
| `pnpm verify:keycloak` | Check Keycloak service-account access |

`pnpm db:seed:full` replaces the `words` table. User cards cascade-delete with their words.

## Keycloak

Realm: `germanword`  
Client: `german-word-web` (confidential)

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
DATABASE_URL=postgresql://germanword:germanword@localhost:5432/germanword
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

Rebuild and reseed:

```bash
pnpm db:build-words
pnpm db:seed:full
```

Sources and licenses: [data/ATTRIBUTION.md](data/ATTRIBUTION.md). The compiled catalog is **CC BY-SA 4.0**.

## Deploy

The included [`Dockerfile`](Dockerfile) builds Next.js in standalone mode.

Typical Coolify (or any container) flow:

1. Create the app from this repo and set production env, including `AUTH_URL`.
2. Attach Postgres and set `DATABASE_URL`.
3. After the first deploy, run schema + seed once:

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
