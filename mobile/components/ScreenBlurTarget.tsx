import { useRef } from "react"
import { StyleSheet, type StyleProp, type View, type ViewStyle } from "react-native"
import { BlurTargetView } from "expo-blur"

import { useRegisterBlurTarget } from "@/hooks/use-blur-target"

export function ScreenBlurTarget({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const ref = useRef<View | null>(null)
  useRegisterBlurTarget(ref)
  return (
    <BlurTargetView ref={ref} collapsable={false} style={[styles.fill, style]}>
      {children}
    </BlurTargetView>
  )
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
})
