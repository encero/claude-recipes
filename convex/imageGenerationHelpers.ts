import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

// Internal queries and mutations for image generation

export const getRecipe = internalQuery({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.recipeId);
  },
});

export const getRecipeImage = internalQuery({
  args: { imageEntryId: v.id("recipeImages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.imageEntryId);
  },
});

export const hasAcceptedImages = internalQuery({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    const acceptedImage = await ctx.db
      .query("recipeImages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .filter((q) => q.eq(q.field("isAccepted"), true))
      .first();
    return acceptedImage !== null;
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

export const createRecipeImage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    prompt: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipeImages", {
      recipeId: args.recipeId,
      prompt: args.prompt,
      status: "generating",
      isAccepted: false,
      createdAt: Date.now(),
      createdBy: args.userId,
    });
  },
});

export const createUploadedRecipeImage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    imageId: v.string(), // R2 object key
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipeImages", {
      recipeId: args.recipeId,
      imageId: args.imageId,
      prompt: "Uploaded image",
      status: "completed",
      isAccepted: true,
      createdAt: Date.now(),
      createdBy: args.userId,
    });
  },
});

export const completeRecipeImage = internalMutation({
  args: {
    imageEntryId: v.id("recipeImages"),
    imageId: v.string(), // R2 object key
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageEntryId, {
      imageId: args.imageId,
      status: "completed",
    });
  },
});

export const failRecipeImage = internalMutation({
  args: {
    imageEntryId: v.id("recipeImages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageEntryId, {
      status: "failed",
    });
  },
});

export const acceptRecipeImage = internalMutation({
  args: {
    imageEntryId: v.id("recipeImages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.imageEntryId, {
      isAccepted: true,
    });
  },
});

export const unacceptAllRecipeImages = internalMutation({
  args: {
    recipeId: v.id("recipes"),
  },
  handler: async (ctx, args) => {
    const images = await ctx.db
      .query("recipeImages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const image of images) {
      if (image.isAccepted) {
        await ctx.db.patch(image._id, { isAccepted: false });
      }
    }
  },
});

export const updateRecipeImage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    imageId: v.string(),
    imagePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.recipeId, {
      imageId: args.imageId,
      imageGenerationStatus: "completed",
      imageSource: "ai",
      ...(args.imagePrompt !== undefined && { imagePrompt: args.imagePrompt }),
      updatedAt: Date.now(),
    });
  },
});

// Consolidated: Accept an image as the recipe's default (combines 3 operations into 1)
export const setAcceptedImage = internalMutation({
  args: {
    recipeId: v.id("recipes"),
    imageEntryId: v.id("recipeImages"),
    imageId: v.string(),
    imagePrompt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Unaccept all other images for this recipe
    const images = await ctx.db
      .query("recipeImages")
      .withIndex("by_recipe", (q) => q.eq("recipeId", args.recipeId))
      .collect();

    for (const image of images) {
      if (image.isAccepted) {
        await ctx.db.patch(image._id, { isAccepted: false });
      }
    }

    // 2. Accept the specified image
    await ctx.db.patch(args.imageEntryId, { isAccepted: true });

    // 3. Update recipe with the image
    await ctx.db.patch(args.recipeId, {
      imageId: args.imageId,
      imageGenerationStatus: "completed",
      imageSource: "ai",
      ...(args.imagePrompt !== undefined && { imagePrompt: args.imagePrompt }),
      updatedAt: Date.now(),
    });
  },
});
