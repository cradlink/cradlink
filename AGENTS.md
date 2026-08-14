# Cradlink

Two apps, same product.

- **Web** (`web/`): Vite + React SPA. Routes live in `web/src/App.tsx`. UI is React + React Router + Tailwind. Backend code is in `web/src/lib` (localStorage or Firebase). Shared Firebase rules stay at the repo root.
- **Mobile** (`mobile/`): Expo + React Native. Routes live in `mobile/app/`. Domain types in `mobile/lib/types.ts` must stay aligned with `web/src/lib/types.ts`.
