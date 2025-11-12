/**
 * ChatMessage - Individual message bubble component
 * Based on IKYU Design Guideline
 */

interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

export default function ChatMessage({ message, isUser }: ChatMessageProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`
          max-w-[70%] px-4 py-3
          ${isUser
            ? 'bg-[--color-primary-blue] text-white rounded-[18px_18px_4px_18px]'
            : 'bg-[--color-gray-100] text-[--color-gray-800] rounded-[18px_18px_18px_4px]'
          }
        `}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {message}
        </p>
      </div>
    </div>
  );
}
