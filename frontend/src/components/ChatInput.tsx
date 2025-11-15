import { type FormEvent, type KeyboardEvent, useState } from 'react';

/**
 * ChatInput - Message input component with send button
 * Atlassian-inspired design with usability focus
 */

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  onUseCurrentLocation?: () => void;
}

export default function ChatInput({ onSendMessage, disabled = false, onUseCurrentLocation }: ChatInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locationText = `現在地（緯度: ${lat.toFixed(6)}, 経度: ${lng.toFixed(6)}）`;
          setMessage(locationText);
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('現在地の取得に失敗しました。位置情報の許可を確認してください。');
        }
      );
    } else {
      alert('このブラウザは位置情報に対応していません。');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enterで送信、Enterのみは改行（IME変換中も含む）
    if (e.key === 'Enter' && e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
    }
  };

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4">
      {onUseCurrentLocation && (
        <div className="mb-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={disabled}
            className="px-4 py-2 bg-white border-2 border-blue-500 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            現在地を使う
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex gap-3 items-end">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="出発地を入力してください（例: 渋谷駅、東京都港区六本木...）"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg resize-none min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors"
          rows={2}
        />
        <button
          type="submit"
          disabled={!message.trim() || disabled}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 font-medium active:scale-95"
        >
          送信
        </button>
      </form>
    </div>
  );
}
