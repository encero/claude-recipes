import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { getR2PublicUrl } from "./r2";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db
      .query("recipes")
      .order("desc")
      .collect();

    return Promise.all(
      recipes.map(async (recipe) => {
        // Get upcoming scheduled meals for this recipe
        const scheduledMeals = await ctx.db
          .query("scheduledMeals")
          .withIndex("by_recipe", (q) => q.eq("recipeId", recipe._id))
          .filter((q) => q.eq(q.field("completed"), false))
          .collect();

        // Find the next scheduled date
        const nextScheduled = scheduledMeals
          .map((m) => m.scheduledFor)
          .sort((a, b) => a - b)[0];

        return {
          ...recipe,
          imageUrl: recipe.imageId
            ? getR2PublicUrl(recipe.imageId)
            : null,
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

    // Get upcoming scheduled meals for this recipe
    const scheduledMeals = await ctx.db
      .query("scheduledMeals")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.id))
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();

    return {
      ...recipe,
      imageUrl: recipe.imageId
        ? getR2PublicUrl(recipe.imageId)
        : null,
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

    return images.map((image) => ({
      ...image,
      imageUrl: image.imageId
        ? getR2PublicUrl(image.imageId)
        : null,
    }));
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.string()), // R2 object key
    rating: v.optional(v.number()),
    imagePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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
    imageId: v.optional(v.string()), // R2 object key
    rating: v.optional(v.number()),
    imagePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, imageId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
      ...(imageId && { imageId, imageSource: "upload" as const }),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

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

    // Note: R2 files are not automatically deleted - they're cheap and can be cleaned up via lifecycle rules
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
