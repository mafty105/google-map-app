"""Tests for main API endpoints."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    """Test root endpoint returns API information."""
    response = client.get("/")
    assert response.status_code == 200


def test_health_check() -> None:
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_status_endpoint() -> None:
    """Test status endpoint includes session count."""
    response = client.get("/status")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "operational"
    assert "active_sessions" in data
    assert isinstance(data["active_sessions"], int)
