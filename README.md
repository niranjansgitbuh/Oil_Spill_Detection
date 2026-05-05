# Oil Spill Detection Frontend - Next.js

Next.js dashboard for monitoring oil spills and tracking vessels in real-time.

## Quick Start

### 1. Install Node.js
Download Node.js 18+ from [nodejs.org](https://nodejs.org/)

### 2. Open PowerShell & Navigate to Project

```powershell
cd C:\Users\akash\work\oil_spill\Project_zip_KD_oil_spill
```

### 3. Install Dependencies

```powershell
npm install
```

Or with pnpm:
```powershell
pnpm install
```

### 4. Start Development Server

```powershell
npm run dev
```

✅ App running at: `http://localhost:3000`

---

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run lint` | Check code quality |

---

## Features

- 🚢 **Vessel Tracking** - Real-time AIS ship monitoring with Leaflet maps
- 🛢️ **Oil Spill Detection** - AI-powered satellite image analysis
- 🔔 **Alert System** - Emergency notifications for incidents
- 📡 **Anomaly Detection** - Vessel behavior analysis
- 🗺️ **Geographic Mapping** - Interactive map interface
- 🛰️ **Satellite Viewer** - Satellite imagery display
- 📊 **Regulatory Portal** - Authority access controls

---

## Project Structure

```
Project_zip_KD_oil_spill/
├── app/
│   ├── page.tsx          # Main dashboard
│   ├── layout.tsx        # App layout
│   └── globals.css       # Global styles
├── components/
│   ├── ais-monitoring-dashboard.tsx
│   ├── AISTracking.tsx
│   ├── MapView.tsx
│   ├── OilSpillDetector.tsx
│   ├── anomaly-detection-panel.tsx
│   └── ui/               # UI components
├── package.json
└── README.md
```

---

## Configuration

### Backend Connection

Edit `.env.local` to update the backend URL:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Change these URLs if your backend is running on a different host/port.

### Default Values

If `.env.local` is not set, the app will use:
- REST API: `http://localhost:8000`
- WebSocket: `ws://localhost:8000`

---

## Main Pages/Tabs

| Tab | Function |
|-----|----------|
| **Vessel Tracking** | Monitor active ships via AIS |
| **Anomaly Detection** | Detect unusual vessel behavior |
| **Oil Spill Detection** | Upload & analyze satellite images |
| **Alert System** | Manage emergency alerts |
| **Satellite View** | View satellite imagery |
| **Geographic Map** | Interactive mapping |
| **Reports** | System reports & authority portal |

---

## Common Issues

**Dependencies not installed?**
```powershell
npm install
```

**Port 3000 in use?**
```powershell
npm run dev -- -p 3001
```

**Backend not connecting?**
- Ensure backend is running at `http://localhost:8000`
- Check CORS settings in backend

**Map not displaying?**
- Verify Leaflet is installed: `npm list leaflet`
- Check browser console for errors

---

## Tech Stack

- **Next.js 14.2** - React framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Leaflet** - Map library
- **Radix UI** - Component library
- **Recharts** - Data visualization

---

## Build for Production

```powershell
npm run build
npm start
```

Visit `http://localhost:3000`

---

**Make sure backend is running before using the app!**

See Backend README for setup instructions.
