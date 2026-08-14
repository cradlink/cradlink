import { StyleSheet } from "react-native"

import { EmptyState } from "@/components/EmptyState"
import { View } from "@/components/Themed"

export default function NewActivityScreen() {
  return (
    <View style={styles.screen}>
      <EmptyState
        title="Create an activity"
        body="The form is next. Same fields as the web app: type, place, time, headcount, looking-for."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
})
