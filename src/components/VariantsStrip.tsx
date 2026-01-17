import { Check, Loader2, AlertCircle, Plus } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export interface ImageVariant {
  _id: Id<"recipeImages">;
  imageUrl: string | null;
  prompt: string;
  status: "generating" | "completed" | "failed";
  isAccepted: boolean;
}

interface VariantsStripProps {
  variants: ImageVariant[];
  selectedId: Id<"recipeImages"> | null;
  onSelect: (variant: ImageVariant) => void;
  onUploadClick: () => void;
}

export function VariantsStrip({
  variants,
  selectedId,
  onSelect,
  onUploadClick,
}: VariantsStripProps) {
  return (
    <div className="relative">
      <div
        className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {variants.map((variant) => (
          <button
            key={variant._id}
            onClick={() => onSelect(variant)}
            className={`relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all ${
              selectedId === variant._id
                ? "border-primary-500 ring-2 ring-primary-500/30"
                : variant.isAccepted
                  ? "border-green-500"
                  : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {variant.status === "generating" ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
              </div>
            ) : variant.status === "failed" ? (
              <div className="w-full h-full bg-red-50 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
            ) : variant.imageUrl ? (
              <img
                src={variant.imageUrl}
                alt={variant.prompt}
                className="w-full h-full object-cover"
              />
            ) : null}

            {/* Active badge */}
            {variant.isAccepted && variant.status === "completed" && (
              <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}

        {/* Upload card */}
        <button
          onClick={onUploadClick}
          className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Upload</span>
        </button>
      </div>
    </div>
  );
}
