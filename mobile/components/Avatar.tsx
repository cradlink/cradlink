import { Image, StyleSheet, View, type ImageSourcePropType } from "react-native"

import { GeneratedArt } from "@/components/GeneratedArt"
import { Text, useTheme } from "@/components/Themed"
import { isGeneratedArt } from "@/lib/generated-art"
import { initials } from "@/lib/initials"

const LOCAL_AVATARS: Record<string, ImageSourcePropType> = {
  "local:self": require("../assets/images/cradlink-1024.png"),
}

export function Avatar({
  name,
  src,
  size = 40,
}: {
  name: string
  src?: string | null
  size?: number
}) {
  const theme = useTheme()
  const local = src ? LOCAL_AVATARS[src] : undefined

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#333639",
        },
      ]}
    >
      {local ? (
        <Image source={local} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : src && isGeneratedArt(src) ? (
        <GeneratedArt uri={src} iconSize={Math.round(size * 0.58)} style={{ width: size, height: size }} />
      ) : src ? (
        <Image source={{ uri: src }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.32, color: theme.foreground }]}>
          {initials(name)}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initials: {
    fontWeight: "700",
  },
})
