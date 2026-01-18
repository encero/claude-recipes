import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth, filterUndefinedValues, withImageUrl } from "./helpers";

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
    const history = await ctx.db.query("cookingHistory").order("desc").take(limit);

    return Promise.all(
      history.map(async (entry) => {
        const recipe = await ctx.db.get(entry.recipeId);
        return {
          ...entry,
          recipe: recipe ? withImageUrl(recipe) : null,
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
    const userId = await requireAuth(ctx);
    const cookedAt = args.cookedAt ?? Date.now();

    await ctx.db.patch(args.recipeId, { lastCookedAt: cookedAt });

    return await ctx.db.insert("cookingHistory", {
      recipeId: args.recipeId,
      cookedAt,
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
    await requireAuth(ctx);
    const { id, ...updates } = args;
    await ctx.db.patch(id, filterUndefinedValues(updates));
  },
});

export const remove = mutation({
  args: { id: v.id("cookingHistory") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
