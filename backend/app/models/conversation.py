"""Conversation state models."""

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ConversationState(str, Enum):
    """Conversation state enum."""

    INITIAL = "INITIAL"
    GATHERING_PREFERENCES = "GATHERING_PREFERENCES"
    GENERATING_PLAN = "GENERATING_PLAN"
    PRESENTING_PLAN = "PRESENTING_PLAN"
    REFINING = "REFINING"
    COMPLETED = "COMPLETED"


class Location(BaseModel):
    """Location information."""

    address: str = ""
    lat: float | None = None
    lng: float | None = None


class TravelTime(BaseModel):
    """Travel time preferences."""

    value: int  # in minutes
    unit: str = "minutes"
    direction: str = "one-way"  # or "round-trip"


class UserPreferences(BaseModel):
    """User preferences for the outing plan."""

    location: Location = Field(default_factory=Location)
    travel_time: TravelTime | None = None
    activity_type: str | None = None  # "active/outdoor" or "indoor"
    meals: list[str] = Field(default_factory=list)  # ["lunch", "dinner"]
    child_age: str | None = None
    transportation: str | None = None  # "car", "public", "walking"
    special_requirements: list[str] = Field(default_factory=list)
    shown_place_ids: list[str] = Field(default_factory=list)  # Track shown place IDs to avoid duplicates
    spots_request_count: int = 0  # Number of additional spot requests (0, 1, 2)


class ChatMessage(BaseModel):
    """A single message in the conversation."""

    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ConversationSession(BaseModel):
    """Complete conversation session state."""

    session_id: str
    state: ConversationState = ConversationState.INITIAL
    user_preferences: UserPreferences = Field(default_factory=UserPreferences)
    conversation_history: list[ChatMessage] = Field(default_factory=list)
    generated_plan: dict[str, Any] | None = None
    created_at: datetime = Field(default_factory=datetime.now)
    last_updated: datetime = Field(default_factory=datetime.now)

    def add_message(self, role: str, content: str) -> None:
        """Add a message to the conversation history."""
        message = ChatMessage(role=role, content=content)
        self.conversation_history.append(message)
        self.last_updated = datetime.now()

    def update_state(self, new_state: ConversationState) -> None:
        """Update the conversation state."""
        self.state = new_state
        self.last_updated = datetime.now()
