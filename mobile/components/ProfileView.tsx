import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/Button"
import { LookingForChips } from "@/components/LookingForChips"
import { Text, View } from "@/components/Themed"
import { useI18n } from "@/hooks/use-i18n"
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
  const { messages, tx } = useI18n()

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <View style={styles.hero} lightColor="transparent" darkColor="transparent">
        <Avatar name={user.displayName} src={user.avatarUrl} size={80} />
        <View style={styles.identity} lightColor="transparent" darkColor="transparent">
          <Text style={styles.name} numberOfLines={2}>
            {user.displayName}
          </Text>
          {user.location ? (
            <Text style={styles.meta} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
              {user.location}
            </Text>
          ) : null}
          {hostedCount != null ? (
            <Text style={styles.meta} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
              {hostedCount === 1
                ? messages.profile.oneActivity
                : tx(messages.profile.manyActivities, { count: hostedCount })}
            </Text>
          ) : null}
        </View>
      </View>
      {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
      {user.skills.length > 0 ? (
        <View style={styles.skills} lightColor="transparent" darkColor="transparent">
          <LookingForChips items={user.skills} limit={12} />
        </View>
      ) : null}
      {isSelf ? (
        <Button
          label={messages.profile.edit}
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
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    gap: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 26,
  },
  meta: {
    fontSize: 15,
    lineHeight: 19,
  },
  bio: {
    marginTop: 16,
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
