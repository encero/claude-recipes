import { Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import { StarRating } from "./StarRating";
import { Id } from "../../convex/_generated/dataModel";

interface RecipeCardProps {
  id: Id<"recipes">;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  onClick?: () => void;
}

export function RecipeCard({
  id,
  name,
  description,
  imageUrl,
  rating,
  onClick,
}: RecipeCardProps) {
  const content = (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-[4/3] bg-gray-100 relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <UtensilsCrossed className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 truncate">{name}</h3>
        {description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>
        )}
        {rating && (
          <div className="mt-2">
            <StarRating rating={rating} size="sm" readonly />
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left">
        {content}
      </button>
    );
  }

  return <Link to={`/recipe/${id}`}>{content}</Link>;
}
