import { useState } from 'react';

interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: string;
}

interface CompactRestaurantCardProps {
  restaurant: {
    place_id: string;
    name: string;
    rating?: number;
    user_ratings_total?: number;
    price_level?: number;
    vicinity?: string;
    photo_url?: string;
    summary?: string;
    reviews?: Review[];
    types?: string[];
  };
}

export default function CompactRestaurantCard({ restaurant }: CompactRestaurantCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Convert price level to Japanese currency symbols
  const getPriceDisplay = (priceLevel?: number): string => {
    if (priceLevel === undefined || priceLevel === null) return '';
    return '¥'.repeat(Math.max(1, priceLevel));
  };

  // Get restaurant type in Japanese
  const getRestaurantType = (types?: string[]): string => {
    if (!types || types.length === 0) return 'レストラン';

    const typeMap: { [key: string]: string } = {
      'cafe': 'カフェ',
      'bakery': 'ベーカリー',
      'restaurant': 'レストラン',
      'meal_takeaway': 'テイクアウト',
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return 'レストラン';
  };

  // Extract child-friendly reasons from reviews
  const getChildFriendlyReasons = (reviews?: Review[]): string[] => {
    if (!reviews || reviews.length === 0) return [];

    const reasons: string[] = [];
    const keywords = {
      'キッズ': '子ども向けメニューあり',
      'こども': '子ども向けメニューあり',
      '子供': '子ども向けメニューあり',
      '子ども': '子ども向けメニューあり',
      'ファミリー': '家族連れに人気',
      '家族': '家族連れに人気',
      '広い': '広々とした店内',
      'ベビーカー': 'ベビーカーOK',
    };

    const foundReasons = new Set<string>();

    reviews.forEach(review => {
      Object.entries(keywords).forEach(([keyword, reason]) => {
        if (review.text && review.text.includes(keyword)) {
          foundReasons.add(reason);
        }
      });
    });

    return Array.from(foundReasons).slice(0, 3);
  };

  const childFriendlyReasons = getChildFriendlyReasons(restaurant.reviews);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Clickable Header */}
      <div
        className="flex gap-3 p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Photo (small) */}
        <div className="w-16 h-16 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
          {restaurant.photo_url ? (
            <img
              src={restaurant.photo_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          )}
        </div>

        {/* Information */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {restaurant.name}
            </h4>
            <span className="text-xs text-gray-500 flex-shrink-0">
              {getRestaurantType(restaurant.types)}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Rating */}
            {restaurant.rating && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs text-gray-700 font-medium">{restaurant.rating.toFixed(1)}</span>
                {restaurant.user_ratings_total && (
                  <span className="text-xs text-gray-500">({restaurant.user_ratings_total})</span>
                )}
              </div>
            )}

            {/* Price Level */}
            {restaurant.price_level !== undefined && restaurant.price_level !== null && (
              <div className="flex items-center">
                <span className="text-xs text-gray-600 font-medium">{getPriceDisplay(restaurant.price_level)}</span>
              </div>
            )}
          </div>

          {/* Child-friendly badges */}
          {childFriendlyReasons.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {childFriendlyReasons.map((reason, idx) => (
                <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex items-center flex-shrink-0">
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-200 mt-2">
          {/* Summary */}
          {restaurant.summary && (
            <div className="mb-3">
              <h5 className="text-xs font-semibold text-gray-700 mb-1">概要</h5>
              <p className="text-xs text-gray-600 leading-relaxed">{restaurant.summary}</p>
            </div>
          )}

          {/* Reviews */}
          {restaurant.reviews && restaurant.reviews.length > 0 && (
            <div>
              <h5 className="text-xs font-semibold text-gray-700 mb-2">口コミ</h5>
              <div className="space-y-2">
                {restaurant.reviews.map((review, idx) => (
                  <div key={idx} className="bg-white p-2 rounded border border-gray-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium text-gray-800">{review.author_name}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{review.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{review.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Google Maps Link */}
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${restaurant.place_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-xs text-blue-600 hover:text-blue-700 font-medium"
            onClick={(e) => e.stopPropagation()}
          >
            Google Mapsで見る →
          </a>
        </div>
      )}
    </div>
  );
}
