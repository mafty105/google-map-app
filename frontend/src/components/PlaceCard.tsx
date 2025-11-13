import type { Place } from '../types/plan';

interface PlaceCardProps {
  place: Place;
  onViewOnMap?: () => void;
}

/**
 * PlaceCard - Display place information in card format
 * Based on IKYU Design Guideline
 */
export default function PlaceCard({ place, onViewOnMap }: PlaceCardProps) {
  const handleViewOnGoogleMaps = () => {
    if (place.placeId) {
      window.open(
        `https://www.google.com/maps/place/?q=place_id:${place.placeId}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`,
        '_blank'
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[--color-gray-200] overflow-hidden hover:shadow-md transition-shadow">
      {/* Place Photo */}
      {place.photoUrl && (
        <div className="w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={place.photoUrl}
            alt={place.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Place Info */}
      <div className="p-4">
        {/* Category Badge */}
        {place.category && (
          <span className="inline-block px-2 py-1 text-xs bg-[--color-light-blue] text-white rounded mb-2">
            {place.category}
          </span>
        )}

        {/* Place Name */}
        <h3 className="text-lg font-bold text-[--color-gray-800] mb-2">{place.name}</h3>

        {/* Rating */}
        {place.rating && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium text-[--color-gray-800]">{place.rating}</span>
            <span className="text-sm text-[--color-gray-500]">/ 5.0</span>
          </div>
        )}

        {/* Description */}
        {place.description && (
          <p className="text-sm text-[--color-gray-600] mb-3 line-clamp-2">{place.description}</p>
        )}

        {/* Address */}
        {place.address && (
          <p className="text-xs text-[--color-gray-500] mb-3 flex items-start gap-1">
            <span>📍</span>
            <span>{place.address}</span>
          </p>
        )}

        {/* Opening Hours */}
        {place.openingHours && (
          <p className="text-xs text-[--color-gray-500] mb-3 flex items-center gap-1">
            <span>🕐</span>
            <span>{place.openingHours}</span>
          </p>
        )}

        {/* Kid Friendly Badge */}
        {place.kidFriendly && (
          <div className="mb-3">
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              👶 子供向け
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          {onViewOnMap && (
            <button
              onClick={onViewOnMap}
              className="flex-1 px-4 py-2 bg-[--color-primary-blue] text-white text-sm font-medium rounded-lg hover:bg-[#0f2d4f] transition-colors"
            >
              地図で表示
            </button>
          )}
          <button
            onClick={handleViewOnGoogleMaps}
            className="flex-1 px-4 py-2 bg-white border border-[--color-gray-300] text-[--color-gray-800] text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Google Mapsで開く
          </button>
        </div>
      </div>
    </div>
  );
}
