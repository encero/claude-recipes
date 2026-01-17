import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Upload, Calendar } from "lucide-react";
import { StarRating } from "./StarRating";
import type { Id } from "../../convex/_generated/dataModel";

interface RecipeData {
  _id: Id<"recipes">;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeAdded?: (recipeId: Id<"recipes">) => void;
  editRecipe?: RecipeData;
}

export function AddRecipeModal({
  isOpen,
  onClose,
  onRecipeAdded,
  editRecipe,
}: AddRecipeModalProps) {
  const [name, setName] = useState(editRecipe?.name ?? "");
  const [description, setDescription] = useState(editRecipe?.description ?? "");
  const [rating, setRating] = useState<number | null>(editRecipe?.rating ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(editRecipe?.imageUrl ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createRecipe = useMutation(api.recipes.create);
  const updateRecipe = useMutation(api.recipes.update);
  const generateUploadUrl = useMutation(api.recipes.generateUploadUrl);
  const scheduleMeal = useMutation(api.scheduledMeals.schedule);

  const isEditMode = !!editRecipe;

  // Update form when editRecipe changes
  useEffect(() => {
    if (editRecipe) {
      setName(editRecipe.name);
      setDescription(editRecipe.description ?? "");
      setRating(editRecipe.rating ?? null);
      setImagePreview(editRecipe.imageUrl ?? null);
      setImageFile(null);
    }
  }, [editRecipe]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoading(true);
    try {
      let imageId: Id<"_storage"> | undefined;

      if (imageFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": imageFile.type },
          body: imageFile,
        });
        const { storageId } = await response.json();
        imageId = storageId;
      }

      if (isEditMode && editRecipe) {
        await updateRecipe({
          id: editRecipe._id,
          name: name.trim(),
          description: description.trim() || undefined,
          rating: rating ?? undefined,
          ...(imageId && { imageId }),
        });
        onRecipeAdded?.(editRecipe._id);
      } else {
        const recipeId = await createRecipe({
          name: name.trim(),
          description: description.trim() || undefined,
          rating: rating ?? undefined,
          imageId,
        });

        if (showSchedule && scheduleDate) {
          await scheduleMeal({
            recipeId,
            scheduledFor: new Date(scheduleDate).getTime(),
          });
        }

        onRecipeAdded?.(recipeId);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error("Failed to save recipe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setRating(null);
    setImageFile(null);
    setImagePreview(null);
    setShowSchedule(false);
    setScheduleDate("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditMode ? "Edit Recipe" : "Add Recipe"}
          </h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Image Upload */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-gray-50 transition-colors flex flex-col items-center justify-center overflow-hidden"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Tap to add photo
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipe Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Grandma's Chicken Soup"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of the recipe..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating
            </label>
            <StarRating rating={rating} onChange={setRating} size="lg" />
          </div>

          {/* Schedule Option (only for new recipes) */}
          {!isEditMode && (
            <div className="border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => setShowSchedule(!showSchedule)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showSchedule
                    ? "bg-primary-100 text-primary-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Schedule immediately</span>
              </button>

              {showSchedule && (
                <div className="mt-3">
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : isEditMode ? "Save Changes" : "Add Recipe"}
          </button>
        </form>
      </div>
    </div>
  );
}
