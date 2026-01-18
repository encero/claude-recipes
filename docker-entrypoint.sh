#!/bin/sh
set -e

# Sync Convex cloud with the deployed version (runs once on container start)
if [ -n "$CONVEX_DEPLOY_KEY" ]; then
  echo "Syncing Convex functions to cloud..."
  npx convex deploy --yes 2>&1 || {
    echo "WARNING: Convex deploy failed. Container will continue starting."
    echo "Check your CONVEX_DEPLOY_KEY and network connectivity."
  }
  echo "Convex sync complete."
else
  echo "CONVEX_DEPLOY_KEY not set - skipping Convex cloud sync."
  echo "Set CONVEX_DEPLOY_KEY to enable automatic function deployment."
fi

# Replace placeholder with actual Convex URL at runtime
if [ -n "$VITE_CONVEX_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|__CONVEX_URL_PLACEHOLDER__|$VITE_CONVEX_URL|g" {} \;
  echo "Configured Convex URL: $VITE_CONVEX_URL"
else
  echo "WARNING: VITE_CONVEX_URL environment variable is not set!"
fi

exec "$@"
