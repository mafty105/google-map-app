"""Main FastAPI application."""

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.conversation_manager import conversation_manager

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def cleanup_sessions_task() -> None:
    """Background task to cleanup expired sessions periodically."""
    while True:
        await asyncio.sleep(settings.session_cleanup_interval_minutes * 60)
        try:
            count = conversation_manager.cleanup_expired_sessions()
            if count > 0:
                logger.info(f"Background cleanup: removed {count} expired sessions")
        except Exception as e:
            logger.error(f"Error in session cleanup task: {e}", exc_info=True)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events."""
    # Startup
    logger.info("Starting Family Weekend Planner backend...")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"GCP Project: {settings.google_cloud_project_id}")

    # Start background cleanup task
    cleanup_task = asyncio.create_task(cleanup_sessions_task())
    logger.info("Started session cleanup background task")

    yield

    # Shutdown
    cleanup_task.cancel()
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


@app.get("/status")
async def status_check() -> dict[str, str | int]:
    """Detailed status endpoint with session info."""
    return {
        "status": "operational",
        "service": "Family Weekend Planner API",
        "version": "1.0.0",
        "environment": settings.environment,
        "active_sessions": conversation_manager.store.get_session_count(),
    }


@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {
        "message": "Family Weekend Planner API",
        "docs": "/docs",
        "health": "/health",
        "status": "/status",
    }
