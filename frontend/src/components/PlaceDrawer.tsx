import { useEffect, useState } from 'react';
import type { EnrichedPlace } from '../services/api';

interface PlaceDrawerProps {
  place: EnrichedPlace;
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (placeId: string, placeName: string, lat: number, lng: number) => void;
  navigating?: boolean;
  navigationError?: string | null;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
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
  navigating = false,
  navigationError = null,
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
}: PlaceDrawerProps) {
  // Mounting state for animation
  const [isMounted, setIsMounted] = useState(false);

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
                  disabled={navigating}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  aria-label="ここへ行く"
                >
                  {navigating ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>ルートを検索中...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span>ここへ行く</span>
                    </>
                  )}
                </button>
              )}

              {/* Navigation Error Message */}
              {navigationError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{navigationError}</p>
                </div>
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
