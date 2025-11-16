/**
 * Hook for managing chat messages and communication
 */

import { useState, useCallback } from 'react';
import { chatAPI, type ChatResponse, type EnrichedPlace, type RouteInfo } from '../services/api';

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
  const [enrichedPlaces, setEnrichedPlaces] = useState<EnrichedPlace[]>([]);
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [originLocation, setOriginLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);

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

      try {
        const response = await chatAPI.sendMessage(sessionId, messageText);

        // Determine what message to show
        let displayText = response.response;

        // If we have enriched places, show a simple message instead of the full plan description
        if (response.enriched_places && response.enriched_places.length > 0) {
          displayText = `${response.enriched_places.length}件のおすすめスポットを見つけました。詳細は下のリストから各スポットをクリックしてご確認ください。`;
        }

        // Add assistant response
        const assistantMessage: Message = {
          text: displayText,
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

        // Update enriched places if provided
        // Append new places to existing ones (for "show more" functionality)
        if (response.enriched_places && response.enriched_places.length > 0) {
          setEnrichedPlaces((prev) => [...prev, ...(response.enriched_places || [])]);
        }

        // Update routes if provided
        if (response.routes && response.routes.length > 0) {
          setRoutes(response.routes);
        }

        // Update origin location if provided
        if (response.origin_location) {
          setOriginLocation(response.origin_location);
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
