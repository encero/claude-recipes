import { Link } from "react-router-dom";
import { UtensilsCrossed, CalendarDays } from "lucide-react";
import { StarRating } from "./StarRating";
import { format, isToday, isTomorrow } from "date-fns";
import type { Id } from "../../convex/_generated/dataModel";

interface RecipeCardProps {
  id: Id<"recipes">;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  scheduledFor?: number;
  onClick?: () => void;
}

function formatScheduledDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

export function RecipeCard({
  id,
  name,
  description,
  imageUrl,
  rating,
  scheduledFor,
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

        {/* Scheduled Badge */}
        {scheduledFor && (
          <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {formatScheduledDate(scheduledFor)}
          </div>
        )}

        {/* Rating Badge */}
        {rating && (
          <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
            <StarRating rating={rating} size="sm" readonly />
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
