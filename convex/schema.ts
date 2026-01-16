import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  recipes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.id("_storage")),
    rating: v.optional(v.number()), // 1-5 stars
    createdAt: v.number(),
    updatedAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_name", ["name"])
    .index("by_user", ["createdBy"]),

  cookingHistory: defineTable({
    recipeId: v.id("recipes"),
    cookedAt: v.number(),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()), // 1-5 stars for this specific cooking
    cookedBy: v.id("users"),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_date", ["cookedAt"])
    .index("by_user", ["cookedBy"]),

  scheduledMeals: defineTable({
    recipeId: v.id("recipes"),
    scheduledFor: v.number(), // timestamp for the scheduled date
    notes: v.optional(v.string()),
    completed: v.boolean(),
    createdBy: v.id("users"),
  })
    .index("by_date", ["scheduledFor"])
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["createdBy"])
    .index("by_completed", ["completed"]),
});
