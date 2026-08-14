import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { appEnv } from "@/lib/env";

export function isFirebaseConfigured() {
  return Boolean(
    appEnv.firebase.apiKey && appEnv.firebase.authDomain && appEnv.firebase.projectId,
  );
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Add VITE_FIREBASE_* keys to .env.local, or set VITE_BACKEND=local.",
    );
  }

  if (getApps().length > 0) return getApp();

  return initializeApp({
    apiKey: appEnv.firebase.apiKey,
    authDomain: appEnv.firebase.authDomain,
    projectId: appEnv.firebase.projectId,
    storageBucket: appEnv.firebase.storageBucket,
    messagingSenderId: appEnv.firebase.messagingSenderId,
    appId: appEnv.firebase.appId,
  });
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

export function getFirebaseStorage(): FirebaseStorage {
  return getStorage(getFirebaseApp());
}
