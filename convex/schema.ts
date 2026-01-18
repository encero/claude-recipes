import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    canGenerateImages: v.optional(v.boolean()),
  }).index("email", ["email"]),

  recipes: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    imageId: v.optional(v.string()), // R2 object key
    rating: v.optional(v.number()), // 1-5 stars
    createdAt: v.number(),
    updatedAt: v.number(),
    lastCookedAt: v.optional(v.number()),
    createdBy: v.id("users"),
    imageGenerationStatus: v.optional(
      v.union(
        v.literal("generating"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    imageSource: v.optional(v.union(v.literal("upload"), v.literal("ai"))),
    imagePrompt: v.optional(v.string()),
  })
    .index("by_created_at", ["createdAt"])
    .index("by_name", ["name"])
    .index("by_user", ["createdBy"]),

  recipeImages: defineTable({
    recipeId: v.id("recipes"),
    imageId: v.optional(v.string()), // R2 object key
    prompt: v.string(),
    status: v.union(
      v.literal("generating"),
      v.literal("completed"),
      v.literal("failed")
    ),
    isAccepted: v.boolean(),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_recipe", ["recipeId"])
    .index("by_user", ["createdBy"])
    .index("by_accepted", ["isAccepted"]),

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

  imageGenerationLimits: defineTable({
    date: v.string(), // "2026-01-17" format
    count: v.number(),
  }).index("by_date", ["date"]),
});
