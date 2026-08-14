import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"
import { SymbolView } from "expo-symbols"

import { useTheme } from "@/components/Themed"
import { useActivityPreview } from "@/hooks/use-activity-preview"
import { useI18n } from "@/hooks/use-i18n"

export function EditPencil({
  activityId,
  light = false,
}: {
  activityId: string
  light?: boolean
}) {
  const theme = useTheme()
  const router = useRouter()
  const { preview, dismiss } = useActivityPreview()
  const { messages } = useI18n()

  return (
    <Pressable
      hitSlop={10}
      accessibilityLabel={messages.activity.editA11y}
      onPress={() => {
        if (preview?.activity.id === activityId) dismiss()
        router.push(`/activities/edit/${activityId}`)
      }}
      style={({ pressed }) => [styles.btn, light && styles.light, { opacity: pressed ? 0.7 : 1 }]}
    >
      <SymbolView
        name={{ ios: "pencil", android: "edit", web: "edit" }}
        tintColor={theme.mutedForeground}
        size={16}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  light: {
    backgroundColor: "rgba(22,24,28,0.85)",
  },
})
