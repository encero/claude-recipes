import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  isToday,
} from "date-fns";
import { StarRating } from "../components/StarRating";

export function PlannerPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<{
    id: Id<"scheduledMeals">;
    recipeName: string;
    recipeId: Id<"recipes">;
  } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [completionRating, setCompletionRating] = useState<number | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const scheduledMeals = useQuery(api.scheduledMeals.listByDateRange, {
    startDate: weekStart.getTime(),
    endDate: weekEnd.getTime(),
  });

  const recipes = useQuery(api.recipes.list);
  const markCompleted = useMutation(api.scheduledMeals.markCompleted);
  const removeMeal = useMutation(api.scheduledMeals.remove);
  const scheduleMeal = useMutation(api.scheduledMeals.schedule);

  const getMealsForDay = (day: Date) => {
    return scheduledMeals?.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (meal: any) =>
        isSameDay(new Date(meal.scheduledFor), day)
    );
  };

  const handleComplete = async () => {
    if (!selectedMeal) return;
    await markCompleted({
      id: selectedMeal.id,
      addToHistory: true,
      historyRating: completionRating ?? undefined,
      historyNotes: completionNotes || undefined,
    });
    setSelectedMeal(null);
    setCompletionRating(null);
    setCompletionNotes("");
  };

  const handleDelete = async (id: Id<"scheduledMeals">) => {
    await removeMeal({ id });
    setSelectedMeal(null);
  };

  const handleAddMeal = async (recipeId: Id<"recipes">) => {
    if (!selectedDate) return;
    await scheduleMeal({
      recipeId,
      scheduledFor: selectedDate.getTime(),
    });
    setShowAddModal(false);
    setSelectedDate(null);
  };

  return (
    <div className="p-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-900">
          {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </h2>
        <button
          onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Week Grid */}
      <div className="space-y-3">
        {days.map((day) => {
          const meals = getMealsForDay(day);
          const dayIsToday = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`bg-white rounded-xl border ${
                dayIsToday ? "border-primary-300 ring-1 ring-primary-100" : "border-gray-100"
              } overflow-hidden`}
            >
              {/* Day Header */}
              <div
                className={`px-4 py-2 flex items-center justify-between ${
                  dayIsToday ? "bg-primary-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      dayIsToday ? "text-primary-700" : "text-gray-700"
                    }`}
                  >
                    {format(day, "EEEE")}
                  </span>
                  <span className="text-sm text-gray-500">
                    {format(day, "MMM d")}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedDate(day);
                    setShowAddModal(true);
                  }}
                  className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Meals */}
              <div className="p-3">
                {(!meals || meals.length === 0) && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    No meals planned
                  </p>
                )}

                {meals && meals.length > 0 && (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {meals.map((meal: any) => (
                      <button
                        key={meal._id}
                        onClick={() =>
                          setSelectedMeal({
                            id: meal._id,
                            recipeName: meal.recipe?.name ?? "Unknown",
                            recipeId: meal.recipeId,
                          })
                        }
                        className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                          meal.completed
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        {meal.recipe?.imageUrl ? (
                          <img
                            src={meal.recipe.imageUrl}
                            alt={meal.recipe.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <UtensilsCrossed className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <span
                          className={`font-medium text-left flex-1 ${
                            meal.completed ? "line-through" : ""
                          }`}
                        >
                          {meal.recipe?.name ?? "Unknown Recipe"}
                        </span>
                        {meal.completed && (
                          <Check className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Detail Modal */}
      {selectedMeal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={() => setSelectedMeal(null)}
        >
          <div 
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedMeal.recipeName}</h3>
              <button
                onClick={() => setSelectedMeal(null)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate this cooking
                </label>
                <StarRating
                  rating={completionRating}
                  onChange={setCompletionRating}
                  size="lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="Any notes..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleComplete}
                  className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  Mark Cooked
                </button>
                <button
                  onClick={() => handleDelete(selectedMeal.id)}
                  className="py-3 px-4 bg-red-100 text-red-600 font-semibold rounded-lg hover:bg-red-200"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Meal Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
          onClick={() => { setShowAddModal(false); setSelectedDate(null); }}
        >
          <div 
            className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[80vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Add meal for {selectedDate && format(selectedDate, "MMM d")}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedDate(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {recipes && recipes.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No recipes yet. Add some recipes first!
                </p>
              )}

              {recipes && recipes.length > 0 && (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recipes.map((recipe: any) => (
                    <button
                      key={recipe._id}
                      onClick={() => handleAddMeal(recipe._id)}
                      className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      {recipe.imageUrl ? (
                        <img
                          src={recipe.imageUrl}
                          alt={recipe.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                          <UtensilsCrossed className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {recipe.name}
                        </p>
                        {recipe.rating && (
                          <StarRating
                            rating={recipe.rating}
                            size="sm"
                            readonly
                          />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
