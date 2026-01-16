import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const listByRecipe = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("cookingHistory")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("desc")
      .collect();
  },
});

export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const history = await ctx.db
      .query("cookingHistory")
      .order("desc")
      .take(limit);

    return Promise.all(
      history.map(async (entry) => {
        const recipe = await ctx.db.get(entry.recipeId);
        return {
          ...entry,
          recipe: recipe
            ? {
                ...recipe,
                imageUrl: recipe.imageId
                  ? await ctx.storage.getUrl(recipe.imageId)
                  : null,
              }
            : null,
        };
      })
    );
  },
});

export const add = mutation({
  args: {
    recipeId: v.id("recipes"),
    cookedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("cookingHistory", {
      recipeId: args.recipeId,
      cookedAt: args.cookedAt ?? Date.now(),
      notes: args.notes,
      rating: args.rating,
      cookedBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("cookingHistory"),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(id, filteredUpdates);
  },
});

export const remove = mutation({
  args: { id: v.id("cookingHistory") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});
