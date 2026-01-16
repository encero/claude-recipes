import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const recipes = await ctx.db
      .query("recipes")
      .order("desc")
      .collect();

    return Promise.all(
      recipes.map(async (recipe) => ({
        ...recipe,
        imageUrl: recipe.imageId
          ? await ctx.storage.getUrl(recipe.imageId)
          : null,
      }))
    );
  },
});

export const get = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args) => {
    const recipe = await ctx.db.get(args.id);
    if (!recipe) return null;

    return {
      ...recipe,
      imageUrl: recipe.imageId
        ? await ctx.storage.getUrl(recipe.imageId)
        : null,
    };
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    rating: v.optional(v.number()),
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
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    rating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const { id, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(id, {
      ...filteredUpdates,
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

    // Delete the recipe image if it exists
    const recipe = await ctx.db.get(args.id);
    if (recipe?.imageId) {
      await ctx.storage.delete(recipe.imageId);
    }

    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});
