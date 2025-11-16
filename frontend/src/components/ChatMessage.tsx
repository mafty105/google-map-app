import RichPlacesDisplay from './RichPlacesDisplay';
import type { EnrichedPlace } from '../services/api';

/**
 * ChatMessage - Individual message bubble component with timestamp
 * Atlassian-inspired design with usability focus
 * Supports rich content (enriched places) for assistant messages
 */

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  enrichedPlaces?: EnrichedPlace[];
  onPlaceClick?: (placeId: string) => void;
}

// Format timestamp to show time (HH:MM)
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ChatMessage({
  message,
  isUser,
  timestamp,
  enrichedPlaces,
  onPlaceClick,
}: ChatMessageProps) {
  const hasRichContent = !isUser && enrichedPlaces && enrichedPlaces.length > 0;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}
    >
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${hasRichContent ? 'max-w-full' : 'max-w-[70%]'}`}>
        <div
          className={`
          ${hasRichContent ? 'w-full' : 'px-4 py-3'}
          transition-all duration-200
          ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm hover:shadow-md'
              : hasRichContent
              ? ''
              : 'bg-gray-200 text-slate-900 rounded-2xl rounded-bl-sm hover:shadow-sm'
          }
        `}
        >
          {/* Text content */}
          {message && (
            <p className={`text-base leading-relaxed whitespace-pre-wrap ${hasRichContent ? '' : ''}`}>
              {message}
            </p>
          )}

          {/* Rich content (places) */}
          {hasRichContent && onPlaceClick && (
            <RichPlacesDisplay
              places={enrichedPlaces}
              onPlaceClick={onPlaceClick}
            />
          )}
        </div>
        <span className="text-xs text-gray-500 mt-1 px-2">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
