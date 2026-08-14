# Cradlink

Two apps, same product.

- **Web** (repo root): Vite + React SPA. Routes live in `src/App.tsx`. UI is React + React Router + Tailwind. Backend code is in `src/lib` (localStorage or Firebase).
- **Mobile** (`mobile/`): Expo + React Native. Routes live in `mobile/app/`. Domain types in `mobile/lib/types.ts` must stay aligned with `src/lib/types.ts`.
