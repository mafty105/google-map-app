"""Integration tests for full conversation flow.

Following TESTING_POLICY.md:
- Main cases only (happy path)
- Simple tests with minimal assertions
- No edge cases or error scenarios
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_full_conversation_flow() -> None:
    """Test the complete conversation flow from start to plan generation.

    This test follows the main happy path:
    1. Create session
    2. User provides preferences
    3. System generates plan with Vertex AI
    """
    # Step 1: Create a new session
    session_response = client.post("/api/chat/session")
    assert session_response.status_code == 200

    session_id = session_response.json()["session_id"]

    # Step 2: Send first message (should trigger preference gathering)
    response1 = client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "週末に子供と遊びに行きたいです"}
    )
    assert response1.status_code == 200
    assert "response" in response1.json()

    # Step 3: Provide activity type
    response2 = client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "アクティブ"}
    )
    assert response2.status_code == 200

    # Step 4: Provide meal preference (triggers plan generation)
    response3 = client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "とる"}
    )
    assert response3.status_code == 200

    # Verify state transitioned to GENERATING_PLAN or PRESENTING_PLAN
    # (GENERATING_PLAN in test env without credentials, PRESENTING_PLAN in production)
    final_response = response3.json()
    assert final_response["state"] in ["GENERATING_PLAN", "PRESENTING_PLAN"]
    assert "response" in final_response  # Should have some response


def test_session_history_tracking() -> None:
    """Test that conversation history is properly tracked."""
    # Create session
    session_response = client.post("/api/chat/session")
    session_id = session_response.json()["session_id"]

    # Send multiple messages
    client.post("/api/chat", json={"session_id": session_id, "message": "Hello"})
    client.post("/api/chat", json={"session_id": session_id, "message": "アクティブ"})

    # Get history
    history_response = client.get(f"/api/chat/session/{session_id}")
    assert history_response.status_code == 200

    history = history_response.json()
    assert len(history["messages"]) >= 5  # greeting + 2 user msgs + 2 assistant msgs


def test_state_transitions() -> None:
    """Test that conversation states transition correctly."""
    # Create session (starts in INITIAL)
    session_response = client.post("/api/chat/session")
    session_id = session_response.json()["session_id"]

    # First message transitions to GATHERING_PREFERENCES
    response = client.post(
        "/api/chat",
        json={"session_id": session_id, "message": "遊びに行きたい"}
    )
    assert response.json()["state"] == "GATHERING_PREFERENCES"
