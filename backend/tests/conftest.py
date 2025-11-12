"""Pytest configuration and fixtures."""

import os
from typing import Generator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session", autouse=True)
def setup_test_env() -> Generator[None, None, None]:
    """Set up test environment variables."""
    # Set test environment variables
    os.environ["GOOGLE_CLOUD_PROJECT_ID"] = "test-project"
    os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "./config/test-credentials.json"
    os.environ["GOOGLE_MAPS_API_KEY"] = "test-api-key"
    os.environ["ENVIRONMENT"] = "test"

    yield

    # Cleanup if needed


@pytest.fixture
def client() -> TestClient:
    """Create a test client for the FastAPI app."""
    from app.main import app

    return TestClient(app)
