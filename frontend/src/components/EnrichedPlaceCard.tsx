import type { EnrichedPlace } from '../services/api';

interface EnrichedPlaceCardProps {
  place: EnrichedPlace;
  onClick?: (placeId: string) => void;
}

/**
 * EnrichedPlaceCard - Compact list view for places
 */
export default function EnrichedPlaceCard({ place, onClick }: EnrichedPlaceCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(place.place_id);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer overflow-hidden"
      onClick={handleClick}
    >
      <div className="flex gap-4 p-4">
        {/* Thumbnail Photo */}
        <div className="flex-shrink-0">
          {place.photo_url ? (
            <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
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
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-gray-400"
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
        </div>

        {/* Place Info */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="text-base font-bold text-gray-900 truncate mb-1">
            {place.name}
          </h3>

          {/* Rating */}
          {place.rating && (
            <div className="flex items-center gap-2 mb-1">
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
                  ({place.user_ratings_total.toLocaleString()}件)
                </span>
              )}
            </div>
          )}

          {/* Address */}
          {place.formatted_address && (
            <p className="text-sm text-gray-600 truncate">
              <svg
                className="w-3 h-3 inline-block mr-1 text-gray-400"
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
              {place.formatted_address}
            </p>
          )}
        </div>

        {/* Arrow Icon */}
        <div className="flex-shrink-0 flex items-center">
          <svg
            className="w-6 h-6 text-gray-400"
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
        </div>
      </div>
    </div>
  );
}
