import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { Link } from "react-router-dom";
import { History, UtensilsCrossed, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { StarRating } from "../components/StarRating";
import { EditHistoryModal } from "../components/EditHistoryModal";

export function HistoryPage() {
  const history = useQuery(api.cookingHistory.listRecent, { limit: 50 });
  const removeHistory = useMutation(api.cookingHistory.remove);

  const [editingHistory, setEditingHistory] = useState<{
    _id: Id<"cookingHistory">;
    notes?: string;
    rating?: number;
  } | null>(null);

  const handleDeleteHistory = async (historyId: Id<"cookingHistory">) => {
    if (!confirm("Delete this cooking history entry?")) return;
    await removeHistory({ id: historyId });
  };

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
            <div
              key={entry._id}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex">
                {/* Image */}
                <Link
                  to={entry.recipe ? `/recipe/${entry.recipeId}` : "#"}
                  className="w-24 h-24 bg-gray-100 flex-shrink-0"
                >
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
                </Link>

                {/* Content */}
                <div className="flex-1 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={entry.recipe ? `/recipe/${entry.recipeId}` : "#"}
                      className="font-semibold text-gray-900 hover:text-primary-600"
                    >
                      {entry.recipe?.name ?? "Deleted Recipe"}
                    </Link>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {format(new Date(entry.cookedAt), "MMM d")}
                      </span>
                      <button
                        onClick={() => setEditingHistory(entry)}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Edit history entry"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(entry._id)}
                        className="p-1 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                        aria-label="Delete history entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
            </div>
          ))}
        </div>
      )}

      {/* Edit History Modal */}
      <EditHistoryModal
        historyId={editingHistory?._id ?? null}
        initialNotes={editingHistory?.notes}
        initialRating={editingHistory?.rating}
        onClose={() => setEditingHistory(null)}
      />
    </div>
  );
}
