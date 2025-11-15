/**
 * API service for backend communication using native fetch
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

/**
 * API response types
 */
export interface SessionResponse {
  session_id: string;
  message: string;
}

export interface PlaceReview {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
}

export interface EnrichedPlace {
  id: string;
  place_id: string;
  name: string;
  formatted_address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  rating?: number;
  user_ratings_total?: number;
  photo_url?: string;
  opening_hours?: unknown;
  website?: string;
  phone?: string;
  types?: string[];
  reviews?: PlaceReview[];
  llm_description?: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  state: string;
  quick_replies?: string[];
  plan?: unknown; // TravelPlan type from backend
  enriched_places?: EnrichedPlace[];
}

export interface SessionHistoryResponse {
  session_id: string;
  state: string;
  messages: Array<{
    role: string;
    content: string;
    timestamp: string;
  }>;
  created_at: string;
  last_updated: string;
}

/**
 * API Error class
 */
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: unknown,
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BACKEND_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData,
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new APIError(
        'バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。',
      );
    }

    throw new APIError(
      error instanceof Error ? error.message : 'ネットワークエラーが発生しました',
    );
  }
}

/**
 * Chat API methods
 */
export const chatAPI = {
  /**
   * Create a new chat session
   */
  createSession: async (): Promise<SessionResponse> => {
    return fetchAPI<SessionResponse>('/api/chat/session', {
      method: 'POST',
    });
  },

  /**
   * Send a message in the conversation
   */
  sendMessage: async (
    sessionId: string,
    message: string,
  ): Promise<ChatResponse> => {
    return fetchAPI<ChatResponse>('/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        session_id: sessionId,
        message,
      }),
    });
  },

  /**
   * Get conversation history for a session
   */
  getSessionHistory: async (
    sessionId: string,
  ): Promise<SessionHistoryResponse> => {
    return fetchAPI<SessionHistoryResponse>(`/api/chat/session/${sessionId}`);
  },
};

/**
 * Health check
 */
export const healthAPI = {
  /**
   * Check backend health
   */
  check: async (): Promise<{ status: string; service: string }> => {
    return fetchAPI('/health');
  },
};
