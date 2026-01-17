import { useState, useRef, useEffect } from "react";
import {
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Upload,
  Check,
  UtensilsCrossed,
} from "lucide-react";
import { VariantsStrip, type ImageVariant } from "./VariantsStrip";
import type { Id } from "../../convex/_generated/dataModel";

interface Recipe {
  _id: Id<"recipes">;
  name: string;
  imagePrompt?: string;
  imageUrl?: string | null;
  imageGenerationStatus?: "generating" | "completed" | "failed";
}

interface ImageStudioProps {
  recipe: Recipe;
  recipeImages: ImageVariant[] | undefined;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
  onAccept: (imageEntryId: Id<"recipeImages">) => Promise<void>;
}

export function ImageStudio({
  recipe,
  recipeImages,
  isOpen,
  onClose,
  onGenerate,
  onUpload,
  onAccept,
}: ImageStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ImageVariant | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Initialize prompt with recipe name or imagePrompt
  useEffect(() => {
    if (isOpen && recipe) {
      setPrompt(recipe.imagePrompt || recipe.name);
    }
  }, [isOpen, recipe]);

  // Auto-select the first variant when images load
  useEffect(() => {
    if (recipeImages && recipeImages.length > 0 && !selectedVariant) {
      // Select the accepted one, or the first completed one
      const accepted = recipeImages.find((v) => v.isAccepted);
      const firstCompleted = recipeImages.find((v) => v.status === "completed");
      setSelectedVariant(accepted || firstCompleted || recipeImages[0]);
    }
  }, [recipeImages, selectedVariant]);

  // Update selected variant when a generating image completes
  useEffect(() => {
    if (selectedVariant && recipeImages) {
      const updated = recipeImages.find((v) => v._id === selectedVariant._id);
      if (updated && updated.status !== selectedVariant.status) {
        setSelectedVariant(updated);
      }
    }
  }, [recipeImages, selectedVariant]);

  // Auto-select newly generated images
  useEffect(() => {
    if (recipeImages && recipeImages.length > 0) {
      const generating = recipeImages.find((v) => v.status === "generating");
      if (generating) {
        setSelectedVariant(generating);
      }
    }
  }, [recipeImages?.length]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);
    try {
      await onGenerate(prompt.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAccept = async () => {
    if (!selectedVariant || selectedVariant.isAccepted) return;
    try {
      await onAccept(selectedVariant._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set image");
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const variants = recipeImages || [];
  const hasVariants = variants.length > 0;
  const previewVariant = selectedVariant;
  const isPreviewGenerating = previewVariant?.status === "generating";
  const isPreviewFailed = previewVariant?.status === "failed";
  const canAccept =
    previewVariant &&
    previewVariant.status === "completed" &&
    !previewVariant.isAccepted;

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Image Studio</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Preview Area */}
          <div className="aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden relative">
            {!hasVariants && !isGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <UtensilsCrossed className="w-12 h-12 mb-2" />
                <p className="text-sm">No images yet</p>
                <p className="text-xs mt-1">Generate or upload an image below</p>
              </div>
            ) : isPreviewGenerating ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
                <p className="text-sm text-gray-600 mt-3">Creating your image...</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs text-center px-4">
                  "{previewVariant?.prompt}"
                </p>
              </div>
            ) : isPreviewFailed ? (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
                <p className="text-sm text-gray-600 mt-3">Generation failed</p>
                <p className="text-xs text-gray-400 mt-1">Try again with a different prompt</p>
              </div>
            ) : previewVariant?.imageUrl ? (
              <>
                <img
                  src={previewVariant.imageUrl}
                  alt={previewVariant.prompt}
                  className="w-full h-full object-cover"
                />
                {previewVariant.isAccepted && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    Active
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Describe your image..."
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                disabled={isGenerating}
              />
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                <span className="hidden sm:inline">Generate</span>
              </button>
            </div>

            {/* Upload button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2.5 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              Upload Photo
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Variants Strip */}
          {hasVariants && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Variants
              </p>
              <VariantsStrip
                variants={variants}
                selectedId={selectedVariant?._id || null}
                onSelect={setSelectedVariant}
                onUploadClick={() => fileInputRef.current?.click()}
              />
            </div>
          )}
        </div>

        {/* Footer - Set as Active button */}
        {canAccept && (
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={handleAccept}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2 transition-colors"
            >
              <Check className="w-5 h-5" />
              Set as Active
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
