import { Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Avatar } from "@/components/Avatar"
import { FollowButton } from "@/components/FollowButton"
import { Text, View, useTheme } from "@/components/Themed"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { handleOf, type User } from "@/lib/types"

export function UserRow({
  person,
  followsYou,
}: {
  person: User
  followsYou?: boolean
}) {
  const router = useRouter()
  const theme = useTheme()
  const { user } = useAuth()
  const { messages } = useI18n()
  const isSelf = person.id === user?.id

  return (
    <Pressable
      onPress={() => (isSelf ? router.push("/profile") : router.push(`/u/${person.id}`))}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: theme.border, backgroundColor: pressed ? theme.hover : "transparent" },
      ]}
    >
      <Avatar name={person.displayName} src={person.avatarUrl} size={40} />
      <View style={styles.text} lightColor="transparent" darkColor="transparent">
        <Text style={styles.name} numberOfLines={1}>
          {person.displayName}
        </Text>
        <Text style={styles.meta} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
          {handleOf(person)}
          {followsYou ? ` · ${messages.connections.followsYou}` : ""}
        </Text>
      </View>
      {isSelf ? null : (
        <View style={styles.action} lightColor="transparent" darkColor="transparent">
          <FollowButton person={person} />
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 13,
  },
  action: {
    flexShrink: 0,
  },
})
