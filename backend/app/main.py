"""Main FastAPI application."""

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routes import chat
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


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests and their processing time."""
    start_time = time.time()

    # Log request
    logger.info(f"Request: {request.method} {request.url.path}")

    # Process request
    response = await call_next(request)

    # Log response time
    process_time = time.time() - start_time
    logger.info(
        f"Completed: {request.method} {request.url.path} "
        f"Status: {response.status_code} "
        f"Duration: {process_time:.3f}s"
    )

    # Add process time header
    response.headers["X-Process-Time"] = str(process_time)

    return response


# Include routers
app.include_router(chat.router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all uncaught exceptions."""
    logger.error(
        f"Unhandled exception: {exc}",
        exc_info=True,
        extra={
            "method": request.method,
            "url": str(request.url),
        }
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "path": str(request.url.path),
        }
    )


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for load balancers and monitoring."""
    return {
        "status": "healthy",
        "service": "family-weekend-planner",
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
    """Root endpoint with API information."""
    return {
        "message": "Family Weekend Planner API",
        "description": "AI-powered conversational assistant for planning family weekend outings",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "status": "/status",
    }
