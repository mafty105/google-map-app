import { useEffect, useState } from 'react';
import type { EnrichedPlace } from '../services/api';
import CompactRestaurantCard from './CompactRestaurantCard';

interface PlaceDrawerProps {
  place: EnrichedPlace;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (placeId: string, placeName: string, lat: number, lng: number) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  childAge?: number | null;
  originLocation?: { lat: number; lng: number; address?: string } | null;
}

/**
 * PlaceDrawer - Detailed place information drawer
 * Shows on right side (desktop) or bottom (mobile)
 */
export default function PlaceDrawer({
  place,
  isOpen,
  onClose,
  onNavigate,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  childAge = null,
  originLocation = null,
}: PlaceDrawerProps) {
  // Mounting state for animation
  const [isMounted, setIsMounted] = useState(false);

  // Nearby restaurants state
  const [showRestaurants, setShowRestaurants] = useState(false);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [restaurantError, setRestaurantError] = useState<string | null>(null);

  // Handle mounting/unmounting for animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger CSS transition
      const timer = setTimeout(() => setIsMounted(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsMounted(false);
    }
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset restaurant state when drawer closes OR when place changes
  useEffect(() => {
    if (!isOpen) {
      setShowRestaurants(false);
      setRestaurants([]);
      setRestaurantError(null);
    }
  }, [isOpen]);

  // Reset restaurant state when place changes
  useEffect(() => {
    setShowRestaurants(false);
    setRestaurants([]);
    setRestaurantError(null);
  }, [place.place_id]);

  // Function to load nearby restaurants
  const handleLoadRestaurants = async () => {
    setIsLoadingRestaurants(true);
    setRestaurantError(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const childAgeParam = childAge !== null ? `&child_age=${childAge}` : '';
      const response = await fetch(
        `${backendUrl}/api/places/nearby-restaurants?place_id=${place.place_id}&radius=1000&max_results=3${childAgeParam}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch restaurants');
      }

      const data = await response.json();
      setRestaurants(data.restaurants || []);
      setShowRestaurants(true);
    } catch (error) {
      console.error('Error loading restaurants:', error);
      setRestaurantError('飲食店の読み込みに失敗しました');
    } finally {
      setIsLoadingRestaurants(false);
    }
  };

  // Don't render if not open (keep in DOM during closing animation)
  if (!isOpen && !isMounted) return null;

  // Simple markdown to HTML conversion
  const renderMarkdown = (text?: string) => {
    if (!text) return null;

    return (
      <div className="prose prose-sm max-w-none">
        {text.split('\n').map((line, index) => {
          // Headers
          if (line.startsWith('###')) {
            return (
              <h3 key={index} className="text-lg font-bold text-gray-900 mt-4 mb-2">
                {line.replace(/^###\s*/, '')}
              </h3>
            );
          }
          if (line.startsWith('##')) {
            return (
              <h2 key={index} className="text-xl font-bold text-gray-900 mt-4 mb-2">
                {line.replace(/^##\s*/, '')}
              </h2>
            );
          }

          // Bullet points
          if (line.trim().startsWith('-')) {
            const content = line.replace(/^-\s*/, '');
            // Bold text
            const withBold = content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            return (
              <li
                key={index}
                className="ml-4 text-gray-700"
                dangerouslySetInnerHTML={{ __html: withBold }}
              />
            );
          }

          // Empty lines
          if (line.trim() === '') {
            return <br key={index} />;
          }

          // Regular text with bold
          const withBold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
          return (
            <p
              key={index}
              className="text-gray-700 my-1"
              dangerouslySetInnerHTML={{ __html: withBold }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div
        className={`
          fixed z-50 bg-white shadow-2xl overflow-hidden
          md:top-0 md:right-0 md:h-full md:w-2/5
          max-md:bottom-0 max-md:left-0 max-md:right-0 max-md:h-4/5 max-md:rounded-t-2xl
          transform transition-transform duration-300 ease-in-out
          ${isMounted ? 'translate-x-0 translate-y-0' : 'md:translate-x-full max-md:translate-y-full'}
        `}
      >
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-gray-900 truncate pr-4">
            {place.name}
          </h2>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-full pb-32">
          {/* Photo */}
          {place.photo_url && (
            <div className="w-full h-64 bg-gray-100">
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

          <div className="px-6 py-6 space-y-6">
            {/* Rating */}
            {place.rating && (
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="ml-2 text-lg font-semibold text-gray-800">
                    {place.rating.toFixed(1)}
                  </span>
                </div>
                {place.user_ratings_total && (
                  <span className="text-sm text-gray-500">
                    ({place.user_ratings_total.toLocaleString()}件の評価)
                  </span>
                )}
              </div>
            )}

            {/* Address */}
            {place.formatted_address && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">住所</h3>
                <p className="text-gray-800 flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5"
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
              </div>
            )}

            {/* Phone */}
            {place.phone && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2">電話番号</h3>
                <a
                  href={`tel:${place.phone}`}
                  className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
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
                </a>
              </div>
            )}

            {/* Action Buttons - Two Row Layout */}
            <div className="space-y-3">
              {/* Row 1: Primary Navigate Button */}
              {onNavigate && (
                <button
                  onClick={() => onNavigate(place.place_id, place.name, place.location.lat, place.location.lng)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  aria-label="ここへ行く"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span>ここへ行く</span>
                </button>
              )}

              {/* Row 2: Secondary Buttons */}
              <div className="flex gap-3">
                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    <span>ウェブサイト</span>
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors text-center flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Google Maps</span>
                </a>
              </div>
            </div>

            {/* LLM Description */}
            {place.llm_description && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">詳細情報</h3>
                {renderMarkdown(place.llm_description)}
              </div>
            )}

            {/* Reviews */}
            {place.reviews && place.reviews.length > 0 && (
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  口コミ ({place.reviews.length}件)
                </h3>
                <div className="space-y-4">
                  {place.reviews.map((review, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-sm">
                            {review.author_name}
                          </span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {review.relative_time_description}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nearby Restaurants Section */}
            <div className="border-t border-gray-200 pt-6">
              {!showRestaurants ? (
                <button
                  onClick={handleLoadRestaurants}
                  disabled={isLoadingRestaurants}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {isLoadingRestaurants ? '読み込み中...' : '周辺の子ども向け飲食店を見る'}
                </button>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-semibold text-gray-800">
                      周辺の子ども向け飲食店 ({restaurants.length}件)
                    </h3>
                    <button
                      onClick={() => setShowRestaurants(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      閉じる
                    </button>
                  </div>

                  {restaurantError ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700">{restaurantError}</p>
                    </div>
                  ) : restaurants.length > 0 ? (
                    <div className="space-y-2">
                      {restaurants.map((restaurant) => (
                        <CompactRestaurantCard key={restaurant.place_id} restaurant={restaurant} />
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-600 text-center">
                        周辺に子ども向け飲食店が見つかりませんでした
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Navigation Buttons */}
        {(hasPrevious || hasNext) && (
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                hasPrevious
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              ← 前のスポット
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                hasNext
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              次のスポット →
            </button>
          </div>
        )}
      </div>
  );
}
