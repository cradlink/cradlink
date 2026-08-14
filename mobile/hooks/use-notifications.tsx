import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { formatShortWhen } from "@/lib/schedule"
import type { Activity, AppNotification, NotificationType } from "@/lib/types"

const KEY = "cl.notifications"

type Store = Record<string, AppNotification[]>

type NotificationsValue = {
  ready: boolean
  items: AppNotification[]
  unread: number
  markRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
  notifyHost: (activity: Activity, type: Extract<NotificationType, "joined" | "request">) => Promise<void>
  reload: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsValue | null>(null)

function createId() {
  return `ntf_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function seedFor(userId: string, hosted: Activity[]): AppNotification[] {
  const now = Date.now()
  const first = hosted[0]
  const requested = hosted.find((activity) => activity.joinPolicy === "manual") ?? hosted[1]
  const items: AppNotification[] = []

  if (first) {
    items.push({
      id: `seed_joined_${first.id}`,
      userId,
      type: "joined",
      activityId: first.id,
      actorName: "Ana Kovač",
      actorAvatar: null,
      title: `Ana Kovač joined ${first.title}`,
      body: "They’re on the list.",
      createdAt: new Date(now - 2 * 3600_000).toISOString(),
      read: false,
    })
    items.push({
      id: `seed_soon_${first.id}`,
      userId,
      type: "reminder",
      activityId: first.id,
      actorName: first.creatorName,
      actorAvatar: first.creatorAvatar,
      title: first.title,
      body: first.isFlexible || !first.startAt ? "Coming up — flexible date." : `Up next · ${formatShortWhen(first)}`,
      createdAt: new Date(now - 20 * 3600_000).toISOString(),
      read: false,
    })
  }

  if (requested && requested.id !== first?.id) {
    items.push({
      id: `seed_req_${requested.id}`,
      userId,
      type: "request",
      activityId: requested.id,
      actorName: "Luka Ilić",
      actorAvatar: null,
      title: `Luka Ilić requested to join ${requested.title}`,
      body: "Open the activity to review.",
      createdAt: new Date(now - 28 * 3600_000).toISOString(),
      read: false,
    })
  }

  return items
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { activities, ready: activitiesReady } = useActivities()
  const [store, setStore] = useState<Store>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setStore(JSON.parse(raw) as Store)
        } catch {
          setStore({})
        }
      }
      setReady(true)
    })
  }, [])

  const persist = useCallback(async (next: Store) => {
    setStore(next)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  useEffect(() => {
    if (!ready || !activitiesReady || !user) return
    if (store[user.id]) return
    const hosted = activities.filter((activity) => activity.creatorId === user.id)
    void persist({ ...store, [user.id]: seedFor(user.id, hosted) })
  }, [activities, activitiesReady, persist, ready, store, user])

  const items = useMemo(() => {
    if (!user) return []
    return [...(store[user.id] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [store, user])

  const value = useMemo<NotificationsValue>(() => {
    return {
      ready,
      items,
      unread: items.filter((item) => !item.read).length,
      markRead: async (id) => {
        if (!user) return
        await persist({
          ...store,
          [user.id]: (store[user.id] ?? []).map((item) => (item.id === id ? { ...item, read: true } : item)),
        })
      },
      markAllRead: async () => {
        if (!user) return
        await persist({
          ...store,
          [user.id]: (store[user.id] ?? []).map((item) => ({ ...item, read: true })),
        })
      },
      notifyHost: async (activity, type) => {
        if (!user || user.id === activity.creatorId) return
        const next: AppNotification = {
          id: createId(),
          userId: activity.creatorId,
          type,
          activityId: activity.id,
          actorName: user.displayName,
          actorAvatar: user.avatarUrl,
          title:
            type === "request"
              ? `${user.displayName} requested to join ${activity.title}`
              : `${user.displayName} joined ${activity.title}`,
          body: type === "request" ? "Open the activity to review." : "They’re on the list.",
          createdAt: new Date().toISOString(),
          read: false,
        }
        const hostList = store[activity.creatorId] ?? []
        await persist({ ...store, [activity.creatorId]: [next, ...hostList] })
      },
      reload: async () => {
        const raw = await AsyncStorage.getItem(KEY)
        if (!raw) {
          setStore({})
          return
        }
        try {
          setStore(JSON.parse(raw) as Store)
        } catch {
          setStore({})
        }
      },
    }
  }, [items, persist, ready, store, user])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider")
  return ctx
}
