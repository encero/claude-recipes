"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const DAILY_LIMIT = 10;

export const generateRecipeImage = action({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    // 1. Check user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 2. Get recipe and verify it exists
    const recipe = await ctx.runQuery(internal.imageGenerationHelpers.getRecipe, {
      recipeId: args.recipeId,
    });
    if (!recipe) throw new Error("Recipe not found");

    // 3. Check user has permission
    const user = await ctx.runQuery(internal.imageGenerationHelpers.getUser, {
      userId,
    });
    if (user?.canGenerateImages === false) {
      throw new Error("Image generation disabled for this account");
    }

    // 4. Check daily limit
    const today = new Date().toISOString().split("T")[0];
    const dailyCount = await ctx.runQuery(
      internal.imageGenerationHelpers.getDailyCount,
      { date: today }
    );
    if (dailyCount >= DAILY_LIMIT) {
      throw new Error("Daily image generation limit reached (10/day)");
    }

    // 5. Increment counter BEFORE calling API
    await ctx.runMutation(internal.imageGenerationHelpers.incrementDailyCount, {
      date: today,
    });

    // 6. Set status to "generating"
    await ctx.runMutation(internal.imageGenerationHelpers.updateStatus, {
      recipeId: args.recipeId,
      status: "generating",
    });

    try {
      const recipe_name = recipe.imagePrompt || recipe.name;

      // 7. Call Fal AI with prompt
      const prompt = `Professional food photography of ${recipe_name}, appetizing presentation, natural lighting, shallow depth of field, high quality, on a beautiful plate`;

      const apiKey = process.env.FAL_API_KEY;
      if (!apiKey) {
        throw new Error("FAL_API_KEY not configured");
      }

      const response = await fetch("https://fal.run/fal-ai/flux-2", {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          image_size: "landscape_4_3",
          num_images: 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fal AI error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const imageUrl = result.images?.[0]?.url;

      if (!imageUrl) {
        throw new Error("No image URL in response");
      }

      // 8. Download image from returned URL
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error("Failed to download generated image");
      }

      const imageBlob = await imageResponse.blob();

      // 9. Upload to Convex storage
      const uploadUrl = await ctx.storage.generateUploadUrl();
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": imageBlob.type },
        body: imageBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image to storage");
      }

      const { storageId } = await uploadResponse.json();

      // 10. Update recipe with imageId, status "completed"
      await ctx.runMutation(internal.imageGenerationHelpers.setImage, {
        recipeId: args.recipeId,
        imageId: storageId,
      });

      return { success: true };
    } catch (error) {
      // On error: set status "failed"
      await ctx.runMutation(internal.imageGenerationHelpers.updateStatus, {
        recipeId: args.recipeId,
        status: "failed",
      });

      throw error;
    }
  },
});
