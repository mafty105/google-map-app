"""Tests for chat API endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_create_session() -> None:
    """Test creating a new session."""
    response = client.post("/api/chat/session")
    assert response.status_code == 200

    data = response.json()
    assert "session_id" in data
    assert data["message"] == "Session created successfully"


def test_send_message() -> None:
    """Test sending a message."""
    # Create session first
    session_response = client.post("/api/chat/session")
    session_id = session_response.json()["session_id"]

    # Send message
    response = client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "週末片道1時間くらいでいける候補"}
    )
    assert response.status_code == 200

    data = response.json()
    assert data["session_id"] == session_id
    assert "response" in data
    assert "state" in data


def test_get_session_history() -> None:
    """Test getting session history."""
    # Create session
    session_response = client.post("/api/chat/session")
    session_id = session_response.json()["session_id"]

    # Send a message
    client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "Hello"}
    )

    # Get history
    response = client.get(f"/api/chat/session/{session_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["session_id"] == session_id
    assert "messages" in data
    assert len(data["messages"]) >= 2  # greeting + user message + response


def test_send_message_invalid_session() -> None:
    """Test sending message with invalid session ID."""
    response = client.post(
        "/api/chat",
        json={"session_id": "invalid-id", "message": "Hello"}
    )
    assert response.status_code == 404
