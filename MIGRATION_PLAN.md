# Data Migration Plan: Dev → Production

## Overview

Migrate Convex data from development to production using the native Convex CLI export/import tools.

---

## Tables to Migrate

| Table | Priority | Notes |
|-------|----------|-------|
| `users` | High | User profiles |
| `recipes` | High | Core recipe data |
| `recipeImages` | High | Image generation history |
| `cookingHistory` | High | Cooking records |
| `scheduledMeals` | Medium | Planned meals |
| `openRouterModels` | Low | Can be re-synced via cron |
| `imageGenerationLimits` | Skip | Ephemeral rate-limit data |
| `authAccounts` | Included | Auth credentials (auto-included) |
| `authSessions` | Skip recommended | Active sessions |
| `authVerificationCodes` | Skip | Ephemeral |

---

## Migration Commands

### Step 1: Export from Dev

```bash
npx convex export --path ./convex-export.zip
```

With file storage (if using Convex storage):
```bash
npx convex export --path ./convex-export.zip --include-file-storage
```

**Note**: This project uses Cloudflare R2 for images (not Convex file storage), so `--include-file-storage` is not needed for recipe images.

### Step 2: Import to Production

```bash
npx convex import ./convex-export.zip --prod --replace-all -y
```

Options:
- `--prod` - Target production deployment
- `--replace-all` - Replace all existing data (clean slate)
- `--append` - Alternative: append to existing data
- `-y` - Skip confirmation prompt

---

## Handling R2 Images

Recipe images are stored in Cloudflare R2, referenced by `imageId` field in `recipes` and `recipeImages` tables.

### Option A: Shared R2 Bucket (Simplest)
If dev and prod use the same R2 bucket/credentials:
- No image migration needed
- Image references will work automatically

### Option B: Separate R2 Buckets
If prod has its own R2 bucket:
1. Copy objects from dev bucket to prod bucket (preserving keys)
2. Use `rclone` or R2 dashboard to sync buckets

```bash
# Using rclone (example)
rclone sync r2-dev:bucket-name r2-prod:bucket-name
```

---

## Environment Setup

### Dev Deployment (default)
The CLI uses `.env.local` with `CONVEX_DEPLOYMENT` for dev.

### Production Deployment
For `--prod` flag to work, you need:
- Logged in via `npx convex login`
- Project linked to your Convex account

Or use explicit deployment:
```bash
npx convex import ./convex-export.zip --deployment-name <prod-deployment-name> --replace-all -y
```

---

## Step-by-Step Migration

### Pre-Migration
- [ ] Ensure dev has latest data
- [ ] Verify R2 image access strategy (shared vs separate)
- [ ] Backup production (if has existing data)

### Execute Migration

```bash
# 1. Export from dev
npx convex export --path ./convex-export.zip

# 2. Verify export (optional - check contents)
unzip -l ./convex-export.zip

# 3. Import to production
npx convex import ./convex-export.zip --prod --replace-all -y
```

### Post-Migration
- [ ] Verify data in production dashboard
- [ ] Test authentication flow
- [ ] Test image loading
- [ ] Trigger model sync: `npx convex run modelsSync:fetchFreeModels --prod`

---

## Required Credentials

### Convex
- **Dev**: Current `.env.local` settings (already configured)
- **Prod**: Either:
  - Logged in account with `--prod` flag
  - Or explicit `--deployment-name` with deploy key

### Cloudflare R2 (if separate buckets)
```
R2_ACCESS_KEY_ID=<prod-access-key>
R2_SECRET_ACCESS_KEY=<prod-secret>
R2_BUCKET=<prod-bucket-name>
R2_ENDPOINT=<prod-endpoint>
```

---

## Important Notes

1. **ID Preservation**: Convex export/import preserves document IDs (`_id` fields)
2. **Relationships**: Foreign key references remain intact
3. **Auth Data**: `authAccounts` table is included in export (user credentials preserved)
4. **Sessions**: Consider using `--replace` per table instead of `--replace-all` to preserve active sessions in prod

---

## Alternative: Selective Table Import

If you want to import specific tables only:

```bash
# Extract the ZIP first
unzip ./convex-export.zip -d ./convex-dump

# Import individual tables
npx convex import --table users ./convex-dump/users/documents.jsonl --prod --replace
npx convex import --table recipes ./convex-dump/recipes/documents.jsonl --prod --replace
# ... etc
```

---

## Rollback Plan

If migration fails or needs reverting:
1. Export production before migration (backup)
2. Re-import the backup if needed

```bash
# Before migration - backup prod
npx convex export --path ./prod-backup.zip --prod

# If rollback needed
npx convex import ./prod-backup.zip --prod --replace-all -y
```

---

## Summary

| Step | Command |
|------|---------|
| Export dev | `npx convex export --path ./convex-export.zip` |
| Import prod | `npx convex import ./convex-export.zip --prod --replace-all -y` |

**Estimated time**: < 2 minutes for typical dataset
