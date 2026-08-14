import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useAuth } from "@/hooks/use-auth"
import { MOCK_ACTIVITIES } from "@/lib/mock"
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@/lib/types"

const CREATED_KEY = "cl.created-activities"
const EDITS_KEY = "cl.edited-activities"

type ActivitiesValue = {
  ready: boolean
  activities: Activity[]
  get: (id: string) => Activity | null
  add: (input: CreateActivityInput) => Promise<Activity>
  update: (id: string, input: UpdateActivityInput) => Promise<Activity>
  reload: () => Promise<void>
}

const ActivitiesContext = createContext<ActivitiesValue | null>(null)

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [created, setCreated] = useState<Activity[]>([])
  const [edits, setEdits] = useState<Record<string, Activity>>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(CREATED_KEY), AsyncStorage.getItem(EDITS_KEY)]).then(
      ([createdRaw, editsRaw]) => {
        if (createdRaw) {
          try {
            setCreated(JSON.parse(createdRaw) as Activity[])
          } catch {
            setCreated([])
          }
        }
        if (editsRaw) {
          try {
            setEdits(JSON.parse(editsRaw) as Record<string, Activity>)
          } catch {
            setEdits({})
          }
        }
        setReady(true)
      },
    )
  }, [])

  const reload = useCallback(async () => {
    const [createdRaw, editsRaw] = await Promise.all([
      AsyncStorage.getItem(CREATED_KEY),
      AsyncStorage.getItem(EDITS_KEY),
    ])
    if (createdRaw) {
      try {
        setCreated(JSON.parse(createdRaw) as Activity[])
      } catch {
        setCreated([])
      }
    } else {
      setCreated([])
    }
    if (editsRaw) {
      try {
        setEdits(JSON.parse(editsRaw) as Record<string, Activity>)
      } catch {
        setEdits({})
      }
    } else {
      setEdits({})
    }
  }, [])

  const persist = useCallback(async (next: Activity[]) => {
    setCreated(next)
    await AsyncStorage.setItem(CREATED_KEY, JSON.stringify(next))
  }, [])

  const persistEdits = useCallback(async (next: Record<string, Activity>) => {
    setEdits(next)
    await AsyncStorage.setItem(EDITS_KEY, JSON.stringify(next))
  }, [])

  const activities = useMemo(
    () => [...created, ...MOCK_ACTIVITIES.filter((activity) => !created.some((row) => row.id === activity.id))].map(
      (activity) => edits[activity.id] ?? activity,
    ),
    [created, edits],
  )

  const value = useMemo<ActivitiesValue>(() => {
    const get = (id: string) => activities.find((activity) => activity.id === id) ?? null
    return {
      ready,
      activities,
      get,
      reload,
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
      update: async (id, input) => {
        if (!user) throw new Error("Sign in to edit.")
        const existing = activities.find((activity) => activity.id === id)
        if (!existing) throw new Error("Activity not found.")
        if (existing.creatorId !== user.id) throw new Error("Only the organizer can edit.")
        const now = new Date().toISOString()
        const next: Activity = {
          ...existing,
          title: input.title.trim(),
          description: input.description.trim(),
          type: input.type,
          lookingFor: input.lookingFor,
          tags: input.tags ?? existing.tags,
          location: input.location,
          startAt: input.startAt,
          endAt: input.endAt,
          isFlexible: input.isFlexible,
          capacity: input.capacity,
          joinPolicy: input.joinPolicy ?? existing.joinPolicy,
          headcount: input.headcount ?? existing.headcount,
          visibility: input.visibility ?? existing.visibility,
          images: input.images ?? existing.images,
          updatedAt: now,
        }
        if (created.some((activity) => activity.id === id)) {
          await persist(created.map((activity) => (activity.id === id ? next : activity)))
        } else {
          await persistEdits({ ...edits, [id]: next })
        }
        return next
      },
    }
  }, [activities, created, edits, persist, persistEdits, ready, reload, user])

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext)
  if (!ctx) throw new Error("useActivities must be used inside ActivitiesProvider")
  return ctx
}
