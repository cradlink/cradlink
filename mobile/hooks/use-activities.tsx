import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/hooks/use-auth"
import { firebaseActivities } from "@/lib/data/firebase"
import { isFirebaseConfigured } from "@/lib/env"
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@/lib/types"

type ActivitiesValue = {
  ready: boolean
  activities: Activity[]
  get: (id: string) => Activity | null
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
    if (!user || !isFirebaseConfigured()) {
      setActivities([])
      setReady(true)
      return
    }
    try {
      const [feed, created, joined] = await Promise.all([
        firebaseActivities.list({ limit: 80 }),
        firebaseActivities.listCreatedBy(user.id),
        firebaseActivities.listJoinedBy(user.id),
      ])
      setActivities(mergeActivities(feed.items, created, joined))
    } catch {
      setActivities([])
    } finally {
      setReady(true)
    }
  }, [user])

  useEffect(() => {
    setReady(false)
    void reload()
  }, [reload])

  const value = useMemo<ActivitiesValue>(() => {
    const get = (id: string) => activities.find((activity) => activity.id === id) ?? null
    return {
      ready,
      activities,
      get,
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
