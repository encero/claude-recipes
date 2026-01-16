import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Search, UtensilsCrossed } from "lucide-react";
import { RecipeCard } from "../components/RecipeCard";
import { AddRecipeModal } from "../components/AddRecipeModal";

export function RecipesPage() {
  const recipes = useQuery(api.recipes.list);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes?.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4">
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Loading State */}
      {recipes === undefined && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty State */}
      {recipes && recipes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <UtensilsCrossed className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No recipes yet
          </h3>
          <p className="text-gray-500 mb-4">
            Add your first recipe to get started
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            Add Recipe
          </button>
        </div>
      )}

      {/* No Search Results */}
      {filteredRecipes && filteredRecipes.length === 0 && recipes && recipes.length > 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-500">No recipes match your search</p>
        </div>
      )}

      {/* Recipe Grid */}
      {filteredRecipes && filteredRecipes.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe._id}
              id={recipe._id}
              name={recipe.name}
              description={recipe.description}
              imageUrl={recipe.imageUrl}
              rating={recipe.rating}
            />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors flex items-center justify-center z-40"
        aria-label="Add recipe"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Add Recipe Modal */}
      <AddRecipeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
