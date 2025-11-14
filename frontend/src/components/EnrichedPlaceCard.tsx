import type { EnrichedPlace } from '../services/api';

interface EnrichedPlaceCardProps {
  place: EnrichedPlace;
  onClick?: (placeId: string) => void;
}

/**
 * EnrichedPlaceCard - Displays enriched place information with photo
 */
export default function EnrichedPlaceCard({ place, onClick }: EnrichedPlaceCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(place.place_id);
    }
  };

  const handleViewOnGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      '_blank'
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* Place Photo */}
      {place.photo_url && (
        <div className="w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={place.photo_url}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Place Information */}
      <div className="p-4">
        {/* Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{place.name}</h3>

        {/* Rating */}
        {place.rating && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-yellow-400"
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
              <span className="text-sm text-gray-500">
                ({place.user_ratings_total.toLocaleString()}件)
              </span>
            )}
          </div>
        )}

        {/* Address */}
        {place.formatted_address && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            <svg
              className="w-4 h-4 inline-block mr-1 text-gray-400"
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

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              ウェブサイト
            </a>
          )}
          <button
            onClick={handleViewOnGoogleMaps}
            className="flex-1 px-3 py-2 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Google Maps
          </button>
        </div>

        {/* Phone */}
        {place.phone && (
          <p className="text-sm text-gray-600 mt-3">
            <svg
              className="w-4 h-4 inline-block mr-1 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {place.phone}
          </p>
        )}
      </div>
    </div>
  );
}
