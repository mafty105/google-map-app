"""Tests for main API endpoints."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint() -> None:
    """Test root endpoint returns API information."""
    response = client.get("/")
    assert response.status_code == 200

    data = response.json()
    assert data["message"] == "Family Weekend Planner API"
    assert data["version"] == "1.0.0"
    assert "docs" in data
    assert "health" in data
    assert "status" in data


def test_health_check() -> None:
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "family-weekend-planner"


def test_status_endpoint() -> None:
    """Test detailed status endpoint."""
    response = client.get("/status")
    assert response.status_code == 200

    data = response.json()
    assert data["status"] == "operational"
    assert data["version"] == "1.0.0"
    assert "environment" in data
    assert "config" in data
    assert "endpoints" in data

    # Check config structure
    config = data["config"]
    assert "gcp_project" in config
    assert "gcp_location" in config
    assert "vertex_ai_model" in config
    assert config["cors_enabled"] is True


def test_request_logging_header() -> None:
    """Test that request logging adds process time header."""
    response = client.get("/health")
    assert response.status_code == 200

    # Check that process time header is added
    assert "x-process-time" in response.headers
    process_time = float(response.headers["x-process-time"])
    assert process_time >= 0


def test_cors_headers() -> None:
    """Test CORS headers are present."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        }
    )

    # CORS headers should be present
    assert "access-control-allow-origin" in response.headers


def test_api_docs_available() -> None:
    """Test that OpenAPI docs are available."""
    response = client.get("/docs")
    assert response.status_code == 200

    response = client.get("/openapi.json")
    assert response.status_code == 200

    data = response.json()
    assert data["info"]["title"] == "Family Weekend Planner API"
    assert data["info"]["version"] == "1.0.0"
