function read(name: string): string | undefined {
  const env = import.meta.env as ImportMetaEnv & Record<string, string | undefined>;
  const value = env[`VITE_${name}`] ?? env[`NEXT_PUBLIC_${name}`];
  return value || undefined;
}

export const appEnv = {
  backend: read("BACKEND"),
  firebase: {
    apiKey: read("FIREBASE_API_KEY"),
    authDomain: read("FIREBASE_AUTH_DOMAIN"),
    projectId: read("FIREBASE_PROJECT_ID"),
    storageBucket: read("FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: read("FIREBASE_MESSAGING_SENDER_ID"),
    appId: read("FIREBASE_APP_ID"),
  },
};
