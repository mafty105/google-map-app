"""Application configuration using Pydantic settings."""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server Configuration
    port: int = 8000
    host: str = "0.0.0.0"
    environment: str = "development"

    # Google Cloud Platform
    google_cloud_project_id: str
    google_cloud_location: str = "us-central1"
    google_application_credentials: str

    # Google Maps API
    google_maps_api_key: str

    # Vertex AI
    vertex_ai_model: str = "gemini-1.5-pro"
    vertex_ai_temperature: float = 0.7
    vertex_ai_max_output_tokens: int = 2048

    # Session Management
    session_timeout_minutes: int = 30
    session_cleanup_interval_minutes: int = 10

    # CORS Configuration
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Logging
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",")]


# Global settings instance
settings = Settings()
