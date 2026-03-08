# Spin Workout

A minimal, offline-capable PWA for guided spin bike workouts. Designed for landscape iPad use on the handlebars.

## Features

- **4 workout types**: Recovery, HIIT, Strength, Endurance
- **Configurable duration**: 20, 30, 45, or 60 minutes
- **Live progress chart** with smooth scrolling resistance/RPM visualization
- **Voice announcements** for segment transitions (via Web Speech API)
- **Countdown overlay** — large pop-and-fade numbers for the last 5 seconds of each segment
- **Wake Lock** keeps the screen on during workouts
- **Installable PWA** with standalone landscape mode

## Tech Stack

- React 18 + Vite
- Tailwind CSS
- Recharts (chart library)
- No backend — fully static/client-side

## Development

```bash
npm install
npm run dev
```

Dev server runs on `http://localhost:5173` by default.

## Build & Deploy

```bash
npm run build
```

Outputs to `dist/`. Deployed automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`.

## Project Structure

```
src/
  App.jsx          # Main app — workout selection, active workout, chart
  main.jsx         # React entry point
  index.css        # Tailwind imports, safe-area styles, animations
  useWakeLock.js   # Screen Wake Lock API hook
public/
  manifest.json    # PWA manifest (standalone, landscape)
  icon-192.png     # App icon (192x192)
  icon-512.png     # App icon (512x512)
  icon.svg         # Favicon
```
