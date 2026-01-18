"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { OPENROUTER_MODELS } from "./models";

// Recipe suggestion result schema
export interface SuggestedRecipe {
  name: string;
  description: string;
  imagePrompt?: string;
}

export interface SuggestionResult {
  recipes: SuggestedRecipe[];
  rawResponse: string;
  parseError?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    estimatedCost: number;
  };
}

// Main action to generate recipe suggestions
export const generateSuggestions = action({
  args: {
    modelId: v.string(),
    prompt: v.string(),
    existingRecipes: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<SuggestionResult> => {
    // Check user is authenticated
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment.");
    }

    // Find the model to get pricing
    const model = OPENROUTER_MODELS.find((m) => m.id === args.modelId);
    if (!model) {
      throw new Error(`Unknown model: ${args.modelId}`);
    }

    // Build the context with existing recipes
    const existingRecipesContext = args.existingRecipes.length > 0
      ? `Here are the recipes I already have in my collection:\n${args.existingRecipes
          .map((r, i) => `${i + 1}. ${r.name}${r.description ? ` - ${r.description}` : ""}`)
          .join("\n")}\n\n`
      : "";

    const systemPrompt = `You are a helpful culinary assistant that suggests recipes. You provide recipe suggestions in a structured JSON format.

When suggesting recipes, be creative and diverse. Consider different cuisines, difficulty levels, and ingredients.

IMPORTANT: You must respond with ONLY a valid JSON object in this exact format, no other text:
{
  "recipes": [
    {
      "name": "Recipe Name",
      "description": "A brief description of the recipe (1-2 sentences)",
      "imagePrompt": "A short English phrase describing the dish for image generation (e.g., 'creamy mushroom risotto with parmesan')"
    }
  ]
}

Generate 3-8 recipe suggestions based on the user's request. Make sure not to suggest recipes that already exist in their collection (if any are provided).`;

    const userPrompt = `${existingRecipesContext}${args.prompt}

Please suggest some recipes based on my request above. Remember to respond with ONLY the JSON object.`;

    // Set up timeout with AbortController (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.CONVEX_SITE_URL || "http://localhost:5173",
          "X-Title": "Recipe App",
        },
        body: JSON.stringify({
          model: args.modelId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const rawResponse = result.choices?.[0]?.message?.content || "";

      // Parse the JSON response
      let recipes: SuggestedRecipe[] = [];
      let parseError = false;
      try {
        // Try to extract JSON from the response (handle markdown code blocks)
        let jsonStr = rawResponse;
        const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          jsonStr = jsonMatch[1].trim();
        }

        const parsed = JSON.parse(jsonStr);
        if (parsed.recipes && Array.isArray(parsed.recipes)) {
          recipes = parsed.recipes.map((r: Record<string, unknown>) => ({
            name: String(r.name || ""),
            description: String(r.description || ""),
            imagePrompt: r.imagePrompt ? String(r.imagePrompt) : undefined,
          }));
        }
      } catch {
        // If parsing fails, set parseError flag and return empty recipes with the raw response
        console.error("Failed to parse recipe suggestions:", rawResponse);
        parseError = true;
      }

      // Calculate usage and cost
      const usage = result.usage
        ? {
            promptTokens: result.usage.prompt_tokens || 0,
            completionTokens: result.usage.completion_tokens || 0,
            estimatedCost:
              ((result.usage.prompt_tokens || 0) * model.inputPrice +
                (result.usage.completion_tokens || 0) * model.outputPrice) /
              1000000,
          }
        : undefined;

      return {
        recipes,
        rawResponse,
        parseError,
        usage,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timed out after 30 seconds. Please try again.");
      }
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate suggestions: ${message}`);
    }
  },
});
