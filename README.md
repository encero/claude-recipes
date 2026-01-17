# Family Recipes

A family meal planning and recipe management app built with React, TypeScript, Vite, and Convex.

## Features

- Recipe management with images
- Meal planning calendar
- Cooking history tracking
- PIN-based authentication (simplified for local network deployment)
- Theme customization

## Development

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js with npm)
- [Convex](https://convex.dev/) account

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   bun install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env.local
   ```
4. Start the Convex backend and get your deployment URL:
   ```bash
   bunx convex dev
   ```
5. Update `.env.local` with your Convex URL
6. Start the development server:
   ```bash
   bun run dev:all
   ```

## Docker Deployment

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_CONVEX_URL` | Your Convex deployment URL (e.g., `https://your-deployment.convex.cloud`) | Yes (runtime) |
| `GITHUB_REPOSITORY` | GitHub repository name for pulling images (e.g., `username/recipes`) | Yes (production) |
| `IMAGE_TAG` | Docker image tag to deploy (default: `latest`) | No |
| `PORT` | Host port to expose the app (default: `3000`) | No |

### Option 1: Build Locally

Build and run the Docker container locally:

```bash
# Copy and configure environment
cp .env.example .env
# Edit .env with your VITE_CONVEX_URL

# Build and start
docker compose up -d --build
```

The app will be available at `http://localhost:3000`

### Option 2: Pull from GitHub Container Registry

For production deployments, pull the pre-built image:

1. Create a `.env` file:
   ```bash
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   GITHUB_REPOSITORY=your-username/recipes
   IMAGE_TAG=latest
   PORT=3000
   ```

2. Deploy using the production compose file:
   ```bash
   docker compose -f docker-compose.prod.yml up -d
   ```

### GitHub Actions Setup

The repository includes a GitHub Actions workflow that automatically builds and pushes Docker images to GitHub Container Registry (ghcr.io).

No secrets are required - the `VITE_CONVEX_URL` is configured at runtime when starting the container.

The `GITHUB_TOKEN` is automatically provided by GitHub Actions for pushing to ghcr.io.

#### Workflow Triggers

- **Push to `main`**: Builds and pushes with `latest` and `main` tags
- **Tags (`v*`)**: Builds and pushes with version tags (e.g., `v1.0.0`, `1.0`, `1`)
- **Pull Requests**: Builds but does not push (for testing)
- **Manual**: Can be triggered manually via GitHub Actions UI

### Docker Compose Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Local development/building |
| `docker-compose.prod.yml` | Production deployment (pulls from registry) |

## First-Time Setup

When you first access the app, you'll be prompted to create a PIN. This PIN is used for authentication on your local network.

To change your PIN later, click the key icon in the app header.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Convex (serverless backend)
- **Authentication**: Convex Auth with Password provider
- **Deployment**: Docker, nginx
