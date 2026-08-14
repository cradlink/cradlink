import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body} lightColor="#536471" darkColor="#71767b">
        {body}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 32,
    paddingVertical: 64,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  body: {
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
})
