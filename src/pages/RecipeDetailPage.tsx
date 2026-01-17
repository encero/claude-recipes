import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  ArrowLeft,
  Calendar,
  ChefHat,
  Pencil,
  Trash2,
  UtensilsCrossed,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AddRecipeModal } from "../components/AddRecipeModal";
import { StarRating } from "../components/StarRating";
import { format, isToday, isTomorrow, differenceInDays } from "date-fns";

function formatScheduledDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "EEE, MMM d");
}

function getRelativeLabel(timestamp: number): { label: string; isUrgent: boolean } {
  const date = new Date(timestamp);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isToday(date)) return { label: "Today", isUrgent: true };
  if (isTomorrow(date)) return { label: "Tomorrow", isUrgent: true };

  const days = differenceInDays(date, today);
  if (days < 7) return { label: `In ${days} days`, isUrgent: false };
  return { label: format(date, "MMM d"), isUrgent: false };
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const recipe = useQuery(
    api.recipes.get,
    id ? { id: id as Id<"recipes"> } : "skip"
  );
  const history = useQuery(
    api.cookingHistory.listByRecipe,
    id ? { recipeId: id as Id<"recipes"> } : "skip"
  );

  const updateRecipe = useMutation(api.recipes.update);
  const deleteRecipe = useMutation(api.recipes.remove);
  const addHistory = useMutation(api.cookingHistory.add);
  const scheduleMeal = useMutation(api.scheduledMeals.schedule);
  const removeScheduled = useMutation(api.scheduledMeals.remove);
  const generateRecipeImage = useAction(api.imageGeneration.generateRecipeImage);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCookModal, setShowCookModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [cookNotes, setCookNotes] = useState("");
  const [cookRating, setCookRating] = useState<number | null>(null);
  const [selectedScheduledMeal, setSelectedScheduledMeal] = useState<Id<"scheduledMeals"> | "none" | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  if (recipe === undefined) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (recipe === null) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Recipe not found</p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 text-primary-600 font-medium"
        >
          Go back
        </button>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    setIsDeleting(true);
    try {
      await deleteRecipe({ id: recipe._id });
      navigate("/");
    } catch (error) {
      console.error("Failed to delete recipe:", error);
      setIsDeleting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduleDate) return;
    await scheduleMeal({
      recipeId: recipe._id,
      scheduledFor: new Date(scheduleDate).getTime(),
    });
    setScheduleDate("");
    setShowScheduleModal(false);
  };

  const handleLogCooking = async () => {
    await addHistory({
      recipeId: recipe._id,
      notes: cookNotes || undefined,
      rating: cookRating ?? undefined,
    });

    // Remove the scheduled meal if one was selected
    if (selectedScheduledMeal && selectedScheduledMeal !== "none") {
      await removeScheduled({ id: selectedScheduledMeal });
    }

    setCookNotes("");
    setCookRating(null);
    setSelectedScheduledMeal(null);
    setShowCookModal(false);
  };

  const handleRatingChange = async (newRating: number) => {
    await updateRecipe({ id: recipe._id, rating: newRating });
  };

  const handleRemoveScheduled = async (scheduledId: Id<"scheduledMeals">) => {
    await removeScheduled({ id: scheduledId });
  };

  const handleGenerateImage = async () => {
    setGenerationError(null);
    try {
      await generateRecipeImage({ recipeId: recipe._id });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate image";
      setGenerationError(message);
    }
  };

  return (
    <div className="pb-4">
      {/* Header Image */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {recipe.imageUrl ? (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        ) : recipe.imageGenerationStatus === "generating" ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
            <span className="text-sm text-gray-500 mt-3">Generating image...</span>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <UtensilsCrossed className="w-16 h-16 text-gray-300" />
            {recipe.imageGenerationStatus === "failed" && (
              <div className="mt-3 flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Generation failed</span>
              </div>
            )}
            <button
              onClick={handleGenerateImage}
              className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {recipe.imageGenerationStatus === "failed" ? "Try Again" : "Generate AI Image"}
            </button>
            {generationError && (
              <p className="mt-2 text-sm text-red-500 max-w-xs text-center">
                {generationError}
              </p>
            )}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>

        {/* Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm"
          >
            <Pencil className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-sm"
          >
            <Trash2 className="w-5 h-5 text-red-500" />
          </button>
        </div>

        {/* Rating */}
        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-2 rounded-xl">
          <StarRating
            rating={recipe.rating}
            onChange={handleRatingChange}
            size="lg"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900">{recipe.name}</h1>

        {recipe.description && (
          <p className="text-gray-600 mt-2">{recipe.description}</p>
        )}

        {/* Scheduled Meals */}
        {recipe.scheduledMeals && recipe.scheduledMeals.length > 0 && (
          <div className="mt-5 space-y-2">
            {recipe.scheduledMeals.map((meal) => {
              const { label, isUrgent } = getRelativeLabel(meal.scheduledFor);
              const fullDate = format(new Date(meal.scheduledFor), "EEEE, MMMM d");

              return (
                <div
                  key={meal._id}
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isUrgent
                      ? "bg-primary-50 border-primary-200"
                      : "bg-gray-50 border-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isUrgent ? "bg-primary-100" : "bg-gray-100"
                    }`}>
                      <Calendar className={`w-5 h-5 ${
                        isUrgent ? "text-primary-600" : "text-gray-500"
                      }`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        isUrgent ? "text-primary-900" : "text-gray-900"
                      }`}>
                        {label}
                      </p>
                      <p className="text-sm text-gray-500">{fullDate}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveScheduled(meal._id)}
                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove scheduled meal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => {
              // Auto-select the first scheduled meal if there's only one
              if (recipe.scheduledMeals?.length === 1) {
                setSelectedScheduledMeal(recipe.scheduledMeals[0]._id);
              } else if (recipe.scheduledMeals?.length === 0) {
                setSelectedScheduledMeal("none");
              } else {
                setSelectedScheduledMeal(null);
              }
              setShowCookModal(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
          >
            <ChefHat className="w-5 h-5" />
            Log Cooking
          </button>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Schedule
          </button>
        </div>

        {/* Cooking History */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Cooking History
          </h2>

          {history && history.length === 0 && (
            <p className="text-gray-500 text-sm">
              No cooking history yet. Log your first cooking!
            </p>
          )}

          {history && history.length > 0 && (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry._id}
                  className="bg-white rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {format(new Date(entry.cookedAt), "MMM d, yyyy")}
                    </span>
                    {entry.rating && (
                      <StarRating rating={entry.rating} size="sm" readonly />
                    )}
                  </div>
                  {entry.notes && (
                    <p className="text-gray-700 mt-2 text-sm">{entry.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Schedule Meal</h3>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
            />
            <button
              onClick={handleSchedule}
              disabled={!scheduleDate}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg disabled:opacity-50"
            >
              Schedule
            </button>
          </div>
        </div>
      )}

      {/* Log Cooking Modal */}
      {showCookModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Log Cooking</h3>
              <button
                onClick={() => setShowCookModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single Scheduled Meal Indicator */}
            {recipe.scheduledMeals && recipe.scheduledMeals.length === 1 && (
              <div className="mb-4 p-3 bg-primary-50 rounded-lg flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-primary-900">
                    Logging for {formatScheduledDate(recipe.scheduledMeals[0].scheduledFor)}
                  </p>
                  <p className="text-xs text-primary-600">
                    This scheduled meal will be marked as done
                  </p>
                </div>
              </div>
            )}

            {/* Scheduled Meal Selection */}
            {recipe.scheduledMeals && recipe.scheduledMeals.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Which scheduled meal is this?
                </label>
                <div className="space-y-2">
                  {recipe.scheduledMeals.map((meal) => (
                    <button
                      key={meal._id}
                      onClick={() => setSelectedScheduledMeal(meal._id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                        selectedScheduledMeal === meal._id
                          ? "border-primary-500 bg-primary-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Calendar className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">
                        {formatScheduledDate(meal.scheduledFor)}
                      </span>
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedScheduledMeal("none")}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                      selectedScheduledMeal === "none"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <ChefHat className="w-5 h-5 text-gray-500" />
                    <span className="font-medium text-gray-600">
                      Unscheduled cooking
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How was it?
              </label>
              <StarRating
                rating={cookRating}
                onChange={setCookRating}
                size="lg"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={cookNotes}
                onChange={(e) => setCookNotes(e.target.value)}
                placeholder="Any notes about this cooking..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            <button
              onClick={handleLogCooking}
              disabled={recipe.scheduledMeals && recipe.scheduledMeals.length > 1 && !selectedScheduledMeal}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      <AddRecipeModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        editRecipe={recipe}
      />
    </div>
  );
}
