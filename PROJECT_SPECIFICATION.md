# Family Weekend Outing Planner - Project Specification

## Table of Contents
1. [Project Overview](#project-overview)
2. [Requirements Specification](#requirements-specification)
3. [Technical Architecture](#technical-architecture)
4. [Implementation Roadmap](#implementation-roadmap)
5. [What You Need to Get Started](#what-you-need-to-get-started)
6. [Cost Estimates](#cost-estimates)

---

## Project Overview

### Concept
An AI-powered web application that helps parents plan optimal weekend outings with their children. The app leverages Google's Vertex AI with Google Maps grounding to provide personalized, realistic travel plans based on the user's location, available time, and transportation options.

### Target Users
- Parents and guardians with children
- Families looking for weekend activity ideas
- Users seeking convenient, optimized travel plans

### Core Value Proposition
- **AI-Powered Recommendations**: Uses LLM to understand family needs and preferences
- **Real-World Accuracy**: Google Maps grounding ensures all recommendations are based on actual places, accurate distances, and real-time travel information
- **Personalized Planning**: Considers user's location, time constraints, and transportation
- **Complete Itineraries**: Provides destinations, lunch spots, and full daily schedules

---

## Requirements Specification

### User Input Parameters
The application requires the following inputs from users:

1. **Current Location**
   - Address, postal code, or "use my current location"
   - Geocoding validation required

2. **Desired Travel Time**
   - Maximum acceptable travel time to destination (e.g., 30 min, 1 hour, 2 hours)
   - One-way or round-trip specification

3. **Transportation Mode**
   - Car availability (Yes/No)
   - If no car: public transportation, walking, or cycling options

4. **Additional Preferences** (Optional)
   - Child age range
   - Activity type preferences (outdoor, indoor, educational, entertainment)
   - Dietary restrictions for lunch recommendations
   - Number of children

### Core Features

#### 1. Destination Recommendations
- Child-friendly locations (parks, museums, playgrounds, entertainment venues)
- Distance-based filtering using travel time constraints
- Weather-appropriate suggestions
- Age-appropriate activities

#### 2. Lunch Spot Recommendations
- Family-friendly restaurants near destinations
- Kid-friendly menu options
- Price range consideration
- Reviews and ratings

#### 3. Daily Schedule Generation
- Start time and end time suggestions
- Travel time between locations
- Activity duration recommendations
- Rest/break time allocation
- Buffer time for unexpected delays

#### 4. Complete Travel Plan
- Turn-by-turn navigation suggestions
- Public transportation routes (if applicable)
- Parking information (if driving)
- Estimated costs

### User Stories

**As a parent, I want to:**
- Receive destination suggestions within my specified travel time
- See complete daily schedules so I can plan my weekend efficiently
- Get lunch recommendations near my chosen destination
- Know exact travel times and routes
- Understand total costs for the day

**As a user without a car, I want to:**
- See destinations accessible by public transportation
- Get detailed public transit directions
- Know walking distances from stations

**As a busy parent, I want to:**
- Quickly generate multiple plan options
- Modify plans based on my preferences
- Save favorite destinations for future reference

### Functional Requirements

**FR1**: System shall accept user location via text input or geolocation
**FR2**: System shall integrate with Vertex AI for natural language processing and plan generation
**FR3**: System shall use Google Maps grounding to validate all location recommendations
**FR4**: System shall calculate accurate travel times based on selected transportation mode
**FR5**: System shall generate a complete daily schedule with time allocations
**FR6**: System shall provide at least 3 destination options per query
**FR7**: System shall recommend lunch spots within 1km of suggested destinations
**FR8**: System shall display results on an interactive map
**FR9**: System shall allow users to regenerate plans with different parameters

### Non-Functional Requirements

**NFR1**: Response time for plan generation should be under 10 seconds
**NFR2**: Application should be mobile-responsive
**NFR3**: User interface should be intuitive and require minimal instructions
**NFR4**: System should handle API failures gracefully with fallback options
**NFR5**: Application should be accessible (WCAG 2.1 Level AA)

---

## Technical Architecture

### System Overview

```
┌─────────────────┐
│   Web Browser   │
│   (User Input)  │
└────────┬────────┘
         │
         │ HTTPS
         ▼
┌─────────────────────────────────────────┐
│         Frontend (React/HTML+JS)        │
│  - Input Form                           │
│  - Map Display (Google Maps JS API)    │
│  - Schedule Display                     │
└────────┬─────────────────────────────┬──┘
         │                             │
         │ REST API                    │ Maps JS API
         ▼                             ▼
┌─────────────────┐           ┌──────────────────┐
│  Backend Server │           │  Google Maps     │
│  (Node.js/      │           │  Platform        │
│   Python)       │           │  (Client-side)   │
└────────┬────────┘           └──────────────────┘
         │
         │ API Calls
         ▼
┌─────────────────────────────────────────┐
│         Google Cloud Platform           │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Vertex AI API                   │  │
│  │  - Gemini Model                  │  │
│  │  - Google Maps Grounding         │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │  Google Maps Platform APIs       │  │
│  │  - Places API                    │  │
│  │  - Directions API                │  │
│  │  - Geocoding API                 │  │
│  │  - Distance Matrix API           │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Recommended Tech Stack

#### Backend
**Option 1: Node.js (Recommended for web app)**
- **Framework**: Express.js or Fastify
- **Language**: TypeScript
- **HTTP Client**: Axios or node-fetch
- **Environment**: Node.js 18+ LTS

**Option 2: Python**
- **Framework**: FastAPI or Flask
- **Language**: Python 3.9+
- **HTTP Client**: requests or httpx
- **AI SDK**: google-cloud-aiplatform

#### Frontend
**Option 1: Modern Stack**
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS or Material-UI
- **State Management**: React Context API or Zustand
- **Maps**: @googlemaps/js-api-loader

**Option 2: Simple Stack**
- **HTML5 + Vanilla JavaScript**
- **CSS3 with Flexbox/Grid**
- **Google Maps JavaScript API**
- Suitable for MVP and faster development

#### APIs and Services
1. **Vertex AI API** - For LLM with Google Maps grounding
2. **Google Maps JavaScript API** - For map display (frontend)
3. **Geocoding API** - For address validation
4. **Places API** - For additional place details
5. **Directions API** - For route planning

### Data Flow

1. **User Input**
   ```
   User enters:
   - Location: "Tokyo Station"
   - Travel time: "1 hour"
   - Has car: "Yes"
   - Children age: "5-10 years"
   ```

2. **Backend Processing**
   ```javascript
   // Geocode user location
   const coordinates = await geocodeLocation("Tokyo Station");

   // Construct prompt for Vertex AI
   const prompt = `
   I need a family-friendly weekend plan:
   - Current location: Tokyo Station (35.6812, 139.7671)
   - Maximum travel time: 1 hour by car
   - Children age: 5-10 years
   - Need: destination recommendations, lunch spots, and complete schedule

   Please provide 3 destination options with lunch recommendations and a detailed schedule.
   `;

   // Call Vertex AI with Google Maps grounding
   const response = await vertexAI.generateContent({
     model: "gemini-1.5-pro",
     prompt: prompt,
     grounding: {
       googleMaps: true
     }
   });
   ```

3. **Response Processing**
   - Parse LLM response
   - Extract location names and coordinates
   - Validate all locations exist via Maps APIs
   - Calculate accurate travel times
   - Format schedule with time slots

4. **Frontend Display**
   - Render interactive map with markers
   - Display schedule in timeline format
   - Show place details and photos
   - Provide navigation links

### Component Architecture

```
src/
├── backend/
│   ├── server.js/server.py          # Main server file
│   ├── routes/
│   │   └── plan.js                  # API endpoints
│   ├── services/
│   │   ├── vertexAI.js              # Vertex AI integration
│   │   ├── geocoding.js             # Geocoding service
│   │   └── maps.js                  # Google Maps API calls
│   ├── utils/
│   │   ├── promptBuilder.js         # Construct prompts
│   │   └── responseParser.js        # Parse LLM responses
│   └── config/
│       └── apiKeys.js               # API configuration
│
├── frontend/
│   ├── public/
│   │   └── index.html               # Main HTML
│   ├── src/
│   │   ├── components/
│   │   │   ├── InputForm.jsx        # User input form
│   │   │   ├── MapDisplay.jsx       # Google Maps component
│   │   │   ├── Schedule.jsx         # Daily schedule display
│   │   │   └── PlaceCard.jsx        # Destination cards
│   │   ├── services/
│   │   │   └── api.js               # Backend API calls
│   │   ├── App.jsx                  # Main app component
│   │   └── main.jsx                 # Entry point
│   └── styles/
│       └── main.css                 # Styling
│
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore file
├── package.json                     # Dependencies
└── README.md                        # Documentation
```

### API Integration Details

#### 1. Vertex AI with Google Maps Grounding

**Endpoint**: `POST https://LOCATION-aiplatform.googleapis.com/v1/projects/PROJECT_ID/locations/LOCATION/publishers/google/models/MODEL_ID:generateContent`

**Key Features**:
- Grounding with Google Maps ensures factual, real-world locations
- Reduces hallucination of non-existent places
- Provides location coordinates and place IDs
- Returns citations with map links

**Sample Request**:
```javascript
const response = await fetch(
  `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/us-central1/publishers/google/models/gemini-1.5-pro:generateContent`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }],
      tools: [{
        googleMaps: {}
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048
      }
    })
  }
);
```

#### 2. Google Maps Platform APIs

**Geocoding API**: Convert addresses to coordinates
```javascript
const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
```

**Places API**: Get place details, photos, ratings
```javascript
const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,photos,formatted_address&key=${API_KEY}`;
```

**Directions API**: Calculate routes and travel times
```javascript
const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&mode=${mode}&key=${API_KEY}`;
```

**Distance Matrix API**: Calculate travel times for multiple destinations
```javascript
const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=${mode}&key=${API_KEY}`;
```

---

## Implementation Roadmap

### Phase 1: Environment Setup (Week 1)

**1.1 Google Cloud Platform Setup**
- [ ] Create GCP project
- [ ] Enable Vertex AI API
- [ ] Enable Google Maps Platform APIs:
  - Maps JavaScript API
  - Geocoding API
  - Places API
  - Directions API
  - Distance Matrix API
- [ ] Set up billing account
- [ ] Create service account for backend
- [ ] Generate API keys

**1.2 Project Initialization**
- [ ] Initialize git repository
- [ ] Create project structure
- [ ] Set up package.json or requirements.txt
- [ ] Create .env.example file
- [ ] Add .gitignore

**1.3 Development Environment**
- [ ] Install Node.js/Python
- [ ] Install code editor (VS Code recommended)
- [ ] Install required extensions
- [ ] Set up local development server

### Phase 2: Backend Development (Week 2-3)

**2.1 Basic Server Setup**
- [ ] Create Express.js or FastAPI server
- [ ] Set up CORS middleware
- [ ] Configure environment variables
- [ ] Create health check endpoint

**2.2 Vertex AI Integration**
- [ ] Install Google Cloud libraries
- [ ] Implement authentication
- [ ] Create Vertex AI service module
- [ ] Test basic LLM calls with grounding

**2.3 Prompt Engineering**
- [ ] Design prompt templates
- [ ] Add dynamic parameter injection
- [ ] Handle edge cases (no results, errors)
- [ ] Test different prompt variations

**2.4 Maps API Integration**
- [ ] Implement geocoding service
- [ ] Create places lookup functions
- [ ] Add directions calculation
- [ ] Implement distance matrix for multiple destinations

**2.5 Response Processing**
- [ ] Parse LLM responses
- [ ] Extract location data
- [ ] Validate and enrich with Maps APIs
- [ ] Format schedule data structure

**2.6 API Endpoints**
- [ ] POST /api/plan - Generate travel plan
- [ ] GET /api/geocode - Geocode address
- [ ] GET /api/place/:id - Get place details
- [ ] Error handling and validation

### Phase 3: Frontend Development (Week 4-5)

**3.1 Project Setup**
- [ ] Initialize React app (or create HTML structure)
- [ ] Install dependencies
- [ ] Set up routing (if using React)
- [ ] Configure build tools

**3.2 User Input Form**
- [ ] Create location input with autocomplete
- [ ] Add travel time selector
- [ ] Add transportation mode toggle
- [ ] Optional preferences fields
- [ ] Form validation

**3.3 Google Maps Integration**
- [ ] Load Maps JavaScript API
- [ ] Create map component
- [ ] Add markers for destinations
- [ ] Implement info windows
- [ ] Add route visualization

**3.4 Results Display**
- [ ] Create schedule timeline component
- [ ] Design destination cards
- [ ] Show lunch recommendations
- [ ] Add photos from Places API
- [ ] Display travel times and distances

**3.5 User Experience**
- [ ] Add loading states
- [ ] Implement error messages
- [ ] Create responsive design
- [ ] Add accessibility features
- [ ] Implement plan regeneration

### Phase 4: Integration & Testing (Week 6)

**4.1 Integration Testing**
- [ ] Test end-to-end flow
- [ ] Verify API integrations
- [ ] Test different user inputs
- [ ] Check edge cases

**4.2 Performance Optimization**
- [ ] Implement response caching
- [ ] Optimize API calls
- [ ] Reduce bundle size
- [ ] Add lazy loading

**4.3 Error Handling**
- [ ] API timeout handling
- [ ] Network error recovery
- [ ] Invalid input handling
- [ ] Fallback mechanisms

**4.4 User Testing**
- [ ] Conduct usability tests
- [ ] Gather feedback
- [ ] Iterate on UI/UX
- [ ] Fix bugs

### Phase 5: Deployment (Week 7)

**5.1 Production Preparation**
- [ ] Environment configuration
- [ ] Security review
- [ ] API key security (backend-only)
- [ ] Rate limiting implementation

**5.2 Deployment Options**

**Option A: Google Cloud Platform**
- [ ] Deploy backend to Cloud Run or App Engine
- [ ] Deploy frontend to Firebase Hosting or Cloud Storage
- [ ] Set up Cloud CDN
- [ ] Configure custom domain

**Option B: Alternative Platforms**
- [ ] Backend: Heroku, Railway, or Render
- [ ] Frontend: Vercel, Netlify, or GitHub Pages
- [ ] Configure environment variables
- [ ] Set up CI/CD

**5.3 Monitoring**
- [ ] Set up logging
- [ ] Configure error tracking (Sentry)
- [ ] Monitor API usage and costs
- [ ] Set up alerts

---

## What You Need to Get Started

### 1. Google Cloud Platform Account

**Setup Steps**:
1. Go to https://console.cloud.google.com/
2. Create new GCP account (includes $300 free credits)
3. Create a new project (e.g., "family-weekend-planner")
4. Set up billing account

### 2. Enable Required APIs

**In GCP Console > APIs & Services > Library, enable**:
1. Vertex AI API
2. Maps JavaScript API
3. Geocoding API
4. Places API (New)
5. Directions API
6. Distance Matrix API

### 3. Authentication & API Keys

**For Backend (Server-side)**:
1. Create service account:
   - Go to IAM & Admin > Service Accounts
   - Create service account with roles:
     - Vertex AI User
     - Service Account Token Creator
   - Download JSON key file
   - Store in `.env` as `GOOGLE_APPLICATION_CREDENTIALS`

2. Create API key for Maps APIs:
   - Go to APIs & Services > Credentials
   - Create API Key
   - Restrict key to backend IPs (production)
   - Limit to required APIs

**For Frontend (Client-side)**:
1. Create separate API key for Maps JavaScript API
2. Restrict to:
   - HTTP referrers (your domain)
   - Only Maps JavaScript API
3. Add to frontend environment variables

### 4. Development Tools

**Required**:
- Node.js 18+ LTS (https://nodejs.org/) OR Python 3.9+
- Git (https://git-scm.com/)
- Code editor (VS Code recommended)
- Modern web browser (Chrome/Firefox for DevTools)

**Recommended**:
- Postman or Thunder Client (API testing)
- React Developer Tools (if using React)
- Google Cloud SDK (for deployment)

### 5. Dependencies

**Backend (Node.js)**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@google-cloud/aiplatform": "^3.0.0",
    "@googlemaps/google-maps-services-js": "^3.3.42",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

**Backend (Python)**:
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
google-cloud-aiplatform==1.38.0
googlemaps==4.10.0
python-dotenv==1.0.0
requests==2.31.0
```

**Frontend (React)**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@googlemaps/js-api-loader": "^1.16.2",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}
```

### 6. Environment Variables Template

Create `.env` file:
```bash
# Server Configuration
PORT=3000
NODE_ENV=development

# Google Cloud Platform
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Google Maps API
GOOGLE_MAPS_API_KEY=your-backend-api-key

# Vertex AI
VERTEX_AI_MODEL=gemini-1.5-pro

# Frontend (separate .env for frontend)
VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key
VITE_BACKEND_URL=http://localhost:3000
```

### 7. Required Skills/Knowledge

**Essential**:
- JavaScript/TypeScript OR Python
- Basic web development (HTML, CSS, JavaScript)
- RESTful API concepts
- Basic understanding of async/await
- Environment variables and configuration

**Helpful**:
- React.js (if using React)
- Google Maps API experience
- LLM prompt engineering
- Git version control
- Basic cloud deployment

---

## Cost Estimates

### Development Phase (Free Tier Available)

**Google Cloud Free Tier** (first 90 days):
- $300 free credits
- Sufficient for development and testing

### Production Costs (Estimated Monthly)

#### Vertex AI API
**Gemini 1.5 Pro with Grounding**:
- Input: $3.50 per 1M tokens
- Output: $10.50 per 1M tokens
- Grounding: $35 per 1,000 grounding requests

**Example Cost** (1,000 users/month, 2 requests each):
- 2,000 requests
- Avg 500 input tokens, 1,000 output tokens per request
- Input cost: (2,000 × 500 / 1M) × $3.50 = $3.50
- Output cost: (2,000 × 1,000 / 1M) × $10.50 = $21.00
- Grounding cost: (2,000 / 1,000) × $35 = $70.00
- **Total Vertex AI: ~$95/month**

#### Google Maps Platform APIs

**Monthly Free Tier** (per API):
- Maps JavaScript API: $200 credit (28,000 loads)
- Geocoding API: $200 credit (40,000 requests)
- Places API: $200 credit (varies by field)
- Directions API: $200 credit (40,000 requests)

**Beyond Free Tier**:
- Maps JavaScript API: $7 per 1,000 loads
- Geocoding: $5 per 1,000 requests
- Places API (Basic Data): $17 per 1,000 requests
- Directions: $5 per 1,000 requests

**Example Cost** (1,000 users/month, staying within free tier):
- **Total Maps APIs: $0** (within free tier)

#### Hosting
- **Frontend** (Static hosting):
  - Firebase Hosting: Free tier (10GB storage, 360MB/day transfer)
  - Or Vercel/Netlify: Free tier available
- **Backend** (Server hosting):
  - Cloud Run: Free tier (2M requests/month)
  - Beyond free tier: ~$0.40 per million requests

**Total Estimated Monthly Cost**:
- **Development**: $0 (using free credits)
- **Low traffic (<1,000 users/month)**: ~$95 (mostly Vertex AI grounding)
- **Medium traffic (5,000 users/month)**: ~$475-500

### Cost Optimization Tips
1. Cache common queries to reduce API calls
2. Use geocoding results caching
3. Implement request throttling
4. Consider using Gemini 1.5 Flash (cheaper) for simpler queries
5. Optimize prompts to reduce token usage
6. Set up budget alerts in GCP

---

## Next Steps

1. **Review this specification** and note any questions or modifications needed
2. **Set up GCP account** and enable required APIs
3. **Choose your tech stack** (Node.js vs Python, React vs Vanilla JS)
4. **Initialize project** structure
5. **Start with Phase 1** of the implementation roadmap

## Additional Resources

- **Vertex AI Documentation**: https://cloud.google.com/vertex-ai/docs
- **Google Maps Platform Documentation**: https://developers.google.com/maps
- **Grounding with Google Maps**: https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/ground-with-google-maps
- **Gemini API Quickstart**: https://ai.google.dev/gemini-api/docs/quickstart

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Status**: Ready for Implementation
