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

1. Build the static bundle with the production API URL baked in
   (`EXPO_PUBLIC_*` variables are inlined at build time, not read at runtime):

   ```bash
   cd apps/learner
   EXPO_PUBLIC_API_URL=https://<service>.onrender.com npx expo export --platform web
   ```

   The export includes `vercel.json` (copied from `public/`), which rewrites
   every path to the SPA shell so deep links like
   `/course/korean-core/lesson/...` survive a hard refresh.

2. Deploy the prebuilt output directly with the Vercel CLI — we build
   locally (the env var above must be baked in), so Vercel only hosts files:

   ```bash
   cd dist
   npx vercel --prod
   ```

   Follow the prompts (log in, create a new project). Subsequent deploys
   are the same two commands: export, then `npx vercel --prod`.
3. Take the resulting `https://<project>.vercel.app` URL and set it as
   `CORS_ALLOWED_ORIGINS` on the Render service (then redeploy the API).
4. Supabase dashboard → Authentication → URL Configuration: add the Vercel
   URL to the allowed redirect URLs so auth emails link back correctly.

Note: don't link Vercel to the git repo for this app. Vercel's repo builds
would need monorepo build settings and wouldn't know `EXPO_PUBLIC_API_URL`;
building locally and shipping `dist` keeps one source of truth for the
production bundle.

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
