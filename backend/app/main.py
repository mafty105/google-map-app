"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    logger.info("Starting Family Weekend Planner backend...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"GCP Project: {settings.google_cloud_project_id}")

    yield

    # Shutdown
    logger.info("Shutting down Family Weekend Planner backend...")


# Create FastAPI application
app = FastAPI(
    title="Family Weekend Planner API",
    description="AI-powered conversational assistant for planning family weekend outings",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.environment,
        "version": "1.0.0",
    }


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Family Weekend Planner API",
        "docs": "/docs",
        "health": "/health",
    }
