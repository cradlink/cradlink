import { createContext, useCallback, useContext, useMemo, useState } from "react"

export type ConfirmPrompt = {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
}

type ConfirmValue = {
  prompt: ConfirmPrompt | null
  ask: (prompt: ConfirmPrompt) => void
  dismiss: () => void
}

const ConfirmContext = createContext<ConfirmValue | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<ConfirmPrompt | null>(null)
  const ask = useCallback((next: ConfirmPrompt) => setPrompt(next), [])
  const dismiss = useCallback(() => setPrompt(null), [])
  const value = useMemo(() => ({ prompt, ask, dismiss }), [ask, dismiss, prompt])
  return <ConfirmContext.Provider value={value}>{children}</ConfirmContext.Provider>
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used inside ConfirmProvider")
  return ctx
}
