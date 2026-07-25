# Deploying Vernora for free

Zero-cost topology. Each piece has a free tier that fits an MVP; the
tradeoffs are noted honestly.

| Piece | Where | Free-tier tradeoff |
|---|---|---|
| PostgreSQL | Supabase (same project as auth) | 500MB storage, pauses after 7 days of inactivity |
| Spring API | Render free web service (Docker) | Sleeps after 15 min idle; ~1 min JVM cold start |
| Learner web app | Vercel (static SPA, Hobby tier) | non-commercial use, 100GB bandwidth/month |
| Auth + JWKS | Supabase | already in use |

The API reads all deploy-specific values from environment variables — no
code changes between laptop and cloud:

| Variable | Meaning | Example (production) |
|---|---|---|
| `PORT` | injected by Render automatically | `10000` |
| `DB_URL` | JDBC URL of Postgres | `jdbc:postgresql://aws-0-us-west-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `DB_USER` | database user | `postgres.<project-ref>` |
| `DB_PASSWORD` | database password | (from Supabase) |
| `SUPABASE_JWKS_URI` | JWT signing keys | `https://<project-ref>.supabase.co/auth/v1/.well-known/jwks.json` |
| `CORS_ALLOWED_ORIGINS` | comma-separated browser origins | `https://<your-project>.vercel.app` |

## 1. Database: Supabase Postgres

The Supabase project used for auth includes a full Postgres database.

1. Supabase dashboard → your project → **Connect** (top bar).
2. Copy the **Session pooler** connection string (IPv4-friendly, and it
   behaves like a direct connection, which Flyway needs; avoid the
   *Transaction pooler* — it breaks prepared statements and migrations).
   It looks like:
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
3. Seed the sample course into it from your laptop:

   ```bash
   DB_HOST=aws-0-<region>.pooler.supabase.com \
   DB_PORT=5432 \
   DB_NAME=postgres \
   DB_USER=postgres.<ref> \
   DB_PASSWORD=<password> \
   DB_SSL=require \
   npm run seed
   ```

   Note: the `courses` tables must exist first — Flyway creates them the
   first time the API boots against this database (step 2 below), so seed
   *after* the first successful deploy. Order: deploy API → seed → browse.

## 2. API: Render

1. Push the repo to GitHub if not already pushed.
2. [render.com](https://render.com) → New → **Web Service** → connect the
   GitHub repo.
3. Settings:
   - **Root Directory**: `services/api`
   - **Runtime**: Docker (it finds `services/api/Dockerfile`)
   - **Instance type**: Free
   - **Health check path**: `/actuator/health`
4. Environment variables: `DB_URL`, `DB_USER`, `DB_PASSWORD`,
   `SUPABASE_JWKS_URI`, `CORS_ALLOWED_ORIGINS` (see table above).
   `DB_URL` must be the JDBC form:
   `jdbc:postgresql://aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=require`
5. Deploy. First boot runs both Flyway migrations against Supabase —
   check the logs for `Successfully applied 2 migrations`.
6. Verify: `curl https://<service>.onrender.com/actuator/health` → `{"status":"UP"}`.

## 3. Web app: Vercel

One script does everything (export with the API URL baked in, assemble the
Vercel Build Output API structure, deploy):

```bash
EXPO_PUBLIC_API_URL=https://vernora.onrender.com \
  ./infrastructure/scripts/deploy-web.sh
```

First run requires `npx vercel login`. Then:

1. Take the resulting `https://<project>.vercel.app` URL and set it as
   `CORS_ALLOWED_ORIGINS` on the Render service (Render restarts the API
   automatically when the variable is saved).
2. Supabase dashboard → Authentication → URL Configuration: add the Vercel
   URL to the allowed redirect URLs so auth emails link back correctly.

Why the script instead of plain `vercel --prod` (hard-won lessons):

- The Vercel CLI decides the "project root" by walking up from the current
  directory to the nearest `package.json`. From `dist` (which has none) it
  silently anchored to `apps/learner` and deployed the *source* — whose only
  servable content was `public/`, yielding a one-file website. The script
  writes a stub `package.json` into `dist` to pin the root.
- Vercel's remote build inference produced empty output for a prebuilt Expo
  export ("no files were prepared"). Using the Build Output API
  (`.vercel/output` + `--prebuilt`) skips inference entirely: Vercel hosts
  exactly the files we hand it, with an SPA rewrite in `config.json`.
- Don't link Vercel to the git repo for this app: repo builds would need
  monorepo settings and wouldn't know `EXPO_PUBLIC_API_URL`. Building
  locally keeps one source of truth for the production bundle.

## Known free-tier behavior

- **Cold starts**: after 15 idle minutes Render stops the container; the
  next request waits ~60s while the JVM boots. Fine for a demo; the fix
  later is a paid tier or a keep-alive ping.
- **Supabase pause**: the free database pauses after a week without
  traffic and must be resumed from the dashboard.
- **Vercel Hobby tier** is for non-commercial projects; revisit before any
  monetization.
- **Secrets live in dashboards**, never in git. `.env` files stay local
  and are gitignored; production values are entered in Render's UI.
