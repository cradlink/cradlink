import { useEffect, useMemo, useState } from "react"
import { StyleSheet } from "react-native"
import { useRouter } from "expo-router"

import { ActivityCard } from "@/components/ActivityCard"
import { EmptyState } from "@/components/EmptyState"
import { UnderlineTabs } from "@/components/UnderlineTabs"
import { View } from "@/components/Themed"
import { useActivities } from "@/hooks/use-activities"
import { useI18n } from "@/hooks/use-i18n"
import { firebaseActivities } from "@/lib/data/firebase"
import { isActivityPast, sortProfileActive, sortProfilePast } from "@/lib/schedule"
import type { Activity, User } from "@/lib/types"

type Tab = "active" | "past"

export function ProfileActivities({
  user,
  isSelf,
}: {
  user: User
  isSelf?: boolean
}) {
  const router = useRouter()
  const { messages, tx } = useI18n()
  const { activities } = useActivities()
  const [tab, setTab] = useState<Tab>("active")
  const [hosted, setHosted] = useState<Activity[]>([])

  useEffect(() => {
    const local = activities.filter((activity) => activity.creatorId === user.id)
    setHosted((current) => mergeHosted(local, current))
    let live = true
    void firebaseActivities
      .listCreatedBy(user.id)
      .then((rows) => {
        if (live) setHosted(mergeHosted(local, rows))
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [activities, user.id])

  const visible = useMemo(
    () => hosted.filter((activity) => activity.visibility === "public" || isSelf),
    [hosted, isSelf],
  )
  const active = useMemo(() => visible.filter((activity) => !isActivityPast(activity)).sort(sortProfileActive), [visible])
  const past = useMemo(() => visible.filter((activity) => isActivityPast(activity)).sort(sortProfilePast), [visible])
  const list = tab === "past" ? past : active

  return (
    <View style={styles.wrap} lightColor="transparent" darkColor="transparent">
      <UnderlineTabs
        value={tab}
        onChange={setTab}
        items={[
          { value: "active", label: messages.profile.tabActive },
          { value: "past", label: messages.profile.tabPast },
        ]}
      />
      {list.length === 0 ? (
        <EmptyState
          title={tab === "past" ? messages.profile.noPast : messages.profile.noActive}
          body={
            tab === "past"
              ? isSelf
                ? messages.profile.pastEmptySelf
                : tx(messages.profile.pastEmptyOther, { name: user.displayName })
              : isSelf
                ? messages.profile.activeEmptySelf
                : tx(messages.profile.activeEmptyOther, { name: user.displayName })
          }
          action={
            isSelf && tab === "active"
              ? {
                  label: messages.profile.postActivity,
                  variant: "primary",
                  onPress: () => router.push("/activities/new"),
                }
              : undefined
          }
        />
      ) : (
        list.map((activity) => <ActivityCard key={activity.id} activity={activity} />)
      )}
    </View>
  )
}

function mergeHosted(...lists: Activity[][]) {
  const byId = new Map<string, Activity>()
  for (const list of lists) {
    for (const activity of list) byId.set(activity.id, activity)
  }
  return [...byId.values()]
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
  },
})
