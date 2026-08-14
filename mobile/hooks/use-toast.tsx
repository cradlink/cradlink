import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react"

export type ToastMessage = {
  title: string
  body?: string
}

type ToastValue = {
  toast: ToastMessage | null
  show: (toast: ToastMessage) => void
}

const ToastContext = createContext<ToastValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback((next: ToastMessage) => {
    if (timer.current) clearTimeout(timer.current)
    setToast(next)
    timer.current = setTimeout(() => setToast(null), 2800)
  }, [])

  const value = useMemo(() => ({ toast, show }), [show, toast])
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used inside ToastProvider")
  return ctx
}
