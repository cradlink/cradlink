import { Image, Pressable, StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { Avatar } from "@/components/Avatar"
import { Button } from "@/components/Button"
import { FollowButton } from "@/components/FollowButton"
import { FollowInbox } from "@/components/FollowInbox"
import { GeneratedArt } from "@/components/GeneratedArt"
import { LookingForChips } from "@/components/LookingForChips"
import { Text, View, useTheme } from "@/components/Themed"
import { useConnections } from "@/hooks/use-connections"
import { useI18n } from "@/hooks/use-i18n"
import { isGeneratedArt } from "@/lib/generated-art"
import { handleOf, type User } from "@/lib/types"

export function ProfileView({
  user,
  isSelf,
}: {
  user: User
  isSelf?: boolean
}) {
  const router = useRouter()
  const theme = useTheme()
  const { messages, tx } = useI18n()
  const { followerCount, followingCount } = useConnections()
  const followers = followerCount(user.id)
  const following = followingCount(user.id)

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <View style={styles.banner} lightColor="#333639" darkColor="#333639">
        {user.bannerUrl && isGeneratedArt(user.bannerUrl) ? (
          <GeneratedArt uri={user.bannerUrl} iconSize={56} style={styles.bannerImage} />
        ) : user.bannerUrl ? (
          <Image source={{ uri: user.bannerUrl }} style={styles.bannerImage} />
        ) : null}
      </View>

      <View style={styles.body} lightColor="transparent" darkColor="transparent">
        <View style={styles.toolbar} lightColor="transparent" darkColor="transparent">
          <View style={[styles.avatarRing, { backgroundColor: theme.background }]}>
            <Avatar name={user.displayName} src={user.avatarUrl} size={88} />
          </View>
          <View style={styles.actions} lightColor="transparent" darkColor="transparent">
            {isSelf ? (
              <Button
                label={messages.profile.edit}
                variant="outline"
                size="compact"
                onPress={() => router.push("/profile/edit")}
              />
            ) : (
              <FollowButton person={user} />
            )}
          </View>
        </View>

        <Text style={styles.name} numberOfLines={2}>
          {user.displayName}
        </Text>
        <Text style={styles.handle} numberOfLines={1} lightColor="#8b98a5" darkColor="#8b98a5">
          {handleOf(user)}
        </Text>

        {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}

        {user.location ? (
          <Text style={styles.location} numberOfLines={1} lightColor="#536471" darkColor="#71767b">
            {user.location}
          </Text>
        ) : null}

        <View style={styles.stats} lightColor="transparent" darkColor="transparent">
          <Pressable onPress={() => router.push(`/connections?userId=${user.id}&tab=followers`)}>
            <Text style={styles.stat} lightColor="#536471" darkColor="#71767b">
              {followers === 1 ? messages.profile.oneFollower : tx(messages.profile.manyFollowers, { count: followers })}
            </Text>
          </Pressable>
          <Text style={styles.statDot} lightColor="#536471" darkColor="#71767b">
            {" · "}
          </Text>
          <Pressable onPress={() => router.push(`/connections?userId=${user.id}&tab=following`)}>
            <Text style={styles.stat} lightColor="#536471" darkColor="#71767b">
              {tx(messages.profile.followingCount, { count: following })}
            </Text>
          </Pressable>
        </View>

        {user.skills.length > 0 ? (
          <View style={styles.skills} lightColor="transparent" darkColor="transparent">
            <LookingForChips items={user.skills} limit={12} />
          </View>
        ) : null}
        {isSelf ? <FollowInbox /> : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 8,
  },
  banner: {
    height: 120,
    overflow: "hidden",
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 0,
    overflow: "visible",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: -44,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 52,
  },
  actions: {
    paddingTop: 60,
    alignItems: "flex-end",
  },
  name: {
    marginTop: 12,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  handle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 22,
  },
  bio: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 20,
  },
  location: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 19,
  },
  stats: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  stat: {
    fontSize: 15,
    lineHeight: 20,
  },
  statDot: {
    fontSize: 15,
    lineHeight: 20,
  },
  skills: {
    marginTop: 14,
    backgroundColor: "transparent",
  },
})
