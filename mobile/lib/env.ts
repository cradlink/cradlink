import Constants from "expo-constants"

type Extra = {
  firebase?: {
    apiKey?: string
    authDomain?: string
    projectId?: string
    storageBucket?: string
    messagingSenderId?: string
    appId?: string
  }
  google?: {
    webClientId?: string
    androidClientId?: string
    iosClientId?: string
  }
}

function read(name: string): string {
  const value = process.env[`EXPO_PUBLIC_${name}`]
  return value?.trim() ?? ""
}

const extra = (Constants.expoConfig?.extra ?? {}) as Extra

export const appEnv = {
  backend: read("BACKEND") || "firebase",
  firebase: {
    apiKey: extra.firebase?.apiKey || read("FIREBASE_API_KEY"),
    authDomain: extra.firebase?.authDomain || read("FIREBASE_AUTH_DOMAIN"),
    projectId: extra.firebase?.projectId || read("FIREBASE_PROJECT_ID"),
    storageBucket: extra.firebase?.storageBucket || read("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: extra.firebase?.messagingSenderId || read("FIREBASE_MESSAGING_SENDER_ID"),
    appId: extra.firebase?.appId || read("FIREBASE_APP_ID"),
  },
  google: {
    webClientId: extra.google?.webClientId || read("GOOGLE_WEB_CLIENT_ID"),
    androidClientId: extra.google?.androidClientId || read("GOOGLE_ANDROID_CLIENT_ID"),
    iosClientId: extra.google?.iosClientId || read("GOOGLE_IOS_CLIENT_ID"),
  },
}

export function isFirebaseConfigured() {
  return Boolean(appEnv.firebase.apiKey && appEnv.firebase.authDomain && appEnv.firebase.projectId)
}

export function isGoogleConfigured() {
  return Boolean(appEnv.google.webClientId || appEnv.google.androidClientId)
}
