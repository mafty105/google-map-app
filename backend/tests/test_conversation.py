"""Tests for conversation management."""

from app.models.conversation import ConversationState
from app.services.conversation_manager import ConversationManager


def test_create_session() -> None:
    """Test creating a new conversation session."""
    manager = ConversationManager()
    session = manager.create_session()

    assert session.session_id is not None
    assert session.state == ConversationState.INITIAL
    assert len(session.conversation_history) == 0


def test_add_messages() -> None:
    """Test adding messages to a session."""
    manager = ConversationManager()
    session = manager.create_session()

    manager.add_user_message(session.session_id, "Hello")
    manager.add_assistant_message(session.session_id, "Hi there!")

    updated_session = manager.get_session(session.session_id)
    assert updated_session is not None
    assert len(updated_session.conversation_history) == 2
    assert updated_session.conversation_history[0].role == "user"
    assert updated_session.conversation_history[1].role == "assistant"


def test_state_transition() -> None:
    """Test transitioning conversation state."""
    manager = ConversationManager()
    session = manager.create_session()

    manager.transition_state(session.session_id, ConversationState.GATHERING_PREFERENCES)

    updated_session = manager.get_session(session.session_id)
    assert updated_session is not None
    assert updated_session.state == ConversationState.GATHERING_PREFERENCES


def test_update_preferences() -> None:
    """Test updating user preferences."""
    manager = ConversationManager()
    session = manager.create_session()

    manager.update_preferences(session.session_id, activity_type="active/outdoor")

    updated_session = manager.get_session(session.session_id)
    assert updated_session is not None
    assert updated_session.user_preferences.activity_type == "active/outdoor"
