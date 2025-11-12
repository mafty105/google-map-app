# Family Weekend Planner - Frontend

React frontend for the conversational AI travel planner.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with IKYU design tokens
- **Vite** - Build tool and dev server
- **Google Maps JavaScript API** - Map display
- **Fetch API** - Native HTTP client
- **pnpm** - Fast package manager

## Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   pnpm install
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
pnpm dev
```

The app will be available at http://localhost:5173

### Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Type Checking

```bash
# Run TypeScript type check
pnpm exec tsc --noEmit
```

### Linting

```bash
pnpm lint
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── components/      # React components (TypeScript)
│   │   ├── ChatContainer.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── ChatInput.tsx
│   │   └── QuickReplies.tsx
│   ├── styles/          # CSS files with Tailwind
│   │   ├── index.css (Tailwind + IKYU design tokens)
│   │   └── App.css
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── vite-env.d.ts    # Vite type definitions
├── .env                 # Environment variables (gitignored)
├── .env.example         # Environment template
├── tsconfig.json        # TypeScript configuration
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## Features to Implement

### Phase 1 (Issue #9)
- ✅ Basic React app structure with TypeScript
- ✅ Tailwind CSS v4 with IKYU design tokens
- ✅ Chat interface components
- ✅ Message input and display
- ✅ Quick reply buttons
- ✅ Backend API integration

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

```typescript
// Example API call using fetch (TypeScript)
const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Send chat message
const response = await fetch(`${baseURL}/api/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    session_id: '...',
    message: '週末片道1時間くらいでいける候補'
  })
});

const data: ChatResponse = await response.json();
```

## Development Notes

- The app uses Vite's proxy to avoid CORS issues in development
- Environment variables must be prefixed with `VITE_` to be exposed to the client
- All React components use TypeScript with strict type checking
- Tailwind CSS v4 with custom IKYU design tokens (see DESIGN_GUIDELINE.md)
- Map integration will be added in Issue #10

## Available Scripts

- `pnpm dev` - Start dev server (port 5173)
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm exec tsc --noEmit` - Type check without emitting files

## Next Steps

1. ✅ Backend API ready (Issue #7 - merged)
2. ✅ Chat interface implemented (Issue #9 - this PR)
3. ⏳ Integrate Google Maps (Issue #10)
4. ⏳ Build schedule display (Issue #11)
5. ⏳ Vertex AI + Google Maps grounding (Issue #4)
