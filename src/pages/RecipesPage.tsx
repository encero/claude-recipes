import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Search, UtensilsCrossed, X, CalendarDays, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isToday, isTomorrow } from "date-fns";
import { RecipeCard } from "../components/RecipeCard";
import { AddRecipeModal } from "../components/AddRecipeModal";

function formatScheduledDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEEE, MMM d");
}

export function RecipesPage() {
  const recipes = useQuery(api.recipes.list);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes?.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find the next scheduled recipe (soonest upcoming, including today)
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const nextScheduledRecipe = recipes
    ?.filter((r) => r.nextScheduled && r.nextScheduled >= startOfToday.getTime())
    .sort((a, b) => (a.nextScheduled ?? 0) - (b.nextScheduled ?? 0))[0];

  return (
    <div className="p-4">
      {/* Next Scheduled Recipe */}
      {nextScheduledRecipe && (
        <Link
          to={`/recipe/${nextScheduledRecipe._id}`}
          className="block mb-4 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl overflow-hidden shadow-lg"
        >
          <div className="flex items-center">
            {/* Image */}
            <div className="w-24 h-24 flex-shrink-0">
              {nextScheduledRecipe.imageUrl ? (
                <img
                  src={nextScheduledRecipe.imageUrl}
                  alt={nextScheduledRecipe.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-primary-400 flex items-center justify-center">
                  <UtensilsCrossed className="w-8 h-8 text-primary-200" />
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-3">
              <div className="flex items-center gap-1.5 text-primary-100 text-xs font-medium mb-1">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Up Next</span>
              </div>
              <h3 className="text-white font-semibold text-lg leading-tight">
                {nextScheduledRecipe.name}
              </h3>
              <p className="text-primary-100 text-sm mt-0.5">
                {formatScheduledDate(nextScheduledRecipe.nextScheduled!)}
              </p>
            </div>

            {/* Arrow */}
            <div className="pr-4">
              <ChevronRight className="w-5 h-5 text-primary-200" />
            </div>
          </div>
        </Link>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search recipes..."
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
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
              scheduledFor={recipe.nextScheduled ?? undefined}
              imageGenerationStatus={recipe.imageGenerationStatus}
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
