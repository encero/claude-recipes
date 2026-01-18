import { useState, useEffect } from "react";
import { useQuery, useAction, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Sparkles, Plus, Check, Loader2, ChevronDown, DollarSign, AlertCircle } from "lucide-react";

interface SuggestedRecipe {
  name: string;
  description: string;
  imagePrompt?: string;
}

interface RecipeSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatPrice(price: number): string {
  if (price < 0.01) return "<$0.01";
  return `$${price.toFixed(2)}`;
}

function formatPricePerMillion(price: number): string {
  if (price < 1) return `$${price.toFixed(2)}/1M`;
  return `$${price.toFixed(0)}/1M`;
}

export function RecipeSuggestionsModal({ isOpen, onClose }: RecipeSuggestionsModalProps) {
  const models = useQuery(api.recipeSuggestions.getModels);
  const recipes = useQuery(api.recipes.list);
  const generateSuggestions = useAction(api.recipeSuggestions.generateSuggestions);
  const createRecipe = useMutation(api.recipes.create);
  const generateRecipeImage = useAction(api.imageGeneration.generateRecipeImage);

  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestedRecipe[]>([]);
  const [addedRecipes, setAddedRecipes] = useState<Set<number>>(new Set());
  const [addingRecipes, setAddingRecipes] = useState<Set<number>>(new Set());
  const [usage, setUsage] = useState<{ promptTokens: number; completionTokens: number; estimatedCost: number } | null>(null);

  // Set default model when models load
  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0].id);
    }
  }, [models, selectedModelId]);

  const selectedModel = models?.find((m: typeof models[number]) => m.id === selectedModelId);

  const handleGenerate = async () => {
    if (!prompt.trim() || !selectedModelId) return;

    setIsLoading(true);
    setError(null);
    setSuggestions([]);
    setAddedRecipes(new Set());
    setUsage(null);

    try {
      const existingRecipes = recipes?.map((r) => ({
        name: r.name,
        description: r.description ?? undefined,
      })) ?? [];

      const result = await generateSuggestions({
        modelId: selectedModelId,
        prompt: prompt.trim(),
        existingRecipes,
      });

      setSuggestions(result.recipes);
      if (result.usage) {
        setUsage(result.usage);
      }

      if (result.recipes.length === 0 || result.parseError) {
        setError("No valid recipes were generated. The model's response couldn't be parsed. Please try again or use a different prompt.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate suggestions";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRecipe = async (recipe: SuggestedRecipe, index: number) => {
    if (addedRecipes.has(index) || addingRecipes.has(index)) return;

    setAddingRecipes((prev) => new Set(prev).add(index));

    try {
      const recipeId = await createRecipe({
        name: recipe.name,
        description: recipe.description,
        imagePrompt: recipe.imagePrompt,
      });

      // Trigger AI image generation in the background
      if (recipe.imagePrompt) {
        generateRecipeImage({ recipeId, prompt: recipe.imagePrompt }).catch((err) => {
          console.error("Failed to generate image for suggested recipe:", err);
        });
      }

      setAddedRecipes((prev) => new Set(prev).add(index));
    } catch (err) {
      console.error("Failed to add recipe:", err);
    } finally {
      setAddingRecipes((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
  };

  const handleAddAll = async () => {
    for (let i = 0; i < suggestions.length; i++) {
      if (!addedRecipes.has(i) && !addingRecipes.has(i)) {
        await handleAddRecipe(suggestions[i], i);
      }
    }
  };

  const handleClose = () => {
    setSuggestions([]);
    setAddedRecipes(new Set());
    setError(null);
    setUsage(null);
    onClose();
  };

  if (!isOpen) return null;

  const allAdded = suggestions.length > 0 && suggestions.every((_, i) => addedRecipes.has(i));

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-gray-900">AI Recipe Suggestions</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Model Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              AI Model
            </label>
            <div className="relative">
              <select
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                disabled={isLoading}
                className="appearance-none w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {models?.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
            {selectedModel && (
              <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Input: {formatPricePerMillion(selectedModel.inputPrice)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  <span>Output: {formatPricePerMillion(selectedModel.outputPrice)}</span>
                </div>
                <div className="text-gray-400">
                  {(selectedModel.contextWindow / 1000).toFixed(0)}k context
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What kind of recipes are you looking for?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Quick weeknight dinners, Italian pasta dishes, healthy breakfast ideas, recipes using chicken and vegetables..."
              rows={3}
              disabled={isLoading}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Existing Recipes Info */}
          {recipes && recipes.length > 0 && (
            <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
              The AI will see your {recipes.length} existing recipe{recipes.length !== 1 ? "s" : ""} to avoid duplicates.
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim() || !selectedModelId}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Suggestions
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Usage Info */}
          {usage && (
            <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg flex items-center gap-4">
              <span>Tokens: {usage.promptTokens} in / {usage.completionTokens} out</span>
              <span className="text-primary-600 font-medium">
                Cost: {formatPrice(usage.estimatedCost)}
              </span>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">
                  Suggested Recipes ({suggestions.length})
                </h3>
                {!allAdded && (
                  <button
                    onClick={handleAddAll}
                    disabled={isLoading}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add All
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {suggestions.map((recipe, index) => {
                  const isAdded = addedRecipes.has(index);
                  const isAdding = addingRecipes.has(index);

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-colors ${
                        isAdded
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">{recipe.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
                          {recipe.imagePrompt && (
                            <p className="text-xs text-gray-400 mt-1 italic">
                              Image: {recipe.imagePrompt}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddRecipe(recipe, index)}
                          disabled={isAdded || isAdding}
                          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                            isAdded
                              ? "bg-green-100 text-green-600"
                              : isAdding
                              ? "bg-gray-100 text-gray-400"
                              : "bg-primary-100 text-primary-600 hover:bg-primary-200"
                          }`}
                        >
                          {isAdding ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isAdded ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <Plus className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
