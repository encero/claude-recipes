import { query } from "./_generated/server";

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
