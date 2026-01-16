import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number | null | undefined;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
}

export function StarRating({
  rating,
  onChange,
  size = "md",
  readonly = false,
}: StarRatingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex gap-0.5">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && onChange?.(star)}
          disabled={readonly}
          className={`${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"} transition-transform disabled:hover:scale-100`}
        >
          <Star
            className={`${sizeClasses[size]} ${
              (rating ?? 0) >= star
                ? "fill-amber-400 text-amber-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
