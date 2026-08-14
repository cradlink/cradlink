# Cradlink

Find people. Do the thing.

Web app for posting activities and joining other people’s — hackathons, workshops, research groups, pickup sports, board-game nights.

```
web/      React (Vite) app
mobile/   Expo app (later)
```

Firebase rules at the repo root are shared.

## Run the web app

Needs **Node 20.19+**.

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The default backend is **local** (browser `localStorage` + seed data). No Firebase project required.

Demo account:

- Email: `marko@cradlink.com`
- Password: `demo1234`
- **Continue as Marko Njegomir** (local mode) signs in as Marko.

## What works

- Sign up / log in / mock Google
- Create an activity (live card preview)
- Feed of cards with type + place filters
- Join / leave, capacity respected
- Activity detail + members
- My activities (Created / Joined)
- Profile view + edit, avatar upload

Data lives in this browser until you switch to Firebase.

## Switch to Firebase

1. Create a Firebase project. Enable **Authentication** (Email/Password + Google), **Firestore**, and **Storage**.
2. Register a web app and copy the config.
3. Copy `web/.env.example` to `web/.env.local` and fill in the keys:

```
VITE_BACKEND=firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

4. Paste `firestore.rules` and `storage.rules` in the Firebase console (or deploy with the Firebase CLI).
5. Deploy `firestore.indexes.json` or accept the index links the console shows on first query.
6. Restart `npm run dev` from `web/`.

The UI does not change. Auth, activities, members, and avatars go through the same repository interface.

## Deploy (web)

Import the repo on Vercel. The app is in `web/`.

- Set **Root Directory** to `web`, or leave the repo root — `vercel.json` at the root builds `web/`.
- Add the same `VITE_*` env vars.
- Add the Vercel domain under Firebase Auth → Authorized domains.

SPA routes are rewritten to `index.html`.

## Stack

React · Vite · React Router · TypeScript · Tailwind · TanStack Query · Firebase JS SDK (optional)
