/**
 * ChatMessage - Individual message bubble component with timestamp
 * Atlassian-inspired design with usability focus
 */

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
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
}: ChatMessageProps) {
  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}
    >
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div
          className={`
          px-4 py-3 transition-all duration-200
          ${
            isUser
              ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm hover:shadow-md'
              : 'bg-gray-200 text-slate-900 rounded-2xl rounded-bl-sm hover:shadow-sm'
          }
        `}
        >
          <p className="text-base leading-relaxed whitespace-pre-wrap">{message}</p>
        </div>
        <span className="text-xs text-gray-500 mt-1 px-2">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
