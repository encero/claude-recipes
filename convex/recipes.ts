import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { requireAuth, filterUndefinedValues, withImageUrl } from "./helpers";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

// Helper to get upcoming scheduled meals for a recipe
async function getUpcomingMeals(ctx: QueryCtx, recipeId: Id<"recipes">) {
  return await ctx.db
    .query("scheduledMeals")
    .withIndex("by_recipe", (q) => q.eq("recipeId", recipeId))
    .filter((q) => q.eq(q.field("completed"), false))
    .collect();
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").order("desc").collect();

    return Promise.all(
      recipes.map(async (recipe) => {
        const scheduledMeals = await getUpcomingMeals(ctx, recipe._id);
        const nextScheduled = scheduledMeals
          .map((m) => m.scheduledFor)
          .sort((a, b) => a - b)[0];

        return {
          ...withImageUrl(recipe),
          nextScheduled: nextScheduled ?? null,
        };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    const scheduledMeals = await getUpcomingMeals(ctx, args.id);

    return {
      ...withImageUrl(recipe),
      scheduledMeals: scheduledMeals.sort((a, b) => a.scheduledFor - b.scheduledFor),
    };
  },
});

export const getRecipeImages = query({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("recipeImages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .order("desc")
      .collect();

    return images.map((image) => withImageUrl(image));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.string()),
    rating: v.optional(v.number()),
    imagePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuth(ctx);
    const now = Date.now();

    return await ctx.db.insert("recipes", {
      name: args.name,
      description: args.description,
      imageId: args.imageId,
      rating: args.rating,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      imageSource: args.imageId ? "upload" : undefined,
      imagePrompt: args.imagePrompt,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.string()),
    rating: v.optional(v.number()),
    imagePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, imageId, ...updates } = args;

    await ctx.db.patch(id, {
      ...filterUndefinedValues(updates),
      ...(imageId && { imageId, imageSource: "upload" as const }),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    // Delete associated cooking history
    const history = await ctx.db
      .query("cookingHistory")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();

    for (const entry of history) {
      await ctx.db.delete(entry._id);
    }

    // Delete associated scheduled meals
    const scheduled = await ctx.db
      .query("scheduledMeals")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .collect();

    for (const meal of scheduled) {
      await ctx.db.delete(meal._id);
    }

    await ctx.db.delete(args.id);
  },
});

// Internal mutation to backfill lastCookedAt for all recipes
export const recomputeLastCookedAt = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db.query("recipes").collect();
    let updated = 0;

    for (const recipe of recipes) {
      // Get the most recent cooking history entry for this recipe
      const latestHistory = await ctx.db
        .query("cookingHistory")
        .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
        .order("desc")
        .first();

      const lastCookedAt = latestHistory?.cookedAt ?? undefined;

      // Only update if the value is different
      if (recipe.lastCookedAt !== lastCookedAt) {
        await ctx.db.patch(recipe._id, { lastCookedAt });
        updated++;
      }
    }

    return { total: recipes.length, updated };
  },
});
