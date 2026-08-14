import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"

export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {hint ? (
        <Text style={styles.hint} lightColor="#536471" darkColor="#71767b">
          {hint}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
    backgroundColor: "transparent",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  hint: {
    marginTop: 2,
    fontSize: 13,
  },
})
