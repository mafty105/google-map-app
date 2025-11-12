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

- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

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
pytest
```

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

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /api/chat/session` - Create new chat session (to be implemented)
- `POST /api/chat` - Send chat message (to be implemented)
- More endpoints will be added as development progresses

## Environment Variables

See `.env.example` for all available configuration options.
