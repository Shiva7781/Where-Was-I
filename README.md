# 🌍 Where Was I? — Browser History World Map

A full-stack application that plots every website you visit on an interactive world map based on the server's geographic location.

---

## Architecture

```
┌─────────────────────┐        ┌────────────────────────────┐
│  Chrome Extension   │──POST──▶  Express.js Backend        │
│  (Manifest V3)      │        │  • DNS resolution           │
│                     │        │  • IP geolocation (geoip)   │
│  • webNavigation    │        │  • MongoDB storage          │
│  • Debounce 5s      │        │  • Socket.io real-time      │
│  • Retry back-off   │        └────────────┬───────────────┘
└─────────────────────┘                     │
                                            │ REST + WebSocket
                                ┌───────────▼───────────────┐
                                │  React.js Frontend         │
                                │  • Leaflet dot map         │
                                │  • Choropleth heatmap      │
                                │  • Time Travel slider      │
                                │  • Live stats panel        │
                                └───────────────────────────┘
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| npm | ≥ 9 |
| MongoDB | Local (any recent version) |
| Chrome | ≥ 88 (Manifest V3) |

---

## Setup

### 1. MongoDB

Make sure MongoDB is running locally:
```bash
mongod --dbpath /data/db
# or with Homebrew:
brew services start mongodb-community
```

### 2. Backend

```bash
cd backend

# Copy environment file
cp .env.example .env
# Edit .env if you want a different API key or port

npm install
npm run dev          # Starts on http://localhost:5000
```

**Environment variables** (`.env`):
| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | HTTP port |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/whereWasI` | MongoDB connection |
| `API_KEY` | `where-was-i-dev-key-change-in-production` | Shared secret for Chrome extension |
| `CORS_ORIGINS` | `http://localhost:5173,chrome-extension://` | Allowed origins |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # Opens http://localhost:5173
```

### 4. Chrome Extension

**Generate icons** (one-time):
```bash
cd chrome-extension
node icons/create-icons.js
```

**Load in Chrome**:
1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder

**Configure the extension**:
1. Click the extension icon in your toolbar
2. Paste your API key (must match `API_KEY` in backend `.env`)
3. Click **Save**
4. The status dot turns green when the backend is reachable

---

## Features

### 🗺 Dot Map (real-time)
- Every resolved visit appears as a glowing animated dot
- Color encodes visit frequency: 🔵 1 → 🟢 2–5 → 🟡 6–20 → 🔴 20+
- Click any dot to see domains, IP, city/country, and visit count
- New dots appear instantly via WebSocket

### 🌡 Heatmap
- Choropleth world map — countries fill based on server visit count
- Dynamic color scale adjusts to the day's data range
- Hover tooltip shows country name and count

### ⏱ Time Travel Slider
- Pick any past date with the date picker
- Drag the slider to scrub through the day 00:00 → 24:00
- Hit **▶** to autoplay and watch your browsing path replay
- Both Dot Map and Heatmap respond to the slider

### 📊 Stats Panel (floating overlay)
- Total visits and unique domains for the selected day
- Visits-by-hour bar chart
- Top 15 countries ranked by visit count

---

## Edge Cases Handled

| Scenario | Handling |
|----------|----------|
| `localhost` / `127.0.0.1` | Marked `geoStatus: private`, stored without coords, excluded from map |
| Private IPs (RFC 1918, link-local, ULA) | Same as above — marker excluded |
| DNS resolution failure | Stored with `geoStatus: failed`, still appears in visit count |
| GeoIP not found for a public IP | `geoStatus: failed`; IP recorded, no map marker |
| Same domain visited repeatedly in < 5 s | Chrome extension debounces; only one request sent |
| Backend unreachable | Extension retries up to 3× with exponential back-off |
| Invalid / non-HTTP URLs | Rejected by Joi validation at the backend |
| Very long URLs | Truncated to 2048 chars; query params stripped before storage |

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/visits` | Bearer key | Ingest a new visit URL |
| `GET` | `/api/visits?date=YYYY-MM-DD` | — | Paginated visit list |
| `GET` | `/api/visits/stats?date=YYYY-MM-DD` | — | Aggregated statistics |
| `GET` | `/api/visits/heatmap?date=YYYY-MM-DD` | — | Country-level counts |
| `DELETE` | `/api/visits` | Bearer key | Clear all visits |
| `GET` | `/api/health` | — | Server health check |

---

## Project Structure

```
Where-Was-I/
├── README.md
├── chrome-extension/
│   ├── manifest.json          # Manifest V3
│   ├── background.js          # Service worker — captures & sends visits
│   ├── popup.html/js/css      # Extension popup UI
│   └── icons/
│       ├── create-icons.js    # PNG icon generator (no dependencies)
│       └── icon{16,32,48,128}.png
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── index.js           # Express + Socket.io server
│       ├── config/database.js # Mongoose connection
│       ├── models/Visit.js    # MongoDB schema
│       ├── routes/visits.js   # REST endpoints
│       ├── services/
│       │   └── geoService.js  # DNS → IP → lat/lng pipeline
│       ├── middleware/
│       │   └── auth.js        # Bearer token check
│       └── utils/
│           └── ipUtils.js     # Private IP detection, URL helpers
│
└── frontend/
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx            # Root layout + state
        ├── index.css          # Global dark theme + Leaflet overrides
        ├── components/
        │   ├── WorldMap.jsx       # Leaflet dot map with animated markers
        │   ├── HeatMap.jsx        # react-simple-maps choropleth
        │   ├── TimeTravelSlider.jsx
        │   ├── StatsPanel.jsx     # Floating stats overlay
        │   └── Header.jsx
        ├── hooks/
        │   └── useVisits.js   # Data fetching + Socket.io + time travel logic
        └── services/
            └── api.js         # Axios API client
```

---

## Architecture Decisions & Trade-offs

| Decision | Choice | Why |
|----------|--------|-----|
| **Geo library** | `geoip-lite` (local MaxMind DB) | No API key, no rate limit, no network dependency. Trade-off: database is bundled at install time and can be 3–6 months stale — run `npm run update-geoip` to refresh. |
| **Geo resolution timing** | Async after 201 response | The extension gets an immediate acknowledgement and isn't blocked by DNS + geoip latency. The visit appears on the map ~100–500 ms later via the Socket.io `new-visit` event. |
| **Auth mechanism** | Shared Bearer token | Simple and sufficient for a single-user local setup. In a multi-user production deployment this would be replaced with per-user JWT tokens. |
| **Heatmap** | SVG choropleth (react-simple-maps) | Country-level fills communicate "which countries' servers" more clearly than a density heatmap. Trade-off: requires an ISO numeric → alpha-2 lookup table for ~180 countries. |
| **Dot map** | Leaflet `DivIcon` + CSS `@keyframes` | CSS animations run on the compositor thread (GPU), cheaper than JS-driven animation. SVG `CircleMarker` can't receive CSS class-based animations. |
| **Debounce** | 5 s per domain | Prevents duplicate records on rapid reload/SPA navigation without losing genuine re-visits. A shorter window risks spam; longer risks missing real repeat visits. |
| **URL storage** | Path only (query string stripped) | Query strings often contain session tokens, search terms, or PII. Stripping them keeps stored data clean by default. |
| **MongoDB** | Local instance | Zero-config for local development. The connection string is an env variable, so swapping to Atlas or any hosted instance requires only a one-line `.env` change. |

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Chrome Extension | Manifest V3, `webNavigation` API, `chrome.storage` |
| Backend | Express.js, Mongoose, `geoip-lite`, Socket.io, Helmet, Rate Limit |
| Database | MongoDB (local) |
| Frontend | React 18, Vite, Leaflet + react-leaflet, react-simple-maps, Socket.io-client, date-fns |
| Geo Data | `geoip-lite` (bundled MaxMind GeoLite2 database) |
