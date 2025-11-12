import { useState, FormEvent, KeyboardEvent } from 'react';

/**
 * ChatInput - Message input component with send button
 * Based on IKYU Design Guideline
 */

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[--color-gray-200] bg-white">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-3 items-end">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="メッセージを入力..."
            rows={1}
            className="
              flex-1
              px-4 py-3
              border border-[--color-gray-300]
              rounded-lg
              text-base
              resize-none
              focus:outline-none
              focus:border-[--color-accent-blue]
              disabled:bg-gray-50 disabled:cursor-not-allowed
              placeholder:text-[--color-gray-500]
            "
          />
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="
              px-6 py-3
              bg-[--color-primary-blue]
              text-white
              rounded-lg
              font-medium
              transition-colors
              hover:bg-[#0f2d4f]
              disabled:bg-gray-300
              disabled:cursor-not-allowed
              active:scale-95
            "
          >
            送信
          </button>
        </div>
      </div>
    </form>
  );
}
