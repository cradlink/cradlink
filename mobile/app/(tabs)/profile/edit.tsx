import { StyleSheet } from "react-native"

import { EmptyState } from "@/components/EmptyState"
import { View } from "@/components/Themed"

export default function EditProfileScreen() {
  return (
    <View style={styles.screen}>
      <EmptyState
        title="Edit profile"
        body="Form comes next. Same fields as the web app: name, bio, skills, location, avatar."
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
})
