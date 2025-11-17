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
  isStreaming?: boolean;
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
  isStreaming,
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
              {/* Streaming cursor */}
              {isStreaming && (
                <span className="inline-block ml-1 w-2 h-4 bg-blue-600 animate-pulse"></span>
              )}
            </p>
          )}

          {/* Empty streaming placeholder */}
          {!message && isStreaming && (
            <div className="flex gap-1">
              <div
                className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                style={{ animationDelay: '150ms' }}
              ></div>
              <div
                className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"
                style={{ animationDelay: '300ms' }}
              ></div>
            </div>
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
