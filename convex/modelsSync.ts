"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Internal action to fetch free models from OpenRouter API
export const fetchFreeModels = internalAction({
  args: {},
  handler: async (ctx) => {
    const response = await fetch("https://openrouter.ai/api/v1/models");

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.status}`);
    }

    const data = await response.json();
    const allModels = data.data || [];

    // Filter for free models (pricing.prompt and pricing.completion are "0" or 0)
    const freeModels = allModels
      .filter((model: {
        pricing?: { prompt?: string | number; completion?: string | number };
        architecture?: { modality?: string };
      }) => {
        const promptPrice = parseFloat(String(model.pricing?.prompt || "0"));
        const completionPrice = parseFloat(String(model.pricing?.completion || "0"));
        // Only include text-to-text models (exclude image generation, etc.)
        const modality = model.architecture?.modality || "";
        const isTextModel = modality.includes("text") && modality.includes("text->text");
        return promptPrice === 0 && completionPrice === 0 && isTextModel;
      })
      .map((model: {
        id: string;
        name: string;
        pricing?: { prompt?: string | number; completion?: string | number };
        context_length?: number;
      }) => ({
        modelId: model.id,
        name: model.name,
        inputPrice: parseFloat(String(model.pricing?.prompt || "0")) * 1000000, // Convert to per 1M tokens
        outputPrice: parseFloat(String(model.pricing?.completion || "0")) * 1000000,
        contextWindow: model.context_length || 4096,
      }));

    // Update the database
    await ctx.runMutation(internal.models.updateModels, { models: freeModels });

    return { count: freeModels.length };
  },
});
