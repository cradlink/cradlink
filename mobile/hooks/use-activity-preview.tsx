import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

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
  dismiss: () => void
  registerCloser: (fn: (() => void) | null) => void
}

type ReviewValue = {
  reviewOpen: boolean
  setReviewOpen: (open: boolean) => void
}

const PreviewContext = createContext<PreviewValue | null>(null)
const ReviewContext = createContext<ReviewValue | null>(null)

export function ActivityPreviewProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<PreviewState>(null)
  const [reviewOpen, setReviewOpenState] = useState(false)
  const closer = useRef<() => void>(() => setPreview(null))

  const open = useCallback((activity: Activity, origin: CardOrigin) => {
    setReviewOpenState(false)
    setPreview({ activity, origin })
  }, [])

  const setReviewOpen = useCallback((next: boolean) => {
    setReviewOpenState(next)
  }, [])

  const close = useCallback(() => {
    setReviewOpenState(false)
    setPreview(null)
  }, [])

  const registerCloser = useCallback((fn: (() => void) | null) => {
    closer.current = fn ?? (() => setPreview(null))
  }, [])

  const dismiss = useCallback(() => {
    closer.current()
  }, [])

  const previewValue = useMemo(
    () => ({ preview, open, close, dismiss, registerCloser }),
    [preview, open, close, dismiss, registerCloser],
  )

  const reviewValue = useMemo(
    () => ({ reviewOpen, setReviewOpen }),
    [reviewOpen, setReviewOpen],
  )

  return (
    <PreviewContext.Provider value={previewValue}>
      <ReviewContext.Provider value={reviewValue}>{children}</ReviewContext.Provider>
    </PreviewContext.Provider>
  )
}

export function useActivityPreview() {
  const ctx = useContext(PreviewContext)
  if (!ctx) throw new Error("useActivityPreview must be used inside ActivityPreviewProvider")
  return ctx
}

export function usePreviewReview() {
  const ctx = useContext(ReviewContext)
  if (!ctx) throw new Error("usePreviewReview must be used inside ActivityPreviewProvider")
  return ctx
}
