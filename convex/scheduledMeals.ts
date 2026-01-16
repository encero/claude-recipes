import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: {
    includeCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("scheduledMeals").order("asc");

    const meals = await query.collect();

    const filteredMeals = args.includeCompleted
      ? meals
      : meals.filter((m) => !m.completed);

    return Promise.all(
      filteredMeals.map(async (meal) => {
        const recipe = await ctx.db.get(meal.recipeId);
        return {
          ...meal,
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

export const listByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
  },
  handler: async (ctx, args) => {
    const meals = await ctx.db
      .query("scheduledMeals")
      .withIndex("by_date")
      .filter((q) =>
        q.and(
          q.gte(q.field("scheduledFor"), args.startDate),
          q.lte(q.field("scheduledFor"), args.endDate)
        )
      )
      .collect();

    return Promise.all(
      meals.map(async (meal) => {
        const recipe = await ctx.db.get(meal.recipeId);
        return {
          ...meal,
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

export const schedule = mutation({
  args: {
    recipeId: v.id("recipes"),
    scheduledFor: v.number(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    return await ctx.db.insert("scheduledMeals", {
      recipeId: args.recipeId,
      scheduledFor: args.scheduledFor,
      notes: args.notes,
      completed: false,
      createdBy: userId,
    });
  },
});

export const markCompleted = mutation({
  args: {
    id: v.id("scheduledMeals"),
    addToHistory: v.optional(v.boolean()),
    historyNotes: v.optional(v.string()),
    historyRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const meal = await ctx.db.get(args.id);
    if (!meal) throw new Error("Scheduled meal not found");

    await ctx.db.patch(args.id, { completed: true });

    // Optionally add to cooking history
    if (args.addToHistory) {
      await ctx.db.insert("cookingHistory", {
        recipeId: meal.recipeId,
        cookedAt: Date.now(),
        notes: args.historyNotes,
        rating: args.historyRating,
        cookedBy: userId,
      });
    }
  },
});

export const update = mutation({
  args: {
    id: v.id("scheduledMeals"),
    scheduledFor: v.optional(v.number()),
    notes: v.optional(v.string()),
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
  args: { id: v.id("scheduledMeals") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.delete(args.id);
  },
});
