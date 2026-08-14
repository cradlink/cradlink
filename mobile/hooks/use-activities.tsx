import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useAuth } from "@/hooks/use-auth"
import { MOCK_ACTIVITIES } from "@/lib/mock"
import type { Activity, CreateActivityInput } from "@/lib/types"

const KEY = "cl.created-activities"

type ActivitiesValue = {
  ready: boolean
  activities: Activity[]
  get: (id: string) => Activity | null
  add: (input: CreateActivityInput) => Promise<Activity>
}

const ActivitiesContext = createContext<ActivitiesValue | null>(null)

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [created, setCreated] = useState<Activity[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setCreated(JSON.parse(raw) as Activity[])
        } catch {
          setCreated([])
        }
      }
      setReady(true)
    })
  }, [])

  const persist = useCallback(async (next: Activity[]) => {
    setCreated(next)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  const activities = useMemo(() => [...created, ...MOCK_ACTIVITIES], [created])

  const value = useMemo<ActivitiesValue>(() => {
    const get = (id: string) => activities.find((activity) => activity.id === id) ?? null
    return {
      ready,
      activities,
      get,
      add: async (input) => {
        if (!user) throw new Error("Sign in to post.")
        const now = new Date().toISOString()
        const activity: Activity = {
          id: `act_${Date.now().toString(36)}`,
          title: input.title.trim(),
          description: input.description.trim(),
          type: input.type,
          lookingFor: input.lookingFor,
          tags: input.tags ?? [],
          location: input.location,
          startAt: input.startAt,
          endAt: input.endAt,
          isFlexible: input.isFlexible,
          capacity: input.capacity,
          joinPolicy: input.joinPolicy ?? "auto",
          headcount: input.headcount ?? { mode: "open" },
          creatorId: user.id,
          creatorName: user.displayName,
          creatorAvatar: user.avatarUrl,
          memberCount: 1,
          status: "open",
          createdAt: now,
          updatedAt: now,
          visibility: input.visibility ?? "public",
          images: input.images ?? [],
        }
        await persist([activity, ...created])
        return activity
      },
    }
  }, [activities, created, persist, ready, user])

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext)
  if (!ctx) throw new Error("useActivities must be used inside ActivitiesProvider")
  return ctx
}
