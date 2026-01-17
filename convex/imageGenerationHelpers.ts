import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal queries and mutations for image generation

export const getRecipe = internalQuery({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recipeId);
  },
});

export const getUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getDailyCount = internalQuery({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const record = await ctx.db
      .query("imageGenerationLimits")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    return record?.count ?? 0;
  },
});

export const incrementDailyCount = internalMutation({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("imageGenerationLimits")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
      await ctx.db.insert("imageGenerationLimits", { date: args.date, count: 1 });
    }
  },
});

export const updateStatus = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipeId, {
      imageGenerationStatus: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const setImage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    imageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipeId, {
      imageId: args.imageId,
      imageGenerationStatus: "completed",
      imageSource: "ai",
      updatedAt: Date.now(),
    });
  },
});
