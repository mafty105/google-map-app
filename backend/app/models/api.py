"""API request and response models."""

from datetime import datetime

from pydantic import BaseModel, Field


class CreateSessionResponse(BaseModel):
    """Response for creating a new session."""

    session_id: str
    message: str = "Session created successfully"


class ChatMessageRequest(BaseModel):
    """Request for sending a chat message."""

    session_id: str
    message: str = Field(..., min_length=1)


class ChatMessageResponse(BaseModel):
    """Response for a chat message."""

    session_id: str
    response: str
    state: str
    quick_replies: list[str] | None = None


class SessionHistoryResponse(BaseModel):
    """Response for getting session history."""

    session_id: str
    state: str
    messages: list[dict[str, str]]
    created_at: datetime
    last_updated: datetime


class ErrorResponse(BaseModel):
    """Error response model."""

    error: str
    message: str
    details: str | None = None
