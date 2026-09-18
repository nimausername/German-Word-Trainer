# Contributing to German Word Trainer

Thanks for helping. This document explains how to set up a development environment, the project layout, and what we look for in a pull request.

Please read the [Code of Conduct](CODE_OF_CONDUCT.md) first.

This repository is **the Next.js application only**. Keycloak and PostgreSQL are not part of the project. Use servers you already run, and point the app at them with `.env`.

## What you need

- Node.js 22 or newer
- [pnpm](https://pnpm.io/) 10 or newer (this repo pins `packageManager`)
- Python 3 (only if you rebuild `data/words-4000.json`)
- Credentials and network access to **your** PostgreSQL
- Credentials and network access to **your** Keycloak realm (see the README checklist)

Lint, typecheck, and unit tests do **not** need Keycloak or Postgres.

## First-time setup

```bash
git clone git@github.com:nimausername/German-Word-Trainer.git
cd German-Word-Trainer
cp .env.example .env
```

Fill `.env` with `AUTH_SECRET`, your Keycloak issuer/client secret, and your `DATABASE_URL`. Then:

```bash
pnpm install
pnpm db:push
pnpm db:seed:full
pnpm dev
```

The app listens on [http://localhost:3000](http://localhost:3000) and talks to the external services you configured.

Use `pnpm db:seed` instead of `pnpm db:seed:full` if you only want the small sample catalog.

The [`Dockerfile`](Dockerfile) is optional: it packages **this app** for deployment. It does not start Keycloak or a database.

## Checks to run locally

Run these before you open a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

`pnpm test` covers SM-2 scheduling, study-card presentation, and catalog integrity.

## Project layout

| Path | Role |
| --- | --- |
| `src/app/` | Next.js App Router pages and route handlers |
| `src/app/api/v1/` | Resource-oriented JSON API |
| `src/components/` | UI (study cards, chrome, shadcn / ReUI) |
| `src/services/` | Study domain logic (queue, reviews, progress) |
| `src/lib/` | Env, SM-2, Keycloak client, session, API helpers |
| `src/db/` | Drizzle schema and client (connects to your Postgres) |
| `data/` | Word catalog and attribution |
| `scripts/` | Seed, catalog rebuild, and Keycloak operator tools |
| `drizzle/` | SQL migrations to apply on your database |
| `Dockerfile` | Container image for this app only |

Keep route files thin. Put reusable rules in `src/services` or `src/lib`, not in `src/app/api`.

## Word catalog

`data/words-4000.json` is compiled from CC BY-SA sources. If you change the builder:

1. Update `scripts/build-words-4000.py`.
2. Rebuild with `pnpm db:build-words`.
3. Keep [data/ATTRIBUTION.md](data/ATTRIBUTION.md) accurate.
4. Remember that `pnpm db:seed:full` replaces the `words` table and cascade-deletes user cards.

Do not add copyrighted dictionary text that is not compatible with CC BY-SA 4.0.

## Pull requests

1. Open an issue first for larger changes, so we can agree on the approach.
2. Create a branch from `main` (`feat/...`, `fix/...`, `docs/...`).
3. Keep the diff focused. Do not mix formatting-only edits with behavior changes.
4. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, for example `feat: add streak counter` or `fix: keep due reviews ahead of new words`.
5. Add or update tests when you change scheduling, catalog validation, or API contracts.
6. Fill in the pull request template.

### Review checklist

- TypeScript stays strict; avoid `any`.
- API request and response fields stay camelCase.
- Errors keep the `{ error: { code, message, details }, meta }` shape.
- Do not trust client-supplied user IDs. Study routes must use the session `sub`.
- Do not commit `.env`, secrets, or `data/.cache/`.
- Do not add Keycloak or Postgres servers to this repo. This project is the app.

## Security issues

Report vulnerabilities privately. See [SECURITY.md](SECURITY.md).
