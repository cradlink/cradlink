import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/hooks/use-auth"
import { firebaseActivities, watchMembers, watchPublicActivities } from "@/lib/data/firebase"
import { isFirebaseConfigured } from "@/lib/env"
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@/lib/types"

type ActivitiesValue = {
  ready: boolean
  activities: Activity[]
  get: (id: string) => Activity | null
  ensure: (id: string) => Promise<Activity | null>
  add: (input: CreateActivityInput) => Promise<Activity>
  update: (id: string, input: UpdateActivityInput) => Promise<Activity>
  remove: (id: string) => Promise<void>
  reload: () => Promise<void>
}

const ActivitiesContext = createContext<ActivitiesValue | null>(null)

function mergeActivities(...lists: Activity[][]) {
  const byId = new Map<string, Activity>()
  for (const list of lists) {
    for (const activity of list) byId.set(activity.id, activity)
  }
  return [...byId.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [activities, setActivities] = useState<Activity[]>([])
  const [ready, setReady] = useState(false)

  const reload = useCallback(async () => {
    if (!user?.username || !isFirebaseConfigured()) {
      setActivities([])
      setReady(true)
      return
    }
    try {
      const [feed, created, joined] = await Promise.allSettled([
        firebaseActivities.list({ limit: 80 }),
        firebaseActivities.listCreatedBy(user.id),
        firebaseActivities.listJoinedBy(user.id),
      ])
      setActivities(
        mergeActivities(
          feed.status === "fulfilled" ? feed.value.items : [],
          created.status === "fulfilled" ? created.value : [],
          joined.status === "fulfilled" ? joined.value : [],
        ),
      )
    } catch (err) {
      if (__DEV__) console.warn("[activities]", err)
    } finally {
      setReady(true)
    }
  }, [user])

  useEffect(() => {
    if (!user?.username || !isFirebaseConfigured()) {
      setActivities([])
      setReady(true)
      return
    }

    let publicItems: Activity[] = []
    let extraItems: Activity[] = []

    const publish = () => {
      setActivities(mergeActivities(publicItems, extraItems))
      setReady(true)
    }

    const refreshExtra = async () => {
      const [created, joined] = await Promise.allSettled([
        firebaseActivities.listCreatedBy(user.id),
        firebaseActivities.listJoinedBy(user.id),
      ])
      extraItems = mergeActivities(
        created.status === "fulfilled" ? created.value : [],
        joined.status === "fulfilled" ? joined.value : [],
      )
      publish()
    }

    const unsubActs = watchPublicActivities((items) => {
      publicItems = items
      publish()
      void refreshExtra()
    })
    const unsubMem = watchMembers((rows) => {
      if (rows.some((row) => row.userId === user.id)) void refreshExtra()
    })
    void refreshExtra()
    return () => {
      unsubActs()
      unsubMem()
    }
  }, [user])

  const value = useMemo<ActivitiesValue>(() => {
    const get = (id: string) => activities.find((activity) => activity.id === id) ?? null
    return {
      ready,
      activities,
      get,
      ensure: async (id) => {
        const hit = get(id)
        if (hit) return hit
        const row = await firebaseActivities.getById(id)
        if (row) setActivities((current) => mergeActivities([row], current))
        return row
      },
      reload,
      add: async (input) => {
        if (!user) throw new Error("signInToPost")
        const activity = await firebaseActivities.create(user, input)
        setActivities((current) => mergeActivities([activity], current))
        return activity
      },
      update: async (id, input) => {
        if (!user) throw new Error("signInToEdit")
        const next = await firebaseActivities.update(id, user.id, input)
        setActivities((current) => current.map((activity) => (activity.id === id ? next : activity)))
        return next
      },
      remove: async (id) => {
        if (!user) throw new Error("signInToEdit")
        await firebaseActivities.remove(id, user.id)
        setActivities((current) => current.filter((activity) => activity.id !== id))
      },
    }
  }, [activities, ready, reload, user])

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext)
  if (!ctx) throw new Error("useActivities must be used inside ActivitiesProvider")
  return ctx
}
