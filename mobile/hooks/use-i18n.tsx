import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import {
  detectLocale,
  getDateLocale,
  getLocale,
  getMessages,
  isLocale,
  setLocaleState,
  subscribeLocale,
  tx,
  type Locale,
  type Messages,
} from "@/lib/i18n"

const KEY = "cl.locale"

type I18nValue = {
  ready: boolean
  locale: Locale
  messages: Messages
  dateLocale: string
  setLocale: (next: Locale) => Promise<void>
  tx: typeof tx
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleValue] = useState<Locale>(getLocale)
  const [ready, setReady] = useState(false)

  useEffect(() => subscribeLocale(() => setLocaleValue(getLocale())), [])

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((raw) => {
      setLocaleState(isLocale(raw) ? raw : detectLocale())
      setReady(true)
    })
  }, [])

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next)
    await AsyncStorage.setItem(KEY, next)
  }, [])

  const value = useMemo<I18nValue>(
    () => ({
      ready,
      locale,
      messages: getMessages(),
      dateLocale: getDateLocale(),
      setLocale,
      tx,
    }),
    [locale, ready, setLocale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider")
  return ctx
}
