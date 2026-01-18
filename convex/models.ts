import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";

// Type for model data
export interface OpenRouterModel {
  id: string;
  name: string;
  inputPrice: number;
  outputPrice: number;
  contextWindow: number;
}

// Query to get available models from the database
export const getModels = query({
  args: {},
  handler: async (ctx): Promise<OpenRouterModel[]> => {
    const models = await ctx.db.query("openRouterModels").collect();
    return models.map((m) => ({
      id: m.modelId,
      name: m.name,
      inputPrice: m.inputPrice,
      outputPrice: m.outputPrice,
      contextWindow: m.contextWindow,
    }));
  },
});

// Internal mutation to update models in the database
export const updateModels = internalMutation({
  args: {
    models: v.array(
      v.object({
        modelId: v.string(),
        name: v.string(),
        inputPrice: v.number(),
        outputPrice: v.number(),
        contextWindow: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get existing models
    const existingModels = await ctx.db.query("openRouterModels").collect();
    const existingByModelId = new Map(existingModels.map((m) => [m.modelId, m]));

    // Track which models we've seen
    const seenModelIds = new Set<string>();

    // Update or insert models
    for (const model of args.models) {
      seenModelIds.add(model.modelId);
      const existing = existingByModelId.get(model.modelId);

      if (existing) {
        // Update existing model
        await ctx.db.patch(existing._id, {
          name: model.name,
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice,
          contextWindow: model.contextWindow,
          lastUpdated: now,
        });
      } else {
        // Insert new model
        await ctx.db.insert("openRouterModels", {
          modelId: model.modelId,
          name: model.name,
          inputPrice: model.inputPrice,
          outputPrice: model.outputPrice,
          contextWindow: model.contextWindow,
          lastUpdated: now,
        });
      }
    }

    // Remove models that no longer exist
    for (const existing of existingModels) {
      if (!seenModelIds.has(existing.modelId)) {
        await ctx.db.delete(existing._id);
      }
    }

    return { updated: args.models.length };
  },
});
