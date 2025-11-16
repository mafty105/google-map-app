import type { EnrichedPlace } from '../services/api';

interface InlinePlaceCardProps {
  place: EnrichedPlace;
  index: number;
  onClick: (placeId: string) => void;
}

/**
 * InlinePlaceCard - Rich place preview for chat messages
 * Compact card with photo, name, rating that can be clicked for details
 */
export default function InlinePlaceCard({ place, index, onClick }: InlinePlaceCardProps) {
  const handleClick = () => {
    onClick(place.place_id);
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-400 transition-all cursor-pointer overflow-hidden w-full"
      onClick={handleClick}
    >
      {/* Photo */}
      <div className="relative">
        {place.photo_url ? (
          <div className="w-full h-32 bg-gray-100">
            <img
              src={place.photo_url}
              alt={place.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-blue-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
        )}
        {/* Number badge */}
        <div className="absolute top-2 left-2 bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
          {index}
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Name */}
        <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
          {place.name}
        </h4>

        {/* Rating */}
        {place.rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-yellow-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-1 text-sm font-semibold text-gray-700">
                {place.rating.toFixed(1)}
              </span>
            </div>
            {place.user_ratings_total && (
              <span className="text-xs text-gray-500">
                ({place.user_ratings_total > 999 ? `${Math.floor(place.user_ratings_total / 1000)}k` : place.user_ratings_total})
              </span>
            )}
          </div>
        )}

        {/* LLM Description or Types */}
        {place.llm_description ? (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {place.llm_description}
          </p>
        ) : place.types && place.types.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {place.types.slice(0, 2).map((type, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
              >
                {type.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* View Details Button */}
        <button
          className="w-full mt-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
          onClick={handleClick}
        >
          <span>詳細を見る</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
