import { Link, Stack } from "expo-router"
import { StyleSheet } from "react-native"

import { Text, View } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"

export default function NotFoundScreen() {
  const { messages } = useI18n()
  return (
    <>
      <Stack.Screen options={{ title: messages.notFound.title }} />
      <View style={styles.container}>
        <Text style={styles.title}>{messages.notFound.body}</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>{messages.notFound.goHome}</Text>
        </Link>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  link: {
    marginTop: 16,
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 15,
    color: "#1d9bf0",
    fontWeight: "600",
  },
})
