#!/usr/bin/env bash
# Builds the learner web app and deploys it to Vercel production.
#
# Usage:
#   EXPO_PUBLIC_API_URL=https://vernora.onrender.com \
#     ./infrastructure/scripts/deploy-web.sh
#
# Uses Vercel's Build Output API (--prebuilt) instead of letting Vercel
# infer a build: the platform's framework detection cannot make sense of a
# prebuilt Expo export inside an npm-workspaces monorepo (it kept anchoring
# to apps/learner via the nearest package.json and deploying source instead
# of dist). Handing it a ready-made .vercel/output sidesteps all inference.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP_DIR="$REPO_ROOT/apps/learner"
DIST="$APP_DIR/dist"

# Vercel project identity; with these set the CLI needs no .vercel link.
export VERCEL_ORG_ID="team_hd3cUqhH95hh95ipF9IsPoFH"
export VERCEL_PROJECT_ID="prj_BiXYbz7chMQ0NOEF20k4keTFvWzb"

: "${EXPO_PUBLIC_API_URL:?Set EXPO_PUBLIC_API_URL to the deployed API origin}"

echo "==> Exporting web bundle (API: $EXPO_PUBLIC_API_URL)"
cd "$APP_DIR"
# --clear is load-bearing: Metro's transform cache does NOT invalidate when
# EXPO_PUBLIC_* env vars change, so without it a rebuild can silently ship
# a bundle with the previous build's URLs baked in.
npx expo export --platform web --clear

echo "==> Assembling Vercel Build Output API structure"
cd "$DIST"
# Stub package.json anchors the Vercel CLI here (it walks up to the nearest
# package.json to decide the project root — without this it grabs apps/learner).
echo '{ "name": "vernora-web", "private": true }' > package.json
rm -rf .vercel
mkdir -p .vercel/output/static
rsync -a --exclude '.vercel' --exclude 'vercel.json' --exclude 'package.json' ./ .vercel/output/static/
cat > .vercel/output/config.json << 'EOF'
{
  "version": 3,
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
EOF

echo "==> Deploying to Vercel production"
npx vercel deploy --prebuilt --prod --yes

echo "==> Done. Verify: curl -s -o /dev/null -w '%{http_code}\n' https://vernora.vercel.app"
