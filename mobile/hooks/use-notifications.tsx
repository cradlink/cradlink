import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { AppState } from "react-native"

import { useAuth } from "@/hooks/use-auth"
import { useI18n } from "@/hooks/use-i18n"
import { useToast } from "@/hooks/use-toast"
import { markNotificationRead, markNotificationsRead, watchNotifications, writeNotification } from "@/lib/data/social"
import { isFirebaseConfigured } from "@/lib/env"
import type { Activity, AppNotification, NotificationType } from "@/lib/types"

type NotificationsValue = {
  ready: boolean
  items: AppNotification[]
  unread: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  notifyHost: (activity: Activity, type: Extract<NotificationType, "joined" | "request">) => Promise<void>
  notifyUser: (
    userId: string,
    input: {
      type: NotificationType
      activityId: string | null
      actorId?: string | null
      actorName: string
      actorAvatar: string | null
      title: string
      body: string
    },
  ) => Promise<void>
  reload: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsValue | null>(null)

function toastFor(item: AppNotification, fallback: string) {
  if (item.type === "reply" && item.actorName) return `${item.actorName} · ${item.title || fallback}`
  return item.title || item.actorName || fallback
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { show } = useToast()
  const { messages } = useI18n()
  const [items, setItems] = useState<AppNotification[]>([])
  const [ready, setReady] = useState(false)
  const [generation, setGeneration] = useState(0)
  const known = useRef(new Set<string>())
  const booted = useRef(false)
  const showRef = useRef(show)
  const titleRef = useRef(messages.notifications.title)
  showRef.current = show
  titleRef.current = messages.notifications.title

  useEffect(() => {
    known.current = new Set()
    booted.current = false
  }, [user?.id])

  useEffect(() => {
    if (!user?.username || !isFirebaseConfigured()) {
      setItems([])
      setReady(true)
      return
    }

    let active = true
    let stop: (() => void) | undefined

    function attach() {
      if (!user || !active) return
      stop?.()
      stop = watchNotifications(
        user.id,
        (next) => {
          if (!active) return
          if (!booted.current) {
            next.forEach((item) => known.current.add(item.id))
            booted.current = true
          } else {
            for (const item of next) {
              if (item.read || known.current.has(item.id)) continue
              known.current.add(item.id)
              if (item.actorId && item.actorId === user.id) continue
              showRef.current({ title: toastFor(item, titleRef.current) })
            }
          }
          setItems(next)
          setReady(true)
        },
        () => {
          if (active) setReady(true)
        },
      )
    }

    attach()
    const app = AppState.addEventListener("change", (state) => {
      if (state === "active") attach()
    })

    return () => {
      active = false
      stop?.()
      app.remove()
    }
  }, [generation, user])

  const value = useMemo<NotificationsValue>(() => {
    return {
      ready,
      items,
      unread: items.filter((item) => !item.read).length,
      markRead: async (id) => {
        await markNotificationRead(id)
      },
      markAllRead: async () => {
        await markNotificationsRead(items.filter((item) => !item.read).map((item) => item.id))
      },
      notifyUser: async (userId, input) => {
        await writeNotification({ userId, ...input })
      },
      notifyHost: async (activity, type) => {
        if (!user || user.id === activity.creatorId) return
        await writeNotification({
          userId: activity.creatorId,
          type,
          activityId: activity.id,
          activityTitle: activity.title,
          actorId: user.id,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          title:
            type === "request"
              ? `${user.displayName} requested to join ${activity.title}`
              : `${user.displayName} joined ${activity.title}`,
          body: type === "request" ? "Open the activity to review." : "They’re on the list.",
        })
      },
      reload: async () => {
        setGeneration((value) => value + 1)
      },
    }
  }, [items, ready, user])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider")
  return ctx
}
