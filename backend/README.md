# Family Weekend Planner - Backend

FastAPI backend server with Vertex AI and Google Maps integration.

## Tech Stack

- **Python**: 3.11+
- **Framework**: FastAPI
- **Package Manager**: uv
- **Type Checking**: mypy
- **Code Formatting**: black, ruff
- **AI Integration**: Google Vertex AI (Gemini)
- **Maps Integration**: Google Maps Platform APIs

## Setup

### Prerequisites

1. **Install uv** (modern Python package manager):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Python 3.11+** (uv will handle this if not installed)

### Installation

1. **Install dependencies with uv**:
   ```bash
   cd backend
   uv pip install -e ".[dev]"
   ```

   Or create a virtual environment:
   ```bash
   uv venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   uv pip install -e ".[dev]"
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in your values:
   - `GOOGLE_CLOUD_PROJECT_ID`: Your GCP project ID (tech-verification-265409)
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account JSON
   - `GOOGLE_MAPS_API_KEY`: Your Google Maps API key

3. **Set up GCP Service Account**:
   - Go to https://console.cloud.google.com/iam-admin/serviceaccounts
   - Create a service account with roles:
     - Vertex AI User
     - Service Account Token Creator
   - Download JSON key and save to `./config/service-account-key.json`

## Development

### Run the server

```bash
# Using Python directly
python run.py

# Or using uvicorn
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000

### Available Endpoints

- **API Docs**: http://localhost:8000/docs (Interactive Swagger UI)
- **Root**: http://localhost:8000/ (API information)
- **Health**: http://localhost:8000/health (Simple health check)
- **Status**: http://localhost:8000/status (Detailed status and configuration)

### Features

**Request Logging**
- All requests are automatically logged with method, path, and duration
- Response time is added to headers as `X-Process-Time`
- Useful for monitoring and debugging

**Error Handling**
- Global exception handler catches all unhandled errors
- Returns consistent error responses with details
- Errors are logged with full stack traces

**CORS Support**
- Configured for frontend access
- Allows credentials and all methods
- Configurable via `CORS_ORIGINS` environment variable

### Type Checking

```bash
mypy app
```

### Code Formatting

```bash
# Format with black
black app

# Lint with ruff
ruff check app

# Auto-fix with ruff
ruff check --fix app
```

### Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_main.py

# Run with verbose output
pytest -v
```

View coverage report at `htmlcov/index.html` after running with `--cov-report=html`.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Settings and configuration
│   ├── routes/              # API endpoints
│   ├── services/            # Business logic
│   │   ├── vertex_ai.py     # Vertex AI integration
│   │   ├── maps.py          # Google Maps API
│   │   └── conversation.py  # Conversation management
│   ├── models/              # Pydantic models
│   └── utils/               # Utilities
├── config/
│   └── service-account-key.json  # GCP credentials (gitignored)
├── tests/                   # Test files
├── pyproject.toml           # Project metadata and dependencies
├── .env                     # Environment variables (gitignored)
├── .env.example             # Environment template
└── run.py                   # Development server runner
```

## API Endpoints

See the interactive API docs at http://localhost:8000/docs when the server is running.

### Available Endpoints

**Core Endpoints:**
- `GET /` - Root endpoint with API information
- `GET /health` - Simple health check (for load balancers)
- `GET /status` - Detailed status with configuration info
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /openapi.json` - OpenAPI schema

**API Endpoints (to be implemented):**
- `POST /api/chat/session` - Create new chat session
- `POST /api/chat` - Send chat message
- `POST /api/plan/generate` - Generate travel plan
- `POST /api/plan/refine` - Refine existing plan
- More endpoints will be added as development progresses

## Environment Variables

See `.env.example` for all available configuration options.
