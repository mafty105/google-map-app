/**
 * Hook for managing chat session
 */

import { useEffect, useState } from 'react';
import { chatAPI } from '../services/api';

const SESSION_STORAGE_KEY = 'chat_session_id';

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize or restore session
   */
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try to restore from localStorage
        const storedSessionId = localStorage.getItem(SESSION_STORAGE_KEY);

        if (storedSessionId) {
          // Verify session is still valid
          try {
            await chatAPI.getSessionHistory(storedSessionId);
            setSessionId(storedSessionId);
            setLoading(false);
            return;
          } catch {
            // Session expired or invalid, create new one
            localStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }

        // Create new session
        const response = await chatAPI.createSession();
        setSessionId(response.session_id);
        localStorage.setItem(SESSION_STORAGE_KEY, response.session_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  /**
   * Clear current session and create new one
   */
  const clearSession = async () => {
    setLoading(true);
    setError(null);

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      const response = await chatAPI.createSession();
      setSessionId(response.session_id);
      localStorage.setItem(SESSION_STORAGE_KEY, response.session_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return {
    sessionId,
    loading,
    error,
    clearSession,
  };
}
