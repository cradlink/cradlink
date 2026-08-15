import AsyncStorage from "@react-native-async-storage/async-storage"
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, initializeAuth, type Auth, type Persistence } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

import { appEnv, isFirebaseConfigured } from "@/lib/env"

let auth: Auth | null = null

export { isFirebaseConfigured }

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase is not configured. Add EXPO_PUBLIC_FIREBASE_* keys to mobile/.env.")
  }
  if (getApps().length > 0) return getApp()
  return initializeApp({
    apiKey: appEnv.firebase.apiKey,
    authDomain: appEnv.firebase.authDomain,
    projectId: appEnv.firebase.projectId,
    storageBucket: appEnv.firebase.storageBucket,
    messagingSenderId: appEnv.firebase.messagingSenderId,
    appId: appEnv.firebase.appId,
  })
}

export function getFirebaseAuth(): Auth {
  if (auth) return auth
  const app = getFirebaseApp()
  try {
    const { getReactNativePersistence } = require("@firebase/auth") as {
      getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence
    }
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  } catch {
    auth = getAuth(app)
  }
  return auth
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp())
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp())
}
