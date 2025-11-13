import { useEffect, useRef, useState } from 'react';
import ChatInput from './ChatInput';
import ChatMessage from './ChatMessage';
import QuickReplies from './QuickReplies';
import PlanSummary from './PlanSummary';
import type { TravelPlan } from '../types/plan';
import { mockPlan } from '../data/mockPlan';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

interface Message {
  text: string;
  isUser: boolean;
}

interface ChatResponse {
  session_id: string;
  response: string;
  state: string;
  quick_replies?: string[];
  plan?: TravelPlan; // Plan data from backend
}

interface SessionResponse {
  session_id: string;
}

/**
 * ChatContainer - Main chat interface component
 * Manages conversation state and API communication
 */
export default function ChatContainer() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<TravelPlan | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize session on component mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/chat/session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to create session');
        }

        const data: SessionResponse = await response.json();
        setSessionId(data.session_id);

        // Add initial greeting message
        setMessages([
          {
            text: 'こんにちは！週末のお出かけプランをお手伝いします。\nどこからお出かけされますか？',
            isUser: false,
          },
        ]);
      } catch (err) {
        setError('セッションの開始に失敗しました。ページを再読み込みしてください。');
        console.error('Failed to initialize session:', err);
      }
    };

    initSession();
  }, []);

  // Send message to backend
  const sendMessage = async (messageText: string) => {
    if (!sessionId || !messageText.trim()) return;

    // Add user message to UI immediately
    const userMessage: Message = { text: messageText, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setQuickReplies([]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data: ChatResponse = await response.json();

      // Add assistant response to UI
      const assistantMessage: Message = { text: data.response, isUser: false };
      setMessages((prev) => [...prev, assistantMessage]);

      // Set quick replies if available
      if (data.quick_replies && data.quick_replies.length > 0) {
        setQuickReplies(data.quick_replies);
      }

      // Set plan if available (from backend)
      if (data.plan) {
        setCurrentPlan(data.plan);
      }
    } catch (err) {
      setError('メッセージの送信に失敗しました。もう一度お試しください。');
      console.error('Failed to send message:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[--color-gray-200] bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
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

      {/* Main Content */}
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
      <ChatInput onSendMessage={sendMessage} disabled={isLoading || !sessionId} />
    </div>
  );
}
