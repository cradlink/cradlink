import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/Button"
import { LookingForChips } from "@/components/LookingForChips"
import { Text, View } from "@/components/Themed"
import type { User } from "@/lib/types"

export function ProfileView({
  user,
  isSelf,
  hostedCount,
}: {
  user: User
  isSelf?: boolean
  hostedCount?: number
}) {
  const router = useRouter()

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <Avatar name={user.displayName} src={user.avatarUrl} size={80} />
      <Text style={styles.name}>{user.displayName}</Text>
      {user.location ? (
        <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
          {user.location}
        </Text>
      ) : null}
      {hostedCount != null ? (
        <Text style={styles.meta} lightColor="#536471" darkColor="#71767b">
          {hostedCount === 1 ? "1 activity" : `${hostedCount} activities`}
        </Text>
      ) : null}
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      {user.skills.length > 0 ? (
        <View style={styles.skills} lightColor="transparent" darkColor="transparent">
          <LookingForChips items={user.skills} limit={12} />
        </View>
      ) : null}
      {isSelf ? (
        <Button
          label="Edit profile"
          variant="outline"
          size="compact"
          onPress={() => router.push("/profile/edit")}
          style={styles.edit}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  name: {
    marginTop: 14,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  meta: {
    marginTop: 4,
    fontSize: 15,
  },
  bio: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 22,
  },
  skills: {
    marginTop: 14,
    backgroundColor: "transparent",
  },
  edit: {
    marginTop: 18,
    alignSelf: "stretch",
  },
})
