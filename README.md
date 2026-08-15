# Cradlink

Find humans. Do human things.

Web app for posting activities and joining other people’s — hackathons, workshops, research groups, pickup sports, board-game nights. Phase 1 is the React (Vite) app in [`web/`](./web). Phase 2 is the Expo app in [`mobile/`](./mobile). Same Firebase project later.

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

## Mobile

Separate Expo / React Native project. From the repo root:

```bash
cd mobile
npm install
npx expo start
```

See [`mobile/README.md`](./mobile/README.md).

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

Use **two Vercel projects** on the same GitHub repo. Each project has its own production URL.

| Project name (example) | Production branch | What it is |
| --- | --- | --- |
| `cradlink` | `main` | Production |
| `cradlink-dev` | `development` | Staging / preview of current work |

`vercel.json` at the repo root builds `web/`. Leave **Root Directory** empty on both projects.

### On Vercel (do this twice)

1. [vercel.com/new](https://vercel.com/new) → import `cradlink/cradlink`.
2. **Root Directory**: leave blank.
3. Framework: Vite (detected).
4. After the first import, open **Project Settings → Environments** (or **Git**) and set **Production Branch**:
   - first project → `main`
   - second project → `development`
5. **Settings → General → Node.js Version** → `22.x`.
6. **Settings → Git**: turn off automatic preview deploys if you only want the production branch of that project to publish (optional).
7. **Settings → Environment Variables** — add these to **Production** (and Preview if you keep it):

```
VITE_BACKEND=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Use the same Firebase project on both unless you later split staging data.

8. Deploy. Copy each project’s `*.vercel.app` domain.

### After both URLs exist

1. Firebase Console → **Authentication → Settings → Authorized domains** → add both Vercel hostnames (no `https://`).
2. If you use Google sign-in: Google Cloud Console → your OAuth client → **Authorized JavaScript origins** → add `https://<prod>.vercel.app` and `https://<dev>.vercel.app`.
3. Paste the latest `firestore.rules` and `storage.rules` if you have not already.

Pushes to `main` update production. Pushes to `development` update the dev site.

`main` is still the older root-level Vite app. The `development` project is the current `web/` app (search, follows, discussion). Merge `development` into `main` when you want production to match.

## Stack

React · Vite · React Router · TypeScript · Tailwind · TanStack Query · Firebase JS SDK (optional)
