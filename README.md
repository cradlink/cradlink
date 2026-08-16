<p align="center">
  <img src="mobile/readme/banner.svg" alt="Cradlink" width="100%" />
</p>

<p align="center">
  <img src="mobile/readme/type.svg" alt="Find people. Do the thing." width="100%" />
</p>

<p align="center">
  <strong>Turn a post into a plan.</strong><br />
  Discover people nearby, start an activity, join in, and actually meet.
</p>

<p align="center">
  <code>React</code>&nbsp;&nbsp;·&nbsp;&nbsp;
  <code>React Native</code>&nbsp;&nbsp;·&nbsp;&nbsp;
  <code>Expo</code>&nbsp;&nbsp;·&nbsp;&nbsp;
  <code>Firebase</code>&nbsp;&nbsp;·&nbsp;&nbsp;
  <code>TypeScript</code>
</p>

<p align="center">
  <a href="#quick-start">Quick start</a>
  &nbsp;·&nbsp;
  <a href="#features">Features</a>
  &nbsp;·&nbsp;
  <a href="#firebase-setup">Firebase</a>
  &nbsp;·&nbsp;
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

## One product, two apps

Cradlink is a social activity platform built around a simple idea: finding people should lead to doing something together. The web and mobile apps share the same product model and Firebase backend while keeping platform-native navigation and UI.

| App | Location | Stack | Purpose |
| --- | --- | --- | --- |
| Web | [`web/`](./web) | Vite, React, React Router, Tailwind | Responsive browser experience |
| Mobile | [`mobile/`](./mobile) | Expo, React Native, Expo Router | Native Android and iOS experience |
| Backend | Repository root | Firebase Auth, Firestore, Storage | Shared users, activities and social data |

```text
cradlink/
├── web/                     # Vite + React application
├── mobile/                  # Expo + React Native application
├── firestore.rules          # Shared Firestore security rules
├── firestore.indexes.json   # Shared Firestore indexes
├── storage.rules            # Shared Storage security rules
├── firebase.json            # Firebase deployment configuration
└── vercel.json              # Web deployment configuration
```

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

## Features

### Activities

- Create, edit, cancel and delete activities
- Add up to six photos with gallery navigation
- Filter the feed by activity type and location
- Support fixed times or flexible scheduling
- Configure capacity, headcount and automatic or manual joining
- Separate active and past activities on profiles
- Receive reminders one day and one hour before an activity

### People and community

- Email/password and Google authentication
- Email verification and account reactivation
- Public and private profiles
- Follow requests, followers and following
- User search and profile discovery
- Join requests and member management
- Activity discussions with threaded replies
- In-app notifications

### Experience

- Responsive web layout and native mobile navigation
- English, Serbian Latin and Serbian Cyrillic
- Light and dark presentation on the web
- Local browser backend for web development
- Shared Firebase production backend

<p align="center">
  <img src="mobile/readme/card-join.svg" alt="Join an activity" width="31%" />
  &nbsp;
  <img src="mobile/readme/card-compose.svg" alt="Create an activity" width="31%" />
  &nbsp;
  <img src="mobile/readme/card-maps.svg" alt="Choose a place" width="31%" />
</p>

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

## Quick start

### Requirements

- Node.js 22 recommended (web requires Node.js 20.19 or newer)
- npm
- Expo Go, an Android emulator, or an iOS simulator for mobile development

Clone the repository, then run either app independently.

### Web

```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The web app uses its local browser backend by default, so Firebase credentials are not required for the first run.

Useful commands:

```bash
npm run dev       # start the Vite development server
npm run lint      # run ESLint
npm run build     # type-check and create a production build
npm run preview   # preview the production build locally
```

### Mobile

```bash
cd mobile
npm install
npm start
```

Scan the QR code with Expo Go or choose an emulator from the Expo terminal. Mobile uses Firebase and needs the environment configuration described below.

Useful commands:

```bash
npm run android     # open on Android
npm run ios         # open on iOS
npm run web         # run through React Native Web
npm run build:apk   # create an internal Android APK with EAS
npx tsc --noEmit    # type-check the mobile app
```

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

## Firebase setup

Both apps are designed to use the same Firebase project.

1. Create a Firebase project.
2. Enable Email/Password and Google providers under **Authentication**.
3. Create a Firestore database and enable Firebase Storage.
4. Register a Firebase web application and copy its configuration values.
5. Deploy the rules and indexes from the repository root:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

### Web environment

Copy the example file:

```bash
cp web/.env.example web/.env.local
```

Set the backend and Firebase values:

```dotenv
VITE_BACKEND=firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

To return to browser-only development, set `VITE_BACKEND=local`.

### Mobile environment

Copy the example file:

```bash
cp mobile/.env.example mobile/.env
```

Add the same Firebase project values using the `EXPO_PUBLIC_` prefix. Google sign-in additionally requires the appropriate OAuth client IDs:

```dotenv
EXPO_PUBLIC_BACKEND=firebase
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=

EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_EXPO_PROJECT=@ljubogdan/cradlink
```

Environment files are local configuration. Do not commit real credentials.

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

## Deployment

### Web with Vercel

The root [`vercel.json`](./vercel.json) installs and builds the application in `web/`, publishes `web/dist`, and rewrites browser routes to the SPA entry point.

Recommended branch setup:

| Environment | Branch | Purpose |
| --- | --- | --- |
| Production | `main` | Stable public release |
| Development | `development` | Staging and integration |

For each Vercel project:

1. Import this repository and leave **Root Directory** empty.
2. Use Node.js 22.
3. Select the appropriate production branch.
4. Add all `VITE_FIREBASE_*` values and set `VITE_BACKEND=firebase`.
5. Add the deployed hostname to Firebase Authentication's authorized domains.
6. Add the hostname as an authorized JavaScript origin for Google OAuth.

### Mobile with EAS

The included [`mobile/eas.json`](./mobile/eas.json) contains two Android profiles:

```bash
cd mobile
npx eas build --platform android --profile preview      # installable APK
npx eas build --platform android --profile production   # Play Store bundle
```

Configure production environment values through EAS secrets or your build environment before creating a release.

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

## Development notes

- Web routes live in [`web/src/App.tsx`](./web/src/App.tsx).
- Mobile routes live in [`mobile/app/`](./mobile/app/).
- Web backend implementations live in [`web/src/lib/`](./web/src/lib/).
- Mobile backend implementations live in [`mobile/lib/`](./mobile/lib/).
- Changes to domain models must keep `web/src/lib/types.ts` and `mobile/lib/types.ts` aligned.
- Firebase rules and indexes are shared and remain at the repository root.

Before merging application changes, run:

```bash
cd web && npm run lint && npm run build
cd ../mobile && npx tsc --noEmit
```

## Product direction

Cradlink is deliberately not another endless social feed. An activity has a person, a place, a time and a clear next step. The interface stays out of the way so a post can become a real plan.

<p align="center">
  <img src="mobile/readme/wave.svg" alt="" width="100%" />
</p>

<p align="center">
  <strong>Find people. Do the thing.</strong><br />
  <sub>CRADLINK · WEB + MOBILE</sub>
</p>
