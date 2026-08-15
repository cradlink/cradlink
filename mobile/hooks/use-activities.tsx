import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useAuth } from "@/hooks/use-auth"
import { MOCK_ACTIVITIES } from "@/lib/mock"
import { canRemoveActivity } from "@/lib/schedule"
import type { Activity, CreateActivityInput, UpdateActivityInput } from "@/lib/types"

const CREATED_KEY = "cl.created-activities"
const EDITS_KEY = "cl.edited-activities"
const DELETED_KEY = "cl.deleted-activities"

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

export function ActivitiesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [created, setCreated] = useState<Activity[]>([])
  const [edits, setEdits] = useState<Record<string, Activity>>({})
  const [deleted, setDeleted] = useState<string[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void Promise.all([
      AsyncStorage.getItem(CREATED_KEY),
      AsyncStorage.getItem(EDITS_KEY),
      AsyncStorage.getItem(DELETED_KEY),
    ]).then(([createdRaw, editsRaw, deletedRaw]) => {
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
      if (deletedRaw) {
        try {
          setDeleted(JSON.parse(deletedRaw) as string[])
        } catch {
          setDeleted([])
        }
      }
      setReady(true)
    })
  }, [])

  const reload = useCallback(async () => {
    const [createdRaw, editsRaw, deletedRaw] = await Promise.all([
      AsyncStorage.getItem(CREATED_KEY),
      AsyncStorage.getItem(EDITS_KEY),
      AsyncStorage.getItem(DELETED_KEY),
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
    if (deletedRaw) {
      try {
        setDeleted(JSON.parse(deletedRaw) as string[])
      } catch {
        setDeleted([])
      }
    } else {
      setDeleted([])
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

  const persistDeleted = useCallback(async (next: string[]) => {
    const unique = [...new Set(next)]
    setDeleted(unique)
    await AsyncStorage.setItem(DELETED_KEY, JSON.stringify(unique))
  }, [])

  const activities = useMemo(() => {
    const gone = new Set(deleted)
    const list = [
      ...created,
      ...MOCK_ACTIVITIES.filter((activity) => !created.some((row) => row.id === activity.id)),
    ]
      .map((activity) => edits[activity.id] ?? activity)
      .filter((activity) => !gone.has(activity.id) && activity.status !== "cancelled")
    if (!user) return list
    return list.map((activity) =>
      activity.creatorId === user.id
        ? { ...activity, creatorName: user.displayName, creatorAvatar: user.avatarUrl }
        : activity,
    )
  }, [created, deleted, edits, user])

  const value = useMemo<ActivitiesValue>(() => {
    const get = (id: string) => activities.find((activity) => activity.id === id) ?? null
    return {
      ready,
      activities,
      get,
      reload,
      add: async (input) => {
        if (!user) throw new Error("signInToPost")
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
        if (!user) throw new Error("signInToEdit")
        const existing = activities.find((activity) => activity.id === id)
        if (!existing) throw new Error("activityNotFound")
        if (existing.creatorId !== user.id) throw new Error("onlyOrganizer")
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
      remove: async (id) => {
        if (!user) throw new Error("signInToEdit")
        const existing = activities.find((activity) => activity.id === id)
        if (!existing) throw new Error("activityNotFound")
        if (existing.creatorId !== user.id) throw new Error("onlyOrganizer")
        if (!canRemoveActivity(existing)) throw new Error("tooLateToRemove")
        if (created.some((activity) => activity.id === id)) {
          await persist(created.filter((activity) => activity.id !== id))
        }
        if (edits[id]) {
          const nextEdits = { ...edits }
          delete nextEdits[id]
          await persistEdits(nextEdits)
        }
        await persistDeleted([...deleted, id])
      },
    }
  }, [activities, created, deleted, edits, persist, persistDeleted, persistEdits, ready, reload, user])

  return <ActivitiesContext.Provider value={value}>{children}</ActivitiesContext.Provider>
}

export function useActivities() {
  const ctx = useContext(ActivitiesContext)
  if (!ctx) throw new Error("useActivities must be used inside ActivitiesProvider")
  return ctx
}
