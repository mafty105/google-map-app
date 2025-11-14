/**
 * Hook for managing chat messages and communication
 */

import { useState, useCallback } from 'react';
import { chatAPI, type ChatResponse } from '../services/api';

export interface Message {
  text: string;
  isUser: boolean;
  timestamp: string;
}

export function useChat(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<unknown | null>(null);

  /**
   * Send a message to the backend
   */
  const sendMessage = useCallback(
    async (messageText: string): Promise<ChatResponse | null> => {
      if (!sessionId || !messageText.trim()) {
        return null;
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

      try:
        const response = await chatAPI.sendMessage(sessionId, messageText);

        // Add assistant response
        const assistantMessage: Message = {
          text: response.response,
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update quick replies
        if (response.quick_replies && response.quick_replies.length > 0) {
          setQuickReplies(response.quick_replies);
        }

        // Update plan if provided
        if (response.plan) {
          setCurrentPlan(response.plan);
        }

        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        return null;
      } finally {
        setIsLoading(false);
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
    sendMessage,
    clearMessages,
    addGreeting,
  };
}
