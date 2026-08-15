const fs = require("fs")
const path = require("path")

function loadEnv(filename) {
  const file = path.join(__dirname, filename)
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const text = line.trim()
    if (!text || text.startsWith("#")) continue
    const cut = text.indexOf("=")
    if (cut < 0) continue
    const key = text.slice(0, cut).trim()
    const value = text.slice(cut + 1).trim()
    out[key] = value
    if (!process.env[key]) process.env[key] = value
  }
  return out
}

const env = loadEnv(".env")
const webClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ""

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    firebase: {
      apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
      authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
      projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "",
      storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
      messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
      appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || "",
    },
    google: {
      webClientId,
      androidClientId: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
      iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
      expoProject: env.EXPO_PUBLIC_EXPO_PROJECT || "@ljubogdan/cradlink",
    },
  },
})
