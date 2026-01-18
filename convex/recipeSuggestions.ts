"use node";

import { v } from "convex/values";
import { action, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Model definitions with pricing per 1M tokens
export const OPENROUTER_MODELS = [
  {
    id: "google/gemini-2.0-flash-001",
    name: "Gemini 2.0 Flash",
    inputPrice: 0.1,
    outputPrice: 0.4,
    contextWindow: 1000000,
  },
  {
    id: "google/gemini-2.0-flash-lite-001",
    name: "Gemini 2.0 Flash Lite",
    inputPrice: 0.075,
    outputPrice: 0.3,
    contextWindow: 1000000,
  },
  {
    id: "anthropic/claude-3.5-haiku",
    name: "Claude 3.5 Haiku",
    inputPrice: 0.8,
    outputPrice: 4,
    contextWindow: 200000,
  },
  {
    id: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    inputPrice: 3,
    outputPrice: 15,
    contextWindow: 200000,
  },
  {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    inputPrice: 0.15,
    outputPrice: 0.6,
    contextWindow: 128000,
  },
  {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    inputPrice: 2.5,
    outputPrice: 10,
    contextWindow: 128000,
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    inputPrice: 0.3,
    outputPrice: 0.4,
    contextWindow: 131072,
  },
  {
    id: "deepseek/deepseek-chat",
    name: "DeepSeek V3",
    inputPrice: 0.14,
    outputPrice: 0.28,
    contextWindow: 64000,
  },
] as const;

export type OpenRouterModel = (typeof OPENROUTER_MODELS)[number];

// Query to get available models
export const getModels = query({
  args: {},
  handler: async () => {
    return OPENROUTER_MODELS;
  },
});

// Recipe suggestion result schema
export interface SuggestedRecipe {
  name: string;
  description: string;
  imagePrompt?: string;
}

export interface SuggestionResult {
  recipes: SuggestedRecipe[];
  rawResponse: string;
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
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const rawResponse = result.choices?.[0]?.message?.content || "";

      // Parse the JSON response
      let recipes: SuggestedRecipe[] = [];
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
        // If parsing fails, return empty recipes with the raw response
        console.error("Failed to parse recipe suggestions:", rawResponse);
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
        usage,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to generate suggestions: ${message}`);
    }
  },
});
