"""In-memory session storage for conversation states."""

import uuid
from datetime import datetime, timedelta
from typing import Dict

from app.config import settings
from app.models.conversation import ConversationSession


class SessionStore:
    """In-memory storage for conversation sessions."""

    def __init__(self) -> None:
        """Initialize the session store."""
        self._sessions: Dict[str, ConversationSession] = {}

    def create_session(self) -> ConversationSession:
        """Create a new conversation session."""
        session_id = str(uuid.uuid4())
        session = ConversationSession(session_id=session_id)
        self._sessions[session_id] = session
        return session

    def get_session(self, session_id: str) -> ConversationSession | None:
        """Get a session by ID."""
        return self._sessions.get(session_id)

    def update_session(self, session: ConversationSession) -> None:
        """Update an existing session."""
        session.last_updated = datetime.now()
        self._sessions[session.session_id] = session

    def delete_session(self, session_id: str) -> None:
        """Delete a session."""
        if session_id in self._sessions:
            del self._sessions[session_id]

    def cleanup_expired_sessions(self) -> int:
        """Remove sessions that have expired."""
        timeout_minutes = settings.session_timeout_minutes
        cutoff_time = datetime.now() - timedelta(minutes=timeout_minutes)

        expired_sessions = [
            session_id
            for session_id, session in self._sessions.items()
            if session.last_updated < cutoff_time
        ]

        for session_id in expired_sessions:
            del self._sessions[session_id]

        return len(expired_sessions)

    def get_session_count(self) -> int:
        """Get the total number of active sessions."""
        return len(self._sessions)


# Global session store instance
session_store = SessionStore()
