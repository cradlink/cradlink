import * as Google from "expo-auth-session/providers/google"
import * as WebBrowser from "expo-web-browser"

import { useAuth } from "@/hooks/use-auth"
import { appEnv, isGoogleConfigured } from "@/lib/env"
import { AppError } from "@/lib/errors"

WebBrowser.maybeCompleteAuthSession()

export function useGoogleAuth() {
  const { signInWithGoogle } = useAuth()
  const webClientId =
    appEnv.google.webClientId ||
    appEnv.google.androidClientId ||
    "979349162134-d8gcgo10tgq5c8tu0iqm32mbkn4omsio.apps.googleusercontent.com"
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    clientId: webClientId,
    iosClientId: appEnv.google.iosClientId || webClientId,
    androidClientId: appEnv.google.androidClientId || webClientId,
  })

  return {
    ready: Boolean(request) && isGoogleConfigured(),
    prompt: async () => {
      if (!isGoogleConfigured()) throw new AppError("googleFailed")
      const result = await promptAsync()
      if (result.type === "cancel" || result.type === "dismiss") throw new AppError("googleClosed")
      if (result.type !== "success") throw new AppError("googleFailed")
      const idToken = result.params.id_token
      if (!idToken) throw new AppError("googleFailed")
      await signInWithGoogle(idToken)
    },
  }
}
