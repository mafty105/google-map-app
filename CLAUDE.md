# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is a **tech verification project** to evaluate **Google Maps grounding** capabilities in Vertex AI (Gemini). The goal is to build a working conversational AI app that plans family weekend outings in Japan, then write a blog article about the experience. Speed and functionality matter more than production-grade polish.

**Key focus:** Testing how well Google Maps grounding works for:
- Location suggestions in Japanese
- Accuracy of real-world places
- Quality of travel recommendations
- Natural language understanding for locations

## Architecture Overview

### System Design

```
┌─────────────┐
│  React      │  ← Chat UI, Maps display
│  Frontend   │    (Port 5173)
└──────┬──────┘
       │ fetch API
       ▼
┌─────────────┐
│  FastAPI    │  ← Session management, AI orchestration
│  Backend    │    (Port 8000)
└──────┬──────┘
       │
       ├──→ Vertex AI (Gemini 1.5 Pro) + Google Maps Grounding
       └──→ Google Maps Platform APIs (Geocoding, Places, Directions)
```

### Conversation Flow States

The app manages a multi-turn conversation with 6 states:

1. **INITIAL** - User's first request
2. **GATHERING_PREFERENCES** - Ask clarifying questions (activity type, meals, child age, etc.)
3. **GENERATING_PLAN** - Call Vertex AI with Maps grounding
4. **PRESENTING_PLAN** - Show map, schedule, destinations
5. **REFINING** - User requests changes
6. **COMPLETED** - Final confirmation

### Data Structure

```javascript
conversationState = {
  sessionId: "uuid",
  state: "GATHERING_PREFERENCES",
  userPreferences: {
    location: { address: "Tokyo Station", lat: 35.6812, lng: 139.7671 },
    travelTime: { value: 60, unit: "minutes", direction: "one-way" },
    activityType: "active/outdoor",
    meals: ["lunch"],
    childAge: null,
    transportation: null
  },
  conversationHistory: [...],
  generatedPlan: null
}
```

## Development Commands

### Backend (Python + FastAPI)

```bash
cd backend

# Setup (first time)
uv pip install -e ".[dev]"

# Run development server
python run.py                    # Port 8000

# Testing
pytest                           # Run all tests
pytest tests/test_main.py        # Run specific file
pytest -v                        # Verbose output

# Code quality
mypy app                         # Type checking
ruff check app                   # Linting
ruff check --fix app             # Auto-fix
black app                        # Format code
```

### Frontend (React + Vite)

```bash
cd frontend

# Setup (first time)
npm install

# Run development server
npm run dev                      # Port 5173

# Build
npm run build                    # Production build
npm run preview                  # Preview build

# Code quality
npm run lint                     # ESLint
```

## Testing Philosophy

**Read TESTING_POLICY.md** - This is crucial!

Key points:
- **Main cases only** (happy path)
- **No edge cases** or error scenarios
- **Simple tests** - one assertion is often enough
- **30-50% coverage is fine**
- Skip testing: middleware, utilities, error handlers

Example:
```python
def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
```

## Development Workflow

### Branch & PR Strategy

**Always use branches and PRs:**

1. Create branch: `feature/issue-N-description`
2. Make changes in branch
3. Commit and push branch
4. Create PR to `main`
5. Wait for review/merge

**Never commit directly to main.**

### Creating Issues for User Tasks

If there are manual steps required (GCP setup, API keys, etc.), create a new issue for the user to complete. Don't block development on manual tasks.

## Configuration

### Backend Environment Variables

Create `backend/.env`:
```bash
GOOGLE_CLOUD_PROJECT_ID=tech-verification-265409
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./config/service-account-key.json
GOOGLE_MAPS_API_KEY=<backend-api-key>
```

All settings are managed via `backend/app/config.py` using Pydantic.

### Frontend Environment Variables

Create `frontend/.env`:
```bash
VITE_BACKEND_URL=http://localhost:8000
VITE_GOOGLE_MAPS_API_KEY=<frontend-api-key>
```

**Important:** Frontend and backend need **separate** API keys with different restrictions.

## Tech Stack Details

### Backend
- **Python 3.11+** with strict type hints
- **FastAPI** - async web framework
- **uv** - modern package manager
- **Pydantic v2** - settings and validation
- **mypy** - strict type checking
- **ruff + black** - linting and formatting

### Frontend
- **React 18** - UI library
- **Vite** - build tool (fast HMR)
- **Native fetch API** - no axios
- **@googlemaps/js-api-loader** - Maps integration

## Key Integration Points

### Vertex AI with Google Maps Grounding

This is the **core feature being verified**:

```python
response = await vertex_ai.generate_content({
    "model": "gemini-1.5-pro",
    "prompt": prompt,
    "tools": [{"googleMaps": {}}],  # ← Grounding enabled
    "generationConfig": {
        "temperature": 0.7,
        "maxOutputTokens": 2048
    }
})
```

When grounding is enabled:
- Gemini uses real Google Maps data
- Returns actual place IDs and coordinates
- Provides citations with map links
- Reduces hallucination of non-existent places

### Google Maps Platform APIs

Used for additional data:
- **Geocoding API** - Address → coordinates
- **Places API** - Details, photos, ratings
- **Directions API** - Routes and travel times
- **Distance Matrix API** - Multiple destination filtering

## API Endpoints

### Current Endpoints
- `GET /` - API info
- `GET /health` - Health check
- `GET /status` - Detailed status
- `GET /docs` - Swagger UI

### To Be Implemented
- `POST /api/chat/session` - Create chat session
- `POST /api/chat` - Send message
- `POST /api/plan/generate` - Generate plan
- `POST /api/plan/refine` - Refine plan

## Important Files

**Project Documentation:**
- [PROJECT_SPECIFICATION.md](./PROJECT_SPECIFICATION.md) - Complete project spec (v2.0)
- [GCP_SETUP_GUIDE.md](./GCP_SETUP_GUIDE.md) - Manual API setup instructions
- [TESTING_POLICY.md](./TESTING_POLICY.md) - Testing guidelines (READ THIS!)
- [DESIGN_GUIDELINE.md](./DESIGN_GUIDELINE.md) - Visual design system (IKYU-based, for frontend)

**Backend Key Files:**
- [backend/README.md](./backend/README.md) - Backend setup and usage
- [backend/app/config.py](./backend/app/config.py) - All configuration settings
- [backend/app/main.py](./backend/app/main.py) - FastAPI app with middleware
- [backend/app/models/conversation.py](./backend/app/models/conversation.py) - Conversation state models
- [backend/app/services/conversation_manager.py](./backend/app/services/conversation_manager.py) - Conversation logic
- [backend/app/routes/chat.py](./backend/app/routes/chat.py) - Chat API endpoints

**Frontend Key Files:**
- [frontend/README.md](./frontend/README.md) - Frontend setup and usage
- [frontend/src/App.jsx](./frontend/src/App.jsx) - Main React component
- [frontend/vite.config.js](./frontend/vite.config.js) - Vite configuration

## Common Patterns

### Adding a New Backend Endpoint

1. Create route in `backend/app/routes/`
2. Add service logic in `backend/app/services/`
3. Define Pydantic models in `backend/app/models/`
4. Write simple test in `backend/tests/`
5. Update API docs (auto-generated by FastAPI)

### Adding a New Frontend Component

**Important:** Follow DESIGN_GUIDELINE.md for all visual design

1. Create component in `frontend/src/components/`
2. Import in parent component
3. Use native fetch for API calls
4. Apply IKYU-based design system:
   - Colors: Primary blue (#1a4473), Accent blue (#008dde)
   - Typography: Hiragino, Noto Sans JP
   - Spacing: 8px grid system
   - Japanese language support
5. Keep it simple - this is a demo

## GCP Project

**Project ID:** `tech-verification-265409`
**Location:** `us-central1`

Required APIs (must be enabled manually):
- Vertex AI API
- Maps JavaScript API
- Geocoding API
- Places API
- Directions API
- Distance Matrix API

## Notes for Blog Article

When working on this project, keep in mind it's for a blog article about:
1. How well does Google Maps grounding work?
2. Quality of Japanese location suggestions
3. Accuracy vs hallucination rates
4. Practical usefulness for real-world apps

Document interesting findings, surprises, or limitations during development.
