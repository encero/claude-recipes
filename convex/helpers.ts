import { getAuthUserId } from "@convex-dev/auth/server";
import { getR2PublicUrl } from "./r2";
import type { Doc } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx, ActionCtx } from "./_generated/server";

/**
 * Ensures user is authenticated and returns the user ID.
 * Throws an error if not authenticated.
 */
export async function requireAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx
): Promise<Doc<"users">["_id"]> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/**
 * Filters out undefined values from an object.
 * Useful for building partial update objects from optional parameters.
 */
export function filterUndefinedValues<T extends Record<string, unknown>>(
  obj: T
): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as Partial<T>;
}

/**
 * Adds imageUrl to a recipe object using the R2 public URL.
 */
export function withImageUrl<T extends { imageId?: string | null }>(
  item: T
): T & { imageUrl: string | null } {
  return {
    ...item,
    imageUrl: item.imageId ? getR2PublicUrl(item.imageId) : null,
  };
}

/**
 * Type for a recipe with its image URL included.
 */
export type RecipeWithImage = Doc<"recipes"> & { imageUrl: string | null };
