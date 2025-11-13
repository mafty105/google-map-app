import type { Restaurant } from '../types/plan';

interface RestaurantCardProps {
  restaurant: Restaurant;
  onViewOnMap?: () => void;
}

/**
 * RestaurantCard - Display restaurant information in card format
 * Based on IKYU Design Guideline
 */
export default function RestaurantCard({ restaurant, onViewOnMap }: RestaurantCardProps) {
  const handleViewOnGoogleMaps = () => {
    if (restaurant.placeId) {
      window.open(
        `https://www.google.com/maps/place/?q=place_id:${restaurant.placeId}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`,
        '_blank'
      );
    }
  };

  return (
    <div className="bg-white rounded-lg border border-[--color-gray-200] overflow-hidden hover:shadow-md transition-shadow">
      {/* Restaurant Photo */}
      {restaurant.photoUrl && (
        <div className="w-full h-48 overflow-hidden bg-gray-100">
          <img
            src={restaurant.photoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Restaurant Info */}
      <div className="p-4">
        {/* Cuisine Type Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-2 py-1 text-xs bg-[--color-secondary-gold] text-white rounded">
            🍽️ {restaurant.cuisine || 'レストラン'}
          </span>
          {restaurant.priceRange && (
            <span className="text-sm font-medium text-[--color-gray-600]">
              {restaurant.priceRange}
            </span>
          )}
        </div>

        {/* Restaurant Name */}
        <h3 className="text-lg font-bold text-[--color-gray-800] mb-2">
          {restaurant.name}
        </h3>

        {/* Rating */}
        {restaurant.rating && (
          <div className="flex items-center gap-1 mb-2">
            <span className="text-yellow-500">★</span>
            <span className="text-sm font-medium text-[--color-gray-800]">
              {restaurant.rating}
            </span>
            <span className="text-sm text-[--color-gray-500]">/ 5.0</span>
          </div>
        )}

        {/* Address */}
        {restaurant.address && (
          <p className="text-xs text-[--color-gray-500] mb-3 flex items-start gap-1">
            <span>📍</span>
            <span>{restaurant.address}</span>
          </p>
        )}

        {/* Opening Hours */}
        {restaurant.openingHours && (
          <p className="text-xs text-[--color-gray-500] mb-3 flex items-center gap-1">
            <span>🕐</span>
            <span>{restaurant.openingHours}</span>
          </p>
        )}

        {/* Features */}
        <div className="flex flex-wrap gap-2 mb-3">
          {restaurant.kidFriendly && (
            <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              👶 子供向け
            </span>
          )}
          {restaurant.kidsMenu && (
            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
              📖 子供メニューあり
            </span>
          )}
        </div>

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
