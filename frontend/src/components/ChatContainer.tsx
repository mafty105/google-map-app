import { useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import QuickReplies from './QuickReplies';
import MapDisplay from './MapDisplay';
import PlanSummary from './PlanSummary';
import type { TravelPlan } from '../types/plan';
import { mockPlan } from '../data/mockPlan';
import { useSession } from '../hooks/useSession';
import { useChat } from '../hooks/useChat';

interface Location {
  lat: number;
  lng: number;
  name?: string;
}

/**
 * ChatContainer - Main chat interface component
 * Manages conversation state and API communication
 */
export default function ChatContainer() {
  const { sessionId, loading: sessionLoading, error: sessionError } = useSession();
  const {
    messages,
    quickReplies,
    isLoading,
    error: chatError,
    currentPlan,
    sendMessage,
    addGreeting,
  } = useChat(sessionId);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map state
  const [mapCenter, setMapCenter] = useState<Location>({
    lat: 35.6812,
    lng: 139.7671,
    name: 'Tokyo Station',
  });
  const [mapMarkers, setMapMarkers] = useState<Location[]>([]);
  const [mapRoutes, setMapRoutes] = useState<Location[][]>([]);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add initial greeting when session is ready
  useEffect(() => {
    if (sessionId && messages.length === 0) {
      addGreeting(
        'こんにちは！週末のお出かけプランをお手伝いします。\nどこからお出かけされますか？',
      );
    }
  }, [sessionId, messages.length, addGreeting]);

  // Combine errors from session and chat
  const error = sessionError || chatError;

  // Handle quick reply click
  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  // Handle plan actions
  const handleConfirmPlan = () => {
    alert('プランが確定されました！');
    // TODO: Send confirmation to backend
  };

  const handleModifyPlan = () => {
    setCurrentPlan(null);
    setMessages((prev) => [
      ...prev,
      {
        text: 'プランを修正します。どの部分を変更したいですか？',
        isUser: false,
      },
    ]);
  };

  const handleStartOver = () => {
    setCurrentPlan(null);
    setMessages([
      {
        text: 'こんにちは！週末のお出かけプランをお手伝いします。\nどこからお出かけされますか？',
        isUser: false,
      },
    ]);
    setQuickReplies([]);
  };

  const handlePlaceClick = (activityId: string) => {
    console.log('Place clicked:', activityId);
    // TODO: Highlight place on map or show details
  };

  // Demo: Load mock plan (for testing)
  const loadMockPlan = () => {
    setCurrentPlan(mockPlan);
    setMessages((prev) => [
      ...prev,
      {
        text: 'デモプランを生成しました！以下の内容をご確認ください。',
        isUser: false,
      },
    ]);

    // Update map with plan data
    if (mockPlan.route) {
      setMapRoutes([mockPlan.route]);
    }
    // Extract place markers from activities
    const markers = mockPlan.activities
      .filter((a) => a.place)
      .map((a) => ({
        lat: a.place!.location.lat,
        lng: a.place!.location.lng,
        name: a.place!.name,
      }));
    setMapMarkers(markers);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[--color-gray-200] bg-white">
        <div className="w-full px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[--color-primary-blue]">
              週末お出かけプランナー
            </h1>
            <p className="text-sm text-[--color-gray-500] mt-1">
              家族で楽しめる週末のお出かけプランを提案します
            </p>
          </div>
          {/* Demo Button */}
          <button
            onClick={loadMockPlan}
            className="px-4 py-2 text-sm bg-[--color-accent-blue] text-white rounded-lg hover:bg-[#0077c5] transition-colors"
          >
            デモプラン表示
          </button>
        </div>
      </header>

      {/* Main Content: Chat + Map */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col border-r border-[--color-gray-200]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-6 py-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Messages */}
              {messages.map((msg, index) => (
                <ChatMessage key={index} message={msg.text} isUser={msg.isUser} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-[--color-gray-100] px-4 py-3 rounded-[18px_18px_18px_4px]">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-[--color-gray-500] rounded-full animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-[--color-gray-500] rounded-full animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-[--color-gray-500] rounded-full animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plan Display */}
              {currentPlan && (
                <div className="mb-6">
                  <PlanSummary
                    plan={currentPlan}
                    onConfirm={handleConfirmPlan}
                    onModify={handleModifyPlan}
                    onStartOver={handleStartOver}
                    onPlaceClick={handlePlaceClick}
                  />
                </div>
              )}

              {/* Quick Replies */}
              {!isLoading && !currentPlan && quickReplies.length > 0 && (
                <QuickReplies replies={quickReplies} onReplyClick={handleQuickReply} />
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isLoading || sessionLoading || !sessionId}
          />
        </div>

        {/* Map Panel */}
        <div className="w-1/2 bg-gray-50">
          <MapDisplay center={mapCenter} markers={mapMarkers} routes={mapRoutes} />
        </div>
      </div>
    </div>
  );
}
