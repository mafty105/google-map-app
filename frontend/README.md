# Family Weekend Planner - Frontend

React frontend for the conversational AI travel planner.

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Google Maps JavaScript API** - Map display
- **Axios** - HTTP client

## Setup

### Prerequisites

- Node.js 18+ or npm/yarn/pnpm

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your Google Maps API key:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your-frontend-api-key-here
   VITE_BACKEND_URL=http://localhost:8000
   ```

   ⚠️ **Important**: Use a separate API key restricted to:
   - HTTP referrers (http://localhost:*, https://yourdomain.com/*)
   - Maps JavaScript API only

### Development

```bash
# Start development server
npm run dev
```

The app will be available at http://localhost:5173

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Linting

```bash
npm run lint
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── ChatInterface.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── ChatInput.jsx
│   │   ├── MapDisplay.jsx
│   │   └── Schedule.jsx
│   ├── services/        # API and external services
│   │   ├── api.js
│   │   └── conversationState.js
│   ├── hooks/           # Custom React hooks
│   │   └── useChat.js
│   ├── styles/          # CSS files
│   │   ├── index.css
│   │   └── App.css
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── .env                 # Environment variables (gitignored)
├── .env.example         # Environment template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Features to Implement

### Phase 1 (Issue #9)
- ✅ Basic React app structure
- ⏳ Chat interface components
- ⏳ Message input and display
- ⏳ Quick reply buttons

### Phase 2 (Issue #10)
- ⏳ Google Maps integration
- ⏳ Map markers for destinations
- ⏳ Route visualization

### Phase 3 (Issue #11)
- ⏳ Schedule timeline display
- ⏳ Place cards with photos
- ⏳ Restaurant recommendations

### Phase 4 (Issue #12)
- ⏳ API service layer
- ⏳ State management
- ⏳ Chat hooks

## API Integration

The frontend communicates with the backend API at `http://localhost:8000/api`:

```javascript
// Example API call
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL + '/api',
});

// Send chat message
const response = await api.post('/chat', {
  sessionId: '...',
  message: '週末片道1時間くらいでいける候補'
});
```

## Development Notes

- The app uses Vite's proxy to avoid CORS issues in development
- Environment variables must be prefixed with `VITE_` to be exposed to the client
- React components use functional components with hooks
- Map integration will be added in Issue #10

## Available Scripts

- `npm run dev` - Start dev server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Next Steps

1. Wait for backend API to be ready (Issue #7)
2. Implement chat interface (Issue #9)
3. Integrate Google Maps (Issue #10)
4. Build schedule display (Issue #11)
5. Connect to backend API (Issue #12)
