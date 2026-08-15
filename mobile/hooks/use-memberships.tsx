import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import type { Activity, JoinRequest } from "@/lib/types"

const MEM_KEY = "cl.memberships"
const REQ_KEY = "cl.join-requests"

export type MembershipStatus = "joined" | "pending"
type MemberStore = Record<string, Record<string, MembershipStatus>>
type RequestStore = {
  seeded: string[]
  items: JoinRequest[]
}

type MembershipsValue = {
  ready: boolean
  statusOf: (activityId: string) => MembershipStatus | null
  join: (activity: Activity) => Promise<void>
  leave: (activityId: string) => Promise<void>
  decorate: (activity: Activity) => Activity
  isOrganizer: (activity: Activity) => boolean
  isFull: (activity: Activity) => boolean
  joinedIds: string[]
  pendingFor: (activityId: string) => JoinRequest[]
  pendingCount: (activityId: string) => number
  inbox: () => JoinRequest[]
  accept: (requestId: string, activity: Activity) => Promise<JoinRequest | null>
  decline: (requestId: string) => Promise<JoinRequest | null>
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

function createId() {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { activities, ready: activitiesReady } = useActivities()
  const [store, setStore] = useState<MemberStore>({})
  const [requests, setRequests] = useState<RequestStore>({ seeded: [], items: [] })
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void Promise.all([AsyncStorage.getItem(MEM_KEY), AsyncStorage.getItem(REQ_KEY)]).then(([memRaw, reqRaw]) => {
      if (memRaw) {
        try {
          setStore(JSON.parse(memRaw) as MemberStore)
        } catch {
          setStore({})
        }
      }
      if (reqRaw) {
        try {
          setRequests(JSON.parse(reqRaw) as RequestStore)
        } catch {
          setRequests({ seeded: [], items: [] })
        }
      }
      setReady(true)
    })
  }, [])

  const persistMembers = useCallback(async (next: MemberStore) => {
    setStore(next)
    await AsyncStorage.setItem(MEM_KEY, JSON.stringify(next))
  }, [])

  const persistRequests = useCallback(async (next: RequestStore) => {
    setRequests(next)
    await AsyncStorage.setItem(REQ_KEY, JSON.stringify(next))
  }, [])

  useEffect(() => {
    if (!ready || !activitiesReady || !user) return
    const hosted = activities.filter((activity) => activity.creatorId === user.id)
    if (hosted.length === 0) return
    const target = hosted.find((activity) => activity.joinPolicy === "manual") ?? hosted[0]
    const flag = `${user.id}:five`
    if (requests.seeded.includes(flag)) return
    const extras = [
      { userId: "user_ana", userName: "Ana Kovač" },
      { userId: "user_luka", userName: "Luka Ilić" },
      { userId: "user_nina", userName: "Nina Petrić" },
      { userId: "user_teo", userName: "Teo Marković" },
      { userId: "user_iva", userName: "Iva Radić" },
    ].filter(
      (person) =>
        !requests.items.some(
          (row) => row.hostId === user.id && row.userId === person.userId && row.status === "pending",
        ),
    )
    if (extras.length === 0) {
      void persistRequests({ ...requests, seeded: [...requests.seeded, flag] })
      return
    }
    const stamp = Date.now()
    void persistRequests({
      seeded: [...requests.seeded, flag],
      items: [
        ...extras.map((person, index) => ({
          id: `req_seed_${person.userId}_${target.id}_${stamp}`,
          activityId: target.id,
          hostId: user.id,
          userId: person.userId,
          userName: person.userName,
          userAvatar: null,
          status: "pending" as const,
          createdAt: new Date(stamp - index * 3600_000).toISOString(),
        })),
        ...requests.items,
      ],
    })
  }, [activities, activitiesReady, persistRequests, ready, requests, user])

  const reload = useCallback(async () => {
    const [memRaw, reqRaw] = await Promise.all([AsyncStorage.getItem(MEM_KEY), AsyncStorage.getItem(REQ_KEY)])
    if (memRaw) {
      try {
        setStore(JSON.parse(memRaw) as MemberStore)
      } catch {
        setStore({})
      }
    } else {
      setStore({})
    }
    if (reqRaw) {
      try {
        setRequests(JSON.parse(reqRaw) as RequestStore)
      } catch {
        setRequests({ seeded: [], items: [] })
      }
    } else {
      setRequests({ seeded: [], items: [] })
    }
  }, [])

  const mine = user ? (store[user.id] ?? {}) : {}

  const value = useMemo<MembershipsValue>(() => {
    const statusOf = (activityId: string) => mine[activityId] ?? null
    const isOrganizer = (activity: Activity) => Boolean(user && user.id === activity.creatorId)
    const pendingFor = (activityId: string) =>
      requests.items.filter((row) => row.activityId === activityId && row.status === "pending")
    const pendingCount = (activityId: string) => pendingFor(activityId).length
    const inbox = () =>
      requests.items.filter(
        (row) =>
          row.hostId === user?.id &&
          row.status === "pending" &&
          activities.some((activity) => activity.id === row.activityId),
      )
    const decorate = (activity: Activity) => {
      const raw = activities.find((item) => item.id === activity.id) ?? activity
      const accepted = requests.items.filter(
        (row) => row.activityId === raw.id && row.status === "accepted" && row.userId !== user?.id,
      ).length
      const extra = statusOf(raw.id) === "joined" && !isOrganizer(raw) ? 1 : 0
      return { ...raw, memberCount: raw.memberCount + accepted + extra }
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
      pendingFor,
      pendingCount,
      inbox,
      joinedIds: Object.entries(mine)
        .filter(([, status]) => status === "joined" || status === "pending")
        .map(([id]) => id),
      join: async (activity) => {
        if (!user || isOrganizer(activity) || isFull(activity)) return
        const nextStatus: MembershipStatus = activity.joinPolicy === "manual" ? "pending" : "joined"
        await persistMembers({
          ...store,
          [user.id]: { ...mine, [activity.id]: nextStatus },
        })
        if (nextStatus === "pending") {
          const exists = requests.items.some(
            (row) => row.activityId === activity.id && row.userId === user.id && row.status === "pending",
          )
          if (!exists) {
            await persistRequests({
              ...requests,
              items: [
                {
                  id: createId(),
                  activityId: activity.id,
                  hostId: activity.creatorId,
                  userId: user.id,
                  userName: user.displayName,
                  userAvatar: user.avatarUrl,
                  status: "pending",
                  createdAt: new Date().toISOString(),
                },
                ...requests.items,
              ],
            })
          }
        }
      },
      leave: async (activityId) => {
        if (!user) return
        const nextMine = { ...mine }
        delete nextMine[activityId]
        await persistMembers({ ...store, [user.id]: nextMine })
        await persistRequests({
          ...requests,
          items: requests.items.map((row) =>
            row.activityId === activityId && row.userId === user.id && row.status === "pending"
              ? { ...row, status: "declined" }
              : row,
          ),
        })
      },
      accept: async (requestId, activity) => {
        if (!user || user.id !== activity.creatorId || isFull(activity)) return null
        const row = requests.items.find((item) => item.id === requestId)
        if (!row || row.status !== "pending") return null
        const next: JoinRequest = { ...row, status: "accepted" }
        const theirs = store[row.userId] ?? {}
        await persistMembers({
          ...store,
          [row.userId]: { ...theirs, [row.activityId]: "joined" },
        })
        await persistRequests({
          ...requests,
          items: requests.items.map((item) => (item.id === requestId ? next : item)),
        })
        return next
      },
      decline: async (requestId) => {
        if (!user) return null
        const row = requests.items.find((item) => item.id === requestId)
        if (!row || row.status !== "pending" || row.hostId !== user.id) return null
        const next: JoinRequest = { ...row, status: "declined" }
        const theirs = { ...(store[row.userId] ?? {}) }
        delete theirs[row.activityId]
        await persistMembers({ ...store, [row.userId]: theirs })
        await persistRequests({
          ...requests,
          items: requests.items.map((item) => (item.id === requestId ? next : item)),
        })
        return next
      },
      reload,
    }
  }, [activities, mine, persistMembers, persistRequests, ready, reload, requests, store, user])

  return <MembershipsContext.Provider value={value}>{children}</MembershipsContext.Provider>
}

export function useMemberships() {
  const ctx = useContext(MembershipsContext)
  if (!ctx) throw new Error("useMemberships must be used inside MembershipProvider")
  return ctx
}
