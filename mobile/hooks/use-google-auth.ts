import { useMemo } from "react"
import * as AuthSession from "expo-auth-session"
import * as WebBrowser from "expo-web-browser"
import { Platform } from "react-native"

import { useAuth } from "@/hooks/use-auth"
import { appEnv, isGoogleConfigured } from "@/lib/env"
import { AppError } from "@/lib/errors"

WebBrowser.maybeCompleteAuthSession()

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
}

function expoProjectName() {
  return appEnv.google.expoProject || "@ljubogdan/cradlink"
}

function httpsRedirect() {
  return `https://auth.expo.io/${expoProjectName()}`
}

function nativeClientId(platformId: string, webClientId: string) {
  return platformId && platformId !== webClientId ? platformId : ""
}

function readParam(url: string, key: string) {
  const normalized = url.replace(/#/g, "?")
  const match = normalized.match(new RegExp(`[?&]${key}=([^&]+)`))
  return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : ""
}

export function useGoogleAuth() {
  const { signInWithGoogle } = useAuth()
  const webClientId = appEnv.google.webClientId
  const androidClientId = nativeClientId(appEnv.google.androidClientId, webClientId)
  const iosClientId = nativeClientId(appEnv.google.iosClientId, webClientId)
  const hasNativeClient =
    (Platform.OS === "android" && Boolean(androidClientId)) ||
    (Platform.OS === "ios" && Boolean(iosClientId))

  // Web OAuth clients + custom schemes (exp://, cradlink://) are blocked by Google.
  // Expo Go only has those schemes, so we send Google an HTTPS redirect instead.
  const useHttpsProxy = Platform.OS !== "web" && !hasNativeClient
  const clientId =
    Platform.OS === "ios" && iosClientId
      ? iosClientId
      : Platform.OS === "android" && androidClientId
        ? androidClientId
        : webClientId
  const redirectUri = useHttpsProxy
    ? httpsRedirect()
    : AuthSession.makeRedirectUri({ scheme: "cradlink", path: "oauthredirect" })
  const implicit = useHttpsProxy || Platform.OS === "web"
  const nonce = useMemo(() => String(Date.now()), [])

  const [request] = AuthSession.useAuthRequest(
    {
      clientId: clientId || "missing.apps.googleusercontent.com",
      redirectUri,
      scopes: ["openid", "profile", "email"],
      responseType: implicit ? AuthSession.ResponseType.IdToken : AuthSession.ResponseType.Code,
      usePKCE: !implicit,
      extraParams: implicit ? { nonce } : undefined,
    },
    discovery,
  )

  return {
    ready: Boolean(request && clientId) && isGoogleConfigured(),
    prompt: async () => {
      if (!request || !clientId || !isGoogleConfigured()) throw new AppError("googleFailed")

      const authUrl = await request.makeAuthUrlAsync(discovery)
      const returnUrl = AuthSession.makeRedirectUri()
      const startUrl = useHttpsProxy
        ? `${httpsRedirect()}/start?${new URLSearchParams({ authUrl, returnUrl }).toString()}`
        : authUrl
      const browser = await WebBrowser.openAuthSessionAsync(
        startUrl,
        useHttpsProxy ? returnUrl : redirectUri,
      )

      if (browser.type === "cancel" || browser.type === "dismiss") throw new AppError("googleClosed")
      if (browser.type !== "success" || !browser.url) throw new AppError("googleFailed")

      const url = browser.url
      if (readParam(url, "error")) throw new AppError("googleFailed")

      let idToken = readParam(url, "id_token")
      let accessToken = readParam(url, "access_token")
      const code = readParam(url, "code")

      if (!idToken && !accessToken && code) {
        const tokens = await AuthSession.exchangeCodeAsync(
          {
            clientId,
            code,
            redirectUri,
            extraParams: { code_verifier: request.codeVerifier ?? "" },
          },
          discovery,
        )
        idToken = tokens.idToken ?? ""
        accessToken = tokens.accessToken ?? ""
      }

      if (!idToken && !accessToken) throw new AppError("googleFailed")
      await signInWithGoogle(idToken, accessToken)
    },
  }
}
