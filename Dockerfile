# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app (no env vars needed - placeholder will be replaced at runtime)
RUN bun run build

# Production stage - Node.js Alpine with nginx for Convex deploy support
FROM node:22-alpine AS production

# Install nginx
RUN apk add --no-cache nginx

# Copy custom nginx config
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy built frontend files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Convex functions and config for deployment
COPY --from=builder /app/convex /app/convex
COPY --from=builder /app/package.json /app/package.json
COPY --from=builder /app/node_modules /app/node_modules

# Copy entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create nginx directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /run/nginx && \
    chown -R node:node /usr/share/nginx/html && \
    chown -R node:node /var/cache/nginx && \
    chown -R node:node /var/log/nginx && \
    chown -R node:node /run/nginx && \
    chown -R node:node /app

WORKDIR /app

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Use entrypoint to sync Convex and inject env vars at runtime
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
