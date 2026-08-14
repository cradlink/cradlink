import { createContext, useCallback, useContext, useMemo, useState, type RefObject } from "react"
import type { View } from "react-native"
import { useFocusEffect } from "expo-router"

const BlurTargetContext = createContext<{
  target: RefObject<View | null> | null
  setTarget: (ref: RefObject<View | null> | null) => void
}>({
  target: null,
  setTarget: () => {},
})

export function BlurTargetProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<RefObject<View | null> | null>(null)
  const value = useMemo(() => ({ target, setTarget }), [target])
  return <BlurTargetContext.Provider value={value}>{children}</BlurTargetContext.Provider>
}

export function useBlurTarget() {
  return useContext(BlurTargetContext).target
}

export function useRegisterBlurTarget(ref: RefObject<View | null>) {
  const { setTarget } = useContext(BlurTargetContext)
  useFocusEffect(
    useCallback(() => {
      setTarget(ref)
    }, [ref, setTarget]),
  )
}
