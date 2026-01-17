# AI Coding Instructions for Recipe App

## Architecture Overview
This is a React + TypeScript recipe management app using Convex as the backend-as-a-service. The frontend uses Convex React hooks for data fetching and mutations. Key components include recipe CRUD, meal planning, cooking history, and AI-powered image generation.

## Key Technologies & Patterns
- **Backend**: Convex for database (schema in `convex/schema.ts`), auth, storage, and serverless functions
- **Frontend**: React 19 with TypeScript, Tailwind CSS 4, React Router, Lucide icons
- **Data Flow**: Use `useQuery` for reads, `useMutation` for writes, `useAction` for async operations
- **Auth**: All mutations require `getAuthUserId(ctx)` check
- **File Uploads**: Generate upload URLs via `generateUploadUrl()`, then POST to the URL
- **Image Generation**: Uses Fal AI API with daily limits (10/day), status tracking in recipe records
- **Date Handling**: Use `date-fns` for formatting (e.g., `format(date, "MMM d")`)

## Development Workflow
- **Local Dev**: Run `bun run dev:all` to start both frontend (Vite) and backend (Convex dev)
- **Build**: `bun run build` compiles TypeScript and builds with Vite
- **Lint**: `bun run lint` uses ESLint with TypeScript and React rules
- **Deployment**: Docker container with nginx serving the built SPA

## Code Patterns
- **Queries**: Return enriched data with image URLs from storage (see `convex/recipes.ts`)
- **Mutations**: Include auth checks, handle optional fields with `Object.fromEntries` filtering
- **Components**: Use Tailwind classes, Lucide icons, responsive design (mobile-first)
- **Forms**: Handle file uploads with refs and preview states
- **Async Operations**: Track status in DB (e.g., `imageGenerationStatus: "generating"`)
- **Error Handling**: Wrap API calls in try/catch, update status on failure

## Examples
- **Creating a recipe**: `const recipeId = await createRecipe({ name, description, imageId })`
- **Fetching with images**: `imageUrl: recipe.imageId ? await ctx.storage.getUrl(recipe.imageId) : null`
- **Scheduling**: Link recipes to dates with completion tracking
- **AI Images**: Call `generateRecipeImage({ recipeId })` action, monitor status in UI

## File Structure
- `convex/`: Backend functions, schema, auth config
- `src/components/`: Reusable UI components (e.g., `RecipeCard`, `AddRecipeModal`)
- `src/pages/`: Route components with data fetching
- `src/context/`: Theme provider for dark/light mode
- `public/`: Static assets
- `Dockerfile`, `nginx.conf`: Production deployment

Focus on user-centric features: recipes, planning, history. Ensure all user-generated content is tied to authenticated users.


don't run bun server or convex dev they are running in the background at all times

never ever add eslint disable comments, always fix the underlying issue, i don't want to see any eslint disable comments in the code ever