import InlinePlaceCard from './InlinePlaceCard';
import type { EnrichedPlace } from '../services/api';

interface RichPlacesDisplayProps {
  places: EnrichedPlace[];
  onPlaceClick: (placeId: string) => void;
}

/**
 * RichPlacesDisplay - Grid display of enriched places within chat messages
 * Shows a visually appealing grid of place cards directly in the conversation
 */
export default function RichPlacesDisplay({ places, onPlaceClick }: RichPlacesDisplayProps) {
  if (!places || places.length === 0) {
    return null;
  }

  return (
    <div className="my-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex-shrink-0 w-1 h-6 bg-blue-600 rounded-full"></div>
        <h3 className="text-sm font-bold text-gray-800">
          おすすめスポット {places.length}件
        </h3>
      </div>

      {/* Horizontal scrollable list */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {places.map((place, index) => (
          <div key={place.place_id} className="flex-shrink-0" style={{ width: '320px' }}>
            <InlinePlaceCard
              place={place}
              index={index + 1}
              onClick={onPlaceClick}
            />
          </div>
        ))}
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        📍 カードをクリックすると詳細情報が表示されます
      </p>
    </div>
  );
}
