# Security policy

## Supported versions

This project is in early development. Security fixes land on `main` only.

| Version | Supported |
| --- | --- |
| `main` | Yes |

## Reporting a vulnerability

Do **not** open a public GitHub issue for security problems.

Email **nimakhabbazi@yandex.com** with:

- A description of the issue
- Steps to reproduce, or a proof of concept
- Affected version / commit if you know it
- The impact you expect

Please give us a reasonable window to investigate and ship a fix before any
public disclosure.

You should receive an acknowledgement within 7 days. After that we will keep
you updated on triage and any fix or advisory.

## Operational notes

- This repo is the application only. Keycloak and PostgreSQL stay on your
  servers. Never commit `.env`, Keycloak secrets, database URLs with
  passwords, or Auth.js secrets.
- `AUTH_SECRET` must be a long random value (`openssl rand -base64 32`).
- Keycloak clients used by this app are confidential and use direct access
  grants plus a service account. Treat `KEYCLOAK_CLIENT_SECRET` as production
  credentials.
- Study APIs require an Auth.js session. Authorization is based on the
  Keycloak `sub`, not client-supplied user IDs.
