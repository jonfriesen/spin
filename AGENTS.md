# Spin Workout — Agent Guide

This is a static React PWA for guided spin cycling workouts, used on an iPad in landscape mode.

## Key Constraints

- **No backend.** Everything runs client-side. No API calls, no database.
- **iPad PWA.** The app runs as a standalone homescreen app in landscape. All layouts must respect `100dvh`, `safe-area-inset-*`, and `viewport-fit=cover`.
- **Performance matters.** The workout timer runs at ~60fps via `requestAnimationFrame`. Avoid expensive re-renders in the `ActiveWorkout` component. Use `useMemo` for derived data that doesn't depend on `elapsed`.
- **Offline-first.** The app should work without a network connection once loaded.

## Architecture

- `src/App.jsx` — Single-file app with three views: workout selection, active workout, completion screen. The `ActiveWorkout` component is the most complex, managing timer state, chart data, segment transitions, speech, and scroll behavior.
- `src/useWakeLock.js` — Hook wrapping the Screen Wake Lock API with visibility change re-acquisition.
- Workout segments are generated at start time by `generateWorkout()` and stored in state. Segment times are derived via `useMemo`.

## Conventions

- Tailwind for styling. Dark theme (`gray-900` background).
- Vite for build/dev. `base: './'` for relative asset paths (GitHub Pages compatible).
- Git commit hash injected at build time via `__GIT_COMMIT_HASH__` define.
- Commit messages use conventional format: `feat:`, `fix:`, `chore:`.

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via the workflow in `.github/workflows/deploy.yml`.
