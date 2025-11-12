"""Development server runner."""

import uvicorn

from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True if settings.environment == "development" else False,
        log_level=settings.log_level.lower(),
    )
