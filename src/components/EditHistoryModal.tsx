import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X } from "lucide-react";
import { StarRating } from "./StarRating";

interface EditHistoryModalProps {
  historyId: Id<"cookingHistory"> | null;
  initialNotes?: string;
  initialRating?: number | null;
  onClose: () => void;
}

export function EditHistoryModal({
  historyId,
  initialNotes = "",
  initialRating = null,
  onClose,
}: EditHistoryModalProps) {
  const updateHistory = useMutation(api.cookingHistory.update);
  const [prevHistoryId, setPrevHistoryId] = useState(historyId);
  const [notes, setNotes] = useState(initialNotes);
  const [rating, setRating] = useState<number | null>(initialRating);

  if (historyId !== prevHistoryId) {
    setPrevHistoryId(historyId);
    setNotes(initialNotes);
    setRating(initialRating);
  }

  if (!historyId) return null;

  const handleSave = async () => {
    await updateHistory({
      id: historyId,
      notes: notes || undefined,
      rating: rating ?? undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Edit Cooking Entry</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating
          </label>
          <StarRating rating={rating} onChange={setRating} size="lg" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this cooking..."
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 bg-primary-600 text-white font-semibold rounded-lg"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
