#!/bin/sh
set -e

# Replace placeholder with actual Convex URL at runtime
if [ -n "$VITE_CONVEX_URL" ]; then
  find /usr/share/nginx/html/assets -name '*.js' -exec sed -i "s|__CONVEX_URL_PLACEHOLDER__|$VITE_CONVEX_URL|g" {} \;
  echo "Configured Convex URL: $VITE_CONVEX_URL"
else
  echo "WARNING: VITE_CONVEX_URL environment variable is not set!"
fi

exec "$@"
