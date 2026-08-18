import { useEffect } from "react"
import { AppState } from "react-native"

import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useMemberships } from "@/hooks/use-memberships"
import { useToast } from "@/hooks/use-toast"
import { ensureActivityReminders } from "@/lib/data/reminders"
import { isFirebaseConfigured } from "@/lib/env"
import { showLocalAlert } from "@/lib/local-alert"

export function useActivityReminders() {
  const { user } = useAuth()
  const { activities } = useActivities()
  const { joinedIds, ready } = useMemberships()
  const { show } = useToast()
  const { messages } = useI18n()

  useEffect(() => {
    if (!user?.username || !ready || !isFirebaseConfigured()) return

    const mine = activities.filter((activity) => activity.creatorId === user.id || joinedIds.includes(activity.id))
    if (mine.length === 0) return

    const run = () =>
      ensureActivityReminders(user, mine, (kind, activity) => {
        const title = kind === "reminder_hour" ? messages.alerts.inAnHour : messages.alerts.tomorrow
        show({ title: `${title} · ${activity.title}` })
        void showLocalAlert(title, activity.title)
      }).catch(() => undefined)

    void run()
    const timer = setInterval(() => {
      void run()
    }, 60_000)
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") void run()
    })
    return () => {
      clearInterval(timer)
      app.remove()
    }
  }, [activities, joinedIds, messages.alerts.inAnHour, messages.alerts.tomorrow, ready, show, user])
}
