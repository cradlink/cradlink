import { createContext, useCallback, useContext, useMemo, useState } from "react"

import type { Activity } from "@/lib/types"

export type CardOrigin = {
  x: number
  y: number
  width: number
  height: number
}

type PreviewState = {
  activity: Activity
  origin: CardOrigin
} | null

type PreviewValue = {
  preview: PreviewState
  open: (activity: Activity, origin: CardOrigin) => void
  close: () => void
}

const PreviewContext = createContext<PreviewValue | null>(null)

export function ActivityPreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<PreviewState>(null)

  const open = useCallback((activity: Activity, origin: CardOrigin) => {
    setPreview({ activity, origin })
  }, [])

  const close = useCallback(() => setPreview(null), [])

  const value = useMemo(() => ({ preview, open, close }), [preview, open, close])

  return <PreviewContext.Provider value={value}>{children}</PreviewContext.Provider>
}

export function useActivityPreview() {
  const ctx = useContext(PreviewContext)
  if (!ctx) throw new Error("useActivityPreview must be used inside ActivityPreviewProvider")
  return ctx
}
