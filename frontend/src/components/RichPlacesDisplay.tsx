import EnrichedPlaceCard from './EnrichedPlaceCard';
import type { EnrichedPlace } from '../services/api';

interface RichPlacesDisplayProps {
  places: EnrichedPlace[];
  onPlaceClick: (placeId: string) => void;
}

/**
 * RichPlacesDisplay - List display of enriched places within chat messages
 * Shows a compact list of place cards directly in the conversation
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

      {/* Vertical list */}
      <div className="space-y-3">
        {places.map((place) => (
          <EnrichedPlaceCard
            key={place.place_id}
            place={place}
            onClick={onPlaceClick}
          />
        ))}
      </div>

      {/* Helper text */}
      <p className="mt-3 text-xs text-gray-500 text-center">
        📍 カードをクリックすると詳細情報が表示されます
      </p>
    </div>
  );
}
