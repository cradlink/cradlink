# Cradlink mobile

Find people. Do the thing.

Expo (React Native) app. Same product as the web app at the repo root. Phase 2 of Cradlink — same Firebase project later, not wired yet.

## Run it

Needs **Node 20.19+**. From this folder:

```bash
npm install
npx expo start
```

Then open it in Expo Go (scan the QR), an iOS simulator, an Android emulator, or press `w` for web.

## What’s here

Scaffold only. Navigation matches the web app:

- Home feed (mock activities)
- My activities (Created / Joined)
- Profile + edit
- Activity detail + create
- Log in / sign up placeholders

Domain types in `lib/types.ts` are the same model as `src/lib/types.ts` on the web. Keep them aligned.

Auth, join/leave, and Firebase come next. Do not talk to the web app’s `localStorage` from here.

## Stack

Expo SDK 57 · Expo Router · React Native · TypeScript
