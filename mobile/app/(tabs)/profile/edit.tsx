import { StyleSheet } from "react-native"

import { EmptyState } from "@/components/EmptyState"
import { Refreshable, Stagger } from "@/components/Refreshable"

export default function EditProfileScreen() {
  return (
    <Refreshable contentContainerStyle={styles.list}>
      <Stagger>
        <EmptyState
          key="empty"
          title="Edit profile"
          body="Form comes next. Same fields as the web app: name, bio, skills, location, avatar."
        />
      </Stagger>
    </Refreshable>
  )
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
})
