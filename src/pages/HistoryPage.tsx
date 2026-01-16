import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { History, UtensilsCrossed } from "lucide-react";
import { format } from "date-fns";
import { StarRating } from "../components/StarRating";

export function HistoryPage() {
  const history = useQuery(api.cookingHistory.listRecent, { limit: 50 });

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-gray-900 mb-4">Cooking History</h1>

      {/* Loading State */}
      {history === undefined && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      )}

      {/* Empty State */}
      {history && history.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <History className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No cooking history
          </h3>
          <p className="text-gray-500">
            Your cooking adventures will appear here
          </p>
        </div>
      )}

      {/* History List */}
      {history && history.length > 0 && (
        <div className="space-y-3">
          {history.map((entry) => (
            <Link
              key={entry._id}
              to={entry.recipe ? `/recipe/${entry.recipeId}` : "#"}
              className="block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Image */}
                <div className="w-24 h-24 bg-gray-100 flex-shrink-0">
                  {entry.recipe?.imageUrl ? (
                    <img
                      src={entry.recipe.imageUrl}
                      alt={entry.recipe.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {entry.recipe?.name ?? "Deleted Recipe"}
                    </h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {format(new Date(entry.cookedAt), "MMM d")}
                    </span>
                  </div>

                  {entry.rating && (
                    <div className="mt-1">
                      <StarRating rating={entry.rating} size="sm" readonly />
                    </div>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
