import { doc, getDoc, setDoc } from "firebase/firestore"

import { getFirebaseDb } from "@/lib/firebase"
import type { Activity, User } from "@/lib/types"
import { nowIso, stripUndefined } from "@/lib/utils"

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

export function reminderId(kind: "reminder_day" | "reminder_hour", activityId: string, userId: string) {
  return `${kind}_${activityId}_${userId}`
}

export async function ensureReminder(input: {
  kind: "reminder_day" | "reminder_hour"
  userId: string
  activityId: string
  activityTitle: string
}) {
  const id = reminderId(input.kind, input.activityId, input.userId)
  const ref = doc(getFirebaseDb(), "notifications", id)
  const existing = await getDoc(ref)
  if (existing.exists()) return { created: false }
  await setDoc(
    ref,
    stripUndefined({
      id,
      recipientId: input.userId,
      kind: input.kind,
      activityId: input.activityId,
      activityTitle: input.activityTitle,
      actorId: input.userId,
      createdAt: nowIso(),
      read: false,
    }),
  )
  return { created: true }
}

export async function ensureActivityReminders(
  user: User,
  activities: Activity[],
  onCreated: (kind: "reminder_day" | "reminder_hour", activity: Activity) => void,
) {
  const now = Date.now()
  const seen = new Set<string>()

  for (const activity of activities) {
    if (seen.has(activity.id) || activity.isFlexible || !activity.startAt) continue
    seen.add(activity.id)
    const start = new Date(activity.startAt).getTime()
    if (Number.isNaN(start) || start <= now) continue

    if (now >= start - DAY) {
      const result = await ensureReminder({
        kind: "reminder_day",
        userId: user.id,
        activityId: activity.id,
        activityTitle: activity.title,
      })
      if (result.created) onCreated("reminder_day", activity)
    }

    if (now >= start - HOUR) {
      const result = await ensureReminder({
        kind: "reminder_hour",
        userId: user.id,
        activityId: activity.id,
        activityTitle: activity.title,
      })
      if (result.created) onCreated("reminder_hour", activity)
    }
  }
}
