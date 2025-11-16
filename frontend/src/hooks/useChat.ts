/**
 * Hook for managing chat messages and communication
 */

import { useState, useCallback, useRef } from 'react';
import { chatAPI, type ChatResponse, type EnrichedPlace, type RouteInfo } from '../services/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
  enrichedPlaces?: EnrichedPlace[];
  isStreaming?: boolean;
  id?: number;
}

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<unknown | null>(null);
  const [enrichedPlaces, setEnrichedPlaces] = useState<EnrichedPlace[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [originLocation, setOriginLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  /**
   * Send a message to the backend with streaming support
   */
  const sendMessage = useCallback(
    async (messageText: string): Promise<ChatResponse | null> => {
      if (!sessionId || !messageText.trim()) {
        return null;
      }

      // Close any existing EventSource
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Add user message immediately
      const userMessage: Message = {
        text: messageText,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setQuickReplies([]);
      setIsLoading(true);
      setError(null);

      // Create placeholder for streaming assistant message
      const assistantMessageId = Date.now();
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: '',
        isUser: false,
        timestamp: new Date().toISOString(),
        isStreaming: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        // Use fetch with streaming for SSE
        const url = `${BACKEND_URL}/api/chat/stream`;
        const response = await fetch(url, {
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
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let accumulatedText = '';

        // Read stream
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk
          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages (separated by \n\n)
          const messages = buffer.split('\n\n');
          buffer = messages.pop() || ''; // Keep incomplete message in buffer

          for (const message of messages) {
            if (message.startsWith('data: ')) {
              const jsonStr = message.slice(6); // Remove 'data: ' prefix
              try {
                const data = JSON.parse(jsonStr);

                if (data.type === 'text') {
                  // Accumulate text chunks
                  accumulatedText += data.content;

                  // Update message with accumulated text
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, text: accumulatedText }
                        : msg
                    )
                  );
                } else if (data.type === 'done') {
                  // Finalize message
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? {
                            ...msg,
                            isStreaming: false,
                            enrichedPlaces: data.enriched_places || undefined,
                          }
                        : msg
                    )
                  );

                  // Update quick replies
                  if (data.quick_replies && data.quick_replies.length > 0) {
                    setQuickReplies(data.quick_replies);
                  }

                  // Update enriched places if provided
                  if (data.enriched_places && data.enriched_places.length > 0) {
                    setEnrichedPlaces((prev) => [...prev, ...(data.enriched_places || [])]);
                  }

                  // Update routes if provided
                  if (data.routes && data.routes.length > 0) {
                    setRoutes(data.routes);
                  }

                  // Update origin location if provided
                  if (data.origin_location) {
                    setOriginLocation(data.origin_location);
                  }

                  setIsLoading(false);
                } else if (data.type === 'error') {
                  setError(data.content);
                  setIsLoading(false);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }

        return null; // Streaming doesn't return ChatResponse directly
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
          )
        );
        setIsLoading(false);
        return null;
      }
    },
    [sessionId],
  );

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setQuickReplies([]);
    setCurrentPlan(null);
    setEnrichedPlaces([]);
    setRoutes([]);
    setOriginLocation(null);
    setError(null);
  }, []);

  /**
   * Add initial greeting message
   */
  const addGreeting = useCallback((greeting: string) => {
    setMessages([
      {
        text: greeting,
        isUser: false,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  return {
    messages,
    quickReplies,
    isLoading,
    error,
    currentPlan,
    enrichedPlaces,
    routes,
    originLocation,
    sendMessage,
    clearMessages,
    addGreeting,
  };
}
