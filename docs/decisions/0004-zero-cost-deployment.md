# 4. Zero-cost deployment topology

Date: 2026-07-24

## Status

Accepted

## Context

The project constraint is zero infrastructure cost until the product proves
itself (only LLM API keys are budgeted). We need public hosting for three
pieces: PostgreSQL, the Spring Boot API, and the Expo web app. The learner
app is a browser SPA talking to the API over HTTPS with Supabase-issued JWTs.

## Decision

- **PostgreSQL on Supabase** — the project already exists for auth, and its
  free tier includes a full Postgres database. One provider, one dashboard,
  zero new accounts. Connections go through the session pooler (transaction
  pooling breaks Flyway and JPA prepared statements).
- **API as a Docker container on Render's free tier** — a multi-stage
  Dockerfile (JDK builds, JRE ships) keeps the image lean; Render injects
  PORT and holds all secrets as dashboard environment variables. The
  container sleeps when idle and cold-starts in about a minute, which is
  acceptable for an MVP demo.
- **Web app as a static SPA on Vercel** — `expo export` with
  `web.output: "single"` emits plain files; a `vercel.json` rewrite routes
  deep links to the SPA shell. `EXPO_PUBLIC_API_URL` is baked in at build
  time, so the bundle is built locally and shipped with the Vercel CLI
  rather than built from the repo by Vercel. (Netlify would work equally
  well; Vercel chosen for familiarity.)

## Consequences

- Total cost: $0. All configuration flows through environment variables that
  have existed since the modules were written; nothing in the codebase knows
  or cares where it runs.
- Cold starts and the Supabase 7-day pause are accepted MVP tradeoffs,
  documented in docs/deployment.md.
- Deploys are manual (dashboard-driven) for now; CI/CD is future work.
- When the mobile apps arrive, the same API and database serve them; only
  the client hosting story changes.
