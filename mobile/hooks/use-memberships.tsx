import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useAuth } from "@/hooks/use-auth"
import type { Activity } from "@/lib/types"

const KEY = "cl.memberships"

export type MembershipStatus = "joined" | "pending"
type Store = Record<string, Record<string, MembershipStatus>>

type MembershipsValue = {
  ready: boolean
  statusOf: (activityId: string) => MembershipStatus | null
  join: (activity: Activity) => Promise<void>
  leave: (activityId: string) => Promise<void>
  decorate: (activity: Activity) => Activity
  isOrganizer: (activity: Activity) => boolean
  isFull: (activity: Activity) => boolean
  joinedIds: string[]
  reload: () => Promise<void>
}

const MembershipsContext = createContext<MembershipsValue | null>(null)

function hardCap(activity: Activity) {
  const mode = activity.headcount?.mode
  if (mode === "limit" || mode === "range") {
    return activity.headcount?.max ?? activity.capacity ?? null
  }
  return activity.capacity
}

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
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

  const reload = useCallback(async () => {
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
  }, [])

  const persist = useCallback(async (next: Store) => {
    setStore(next)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  const mine = user ? (store[user.id] ?? {}) : {}

  const value = useMemo<MembershipsValue>(() => {
    const statusOf = (activityId: string) => mine[activityId] ?? null
    const isOrganizer = (activity: Activity) => Boolean(user && user.id === activity.creatorId)
    const decorate = (activity: Activity) => {
      const extra = statusOf(activity.id) === "joined" && !isOrganizer(activity) ? 1 : 0
      return { ...activity, memberCount: activity.memberCount + extra }
    }
    const isFull = (activity: Activity) => {
      const viewed = decorate(activity)
      const cap = hardCap(viewed)
      return cap != null && viewed.memberCount >= cap
    }
    return {
      ready,
      statusOf,
      isOrganizer,
      decorate,
      isFull,
      joinedIds: Object.entries(mine)
        .filter(([, status]) => status === "joined" || status === "pending")
        .map(([id]) => id),
      join: async (activity) => {
        if (!user || isOrganizer(activity) || isFull(activity)) return
        const nextStatus: MembershipStatus = activity.joinPolicy === "manual" ? "pending" : "joined"
        await persist({
          ...store,
          [user.id]: { ...mine, [activity.id]: nextStatus },
        })
      },
      leave: async (activityId) => {
        if (!user) return
        const nextMine = { ...mine }
        delete nextMine[activityId]
        await persist({ ...store, [user.id]: nextMine })
      },
      reload,
    }
  }, [mine, persist, ready, reload, store, user])

  return <MembershipsContext.Provider value={value}>{children}</MembershipsContext.Provider>
}

export function useMemberships() {
  const ctx = useContext(MembershipsContext)
  if (!ctx) throw new Error("useMemberships must be used inside MembershipProvider")
  return ctx
}
