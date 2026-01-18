"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { r2 } from "./r2";
import { requireAuth } from "./helpers";

const DAILY_LIMIT = 10;

// Helper function to convert technical errors to user-friendly messages
function getUserFriendlyError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Handle specific error cases
  if (errorMessage.includes("FAL_API_KEY not configured")) {
    return "Image generation service is temporarily unavailable. Please try again later.";
  }
  
  if (errorMessage.includes("Daily image generation limit reached")) {
    return "You've reached the daily limit of 10 image generations. Please try again tomorrow.";
  }
  
  if (errorMessage.includes("Not authenticated")) {
    return "Please log in to generate images.";
  }
  
  if (errorMessage.includes("Recipe not found")) {
    return "Recipe not found. Please refresh the page and try again.";
  }
  
  if (errorMessage.includes("Image generation disabled")) {
    return "Image generation is disabled for your account.";
  }
  
  if (errorMessage.includes("Fal AI error")) {
    return "Image generation failed. The AI service may be busy. Please try again.";
  }
  
  if (errorMessage.includes("Failed to download generated image")) {
    return "Failed to process the generated image. Please try again.";
  }
  
  if (errorMessage.includes("Failed to upload image to storage")) {
    return "Failed to save the image. Please try again.";
  }
  
  if (errorMessage.includes("No image URL in response")) {
    return "Image generation failed. Please try again.";
  }
  
  // Generic fallback for unexpected errors
  return "Something went wrong while generating the image. Please try again.";
}

export const generateRecipeImage = action({
  args: { recipeId: v.id("recipes"), prompt: v.optional(v.string()) },
  handler: async (ctx, args): Promise<{ success: boolean; imageEntryId: Id<"recipeImages"> }> => {
    const userId = await requireAuth(ctx);

    const recipe: Doc<"recipes"> | null = await ctx.runQuery(
      internal.imageGenerationHelpers.getRecipe,
      { recipeId: args.recipeId }
    );
    if (!recipe) throw new Error("Recipe not found");

    const user = await ctx.runQuery(internal.imageGenerationHelpers.getUser, { userId });
    if (user?.canGenerateImages === false) {
      throw new Error("Image generation disabled for this account");
    }

    const today = new Date().toISOString().split("T")[0];
    const dailyCount = await ctx.runQuery(
      internal.imageGenerationHelpers.getDailyCount,
      { date: today }
    );
    if (dailyCount >= DAILY_LIMIT) {
      throw new Error("Daily image generation limit reached (10/day)");
    }

    await ctx.runMutation(internal.imageGenerationHelpers.incrementDailyCount, { date: today });
    await ctx.runMutation(internal.imageGenerationHelpers.updateStatus, {
      recipeId: args.recipeId,
      status: "generating",
    });

    const prompt: string = args.prompt || recipe.imagePrompt || recipe.name;
    const imageEntryId: Id<"recipeImages"> = await ctx.runMutation(
      internal.imageGenerationHelpers.createRecipeImage,
      { recipeId: args.recipeId, prompt, userId }
    );

    try {
      const fullPrompt = `Professional food photography of ${prompt}, appetizing presentation, natural lighting, shallow depth of field, high quality, on a beautiful plate`;

      const apiKey = process.env.FAL_API_KEY;
      if (!apiKey) throw new Error("FAL_API_KEY not configured");

      const response = await fetch("https://fal.run/fal-ai/flux-2", {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          image_size: "landscape_4_3",
          num_images: 1,
          enable_safety_checker: false,
          output_format: "webp",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal AI error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const imageUrl = result.images?.[0]?.url;
      if (!imageUrl) throw new Error("No image URL in response");

      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) throw new Error("Failed to download generated image");

      const imageBlob = await imageResponse.blob();
      const key = await r2.store(ctx, imageBlob);

      await ctx.runMutation(internal.imageGenerationHelpers.completeRecipeImage, {
        imageEntryId,
        imageId: key,
      });

      // Auto-accept if this is the first image for this recipe
      const hasAcceptedImages = await ctx.runQuery(
        internal.imageGenerationHelpers.hasAcceptedImages,
        { recipeId: args.recipeId }
      );

      if (!hasAcceptedImages) {
        await ctx.runMutation(internal.imageGenerationHelpers.setAcceptedImage, {
          recipeId: args.recipeId,
          imageEntryId,
          imageId: key,
          imagePrompt: prompt,
        });
      }

      return { success: true, imageEntryId };
    } catch (error) {
      await ctx.runMutation(internal.imageGenerationHelpers.failRecipeImage, { imageEntryId });
      await ctx.runMutation(internal.imageGenerationHelpers.updateStatus, {
        recipeId: args.recipeId,
        status: "failed",
      });
      throw new Error(getUserFriendlyError(error));
    }
  },
});

export const acceptRecipeImage = action({
  args: { imageEntryId: v.id("recipeImages") },
  handler: async (ctx, args) => {
    try {
      const userId = await requireAuth(ctx);

      const imageEntry = await ctx.runQuery(
        internal.imageGenerationHelpers.getRecipeImage,
        { imageEntryId: args.imageEntryId }
      );
      if (!imageEntry) throw new Error("Image entry not found");
      if (imageEntry.createdBy !== userId) throw new Error("Not authorized");
      if (!imageEntry.imageId) throw new Error("Image is not yet available");

      await ctx.runMutation(internal.imageGenerationHelpers.setAcceptedImage, {
        recipeId: imageEntry.recipeId,
        imageEntryId: args.imageEntryId,
        imageId: imageEntry.imageId,
        imagePrompt: imageEntry.prompt,
      });

      return { success: true };
    } catch (error) {
      throw new Error(getUserFriendlyError(error));
    }
  },
});

export const createUploadedRecipeImage = action({
  args: { recipeId: v.id("recipes"), imageId: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    try {
      const userId = await requireAuth(ctx);

      await ctx.runMutation(internal.imageGenerationHelpers.createUploadedRecipeImage, {
        recipeId: args.recipeId,
        imageId: args.imageId,
        userId,
      });

      return { success: true };
    } catch (error) {
      throw new Error(getUserFriendlyError(error));
    }
  },
});

export const replaceRecipeImage = action({
  args: { recipeId: v.id("recipes"), imageId: v.string() },
  handler: async (ctx, args): Promise<{ success: boolean }> => {
    try {
      const userId = await requireAuth(ctx);

      const imageEntryId = await ctx.runMutation(
        internal.imageGenerationHelpers.createUploadedRecipeImage,
        { recipeId: args.recipeId, imageId: args.imageId, userId }
      );

      await ctx.runMutation(internal.imageGenerationHelpers.setAcceptedImage, {
        recipeId: args.recipeId,
        imageEntryId,
        imageId: args.imageId,
        imagePrompt: "Uploaded image",
      });

      return { success: true };
    } catch (error) {
      throw new Error(getUserFriendlyError(error));
    }
  },
});
