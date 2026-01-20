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

# Install nginx and setup directories (rarely changes - good for caching)
RUN apk add --no-cache nginx && \
    mkdir -p /var/cache/nginx /var/log/nginx /run/nginx /app

# Install convex CLI globally (pin version for reproducible builds)
ARG CONVEX_VERSION=1.31.5
RUN npm install -g convex@${CONVEX_VERSION} && \
    npm cache clean --force

# Copy package.json for production dependency installation
COPY --from=builder /app/package.json /app/package.json

# Install production dependencies only (needed for convex deploy to resolve imports)
# This excludes devDependencies like eslint, typescript, vite, etc.
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy nginx config (changes occasionally)
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy entrypoint script (changes occasionally)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built frontend files (changes with each build)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Convex functions for deployment (changes with each build)
COPY --from=builder /app/convex /app/convex

# Set permissions in a single layer
RUN chown -R node:node /usr/share/nginx/html /var/cache/nginx /var/log/nginx /run/nginx /app

WORKDIR /app

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
