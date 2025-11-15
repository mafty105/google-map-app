"""Conversation state management and transitions."""

import logging

from app.models.conversation import ConversationSession, ConversationState
from app.services.session_store import session_store

logger = logging.getLogger(__name__)


class ConversationManager:
    """Manages conversation flow and state transitions."""

    def __init__(self) -> None:
        """Initialize the conversation manager."""
        self.store = session_store

    def create_session(self) -> ConversationSession:
        """Create a new conversation session."""
        session = self.store.create_session()
        logger.info(f"Created new session: {session.session_id}")
        return session

    def get_session(self, session_id: str) -> ConversationSession | None:
        """Get an existing session."""
        return self.store.get_session(session_id)

    def add_user_message(self, session_id: str, message: str) -> ConversationSession | None:
        """Add a user message to the conversation."""
        session = self.store.get_session(session_id)
        if not session:
            logger.warning(f"Session not found: {session_id}")
            return None

        session.add_message("user", message)
        self.store.update_session(session)
        return session

    def add_assistant_message(
        self, session_id: str, message: str
    ) -> ConversationSession | None:
        """Add an assistant message to the conversation."""
        session = self.store.get_session(session_id)
        if not session:
            logger.warning(f"Session not found: {session_id}")
            return None

        session.add_message("assistant", message)
        self.store.update_session(session)
        return session

    def transition_state(
        self, session_id: str, new_state: ConversationState
    ) -> ConversationSession | None:
        """Transition to a new conversation state."""
        session = self.store.get_session(session_id)
        if not session:
            logger.warning(f"Session not found: {session_id}")
            return None

        old_state = session.state
        session.update_state(new_state)
        self.store.update_session(session)

        logger.info(f"Session {session_id}: {old_state} -> {new_state}")
        return session

    def update_preferences(
        self, session_id: str, **preferences: str | int | list[str]
    ) -> ConversationSession | None:
        """Update user preferences in the session."""
        session = self.store.get_session(session_id)
        if not session:
            logger.warning(f"Session not found: {session_id}")
            return None

        # Update preferences
        for key, value in preferences.items():
            if hasattr(session.user_preferences, key):
                setattr(session.user_preferences, key, value)

        self.store.update_session(session)
        logger.info(f"Updated preferences for session {session_id}: {preferences}")
        return session

    def has_sufficient_preferences(self, session: ConversationSession) -> bool:
        """
        Check if we have enough preferences to generate a plan.

        Minimum requirements:
        - Location (explicit or current location)
        - Basic activity intent (can be inferred)

        Recommended (will ask if missing):
        - Child age (if children mentioned)
        - Transportation
        - Travel time
        """
        prefs = session.user_preferences

        # Must have location
        has_location = bool(prefs.location.address)

        # Must have at least some intent (activity type or travel time)
        has_intent = bool(prefs.activity_type) or prefs.travel_time is not None

        return has_location and has_intent

    def get_critical_missing_info(self, session: ConversationSession) -> list[str]:
        """
        Get list of critical missing information needed for plan generation.

        Critical = absolutely required, no defaults available
        Optional = nice to have, but we can generate a plan without it

        Returns:
            List of missing critical info keys in priority order
        """
        prefs = session.user_preferences
        missing = []

        # Location is the ONLY truly critical piece - we can't generate without it
        if not prefs.location.address:
            missing.append("location")

        # Everything else is optional:
        # - transportation: defaults to "public" if not specified
        # - travel_time: defaults to 60 minutes if not specified
        # - activity_type: defaults to "家族向け" if not specified
        # - child_age: only needed if children explicitly mentioned
        # - meals: defaults to empty list

        # Child age is semi-critical if children are explicitly involved
        if not prefs.child_age and (
            prefs.activity_type and any(word in (prefs.activity_type or "").lower()
                for word in ["子", "child", "kid", "family", "家族"])
        ):
            missing.append("child_age")

        return missing

    def get_next_question(self, session: ConversationSession) -> str | None:
        """Determine the next clarifying question to ask."""
        prefs = session.user_preferences

        # Check what's missing and ask in order
        if not prefs.location.address:
            return None  # Need location first (from initial message)

        if not prefs.travel_time:
            return None  # Should be extracted from initial message

        if not prefs.activity_type:
            return "アクティブな場所をお探しですか、それともインドアの施設がよいですか?"

        if not prefs.meals:
            return "昼食や夕食はお取りになりますか?"

        # All basic preferences collected
        return None

    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions."""
        count = self.store.cleanup_expired_sessions()
        if count > 0:
            logger.info(f"Cleaned up {count} expired sessions")
        return count


# Global conversation manager instance
conversation_manager = ConversationManager()
