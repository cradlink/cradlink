import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

import { useActivities } from "@/hooks/use-activities"
import { useAuth } from "@/hooks/use-auth"
import { firebaseMembers, watchMembers } from "@/lib/data/firebase"
import { isFirebaseConfigured } from "@/lib/env"
import { hardCap } from "@/lib/headcount"
import type { Activity, JoinRequest } from "@/lib/types"

export type MembershipStatus = "joined" | "pending"

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

export function MembershipProvider({ children }: { children: React.ReactNode }) {
  const { user, getUser } = useAuth()
  const { activities, ready: activitiesReady, reload: reloadActivities } = useActivities()
  const [mine, setMine] = useState<Record<string, MembershipStatus>>({})
  const [inboxItems, setInboxItems] = useState<JoinRequest[]>([])
  const [pendingMap, setPendingMap] = useState<Record<string, JoinRequest[]>>({})
  const [ready, setReady] = useState(false)

  const reload = useCallback(async () => {
    if (!user?.username || !isFirebaseConfigured()) {
      setMine({})
      setInboxItems([])
      setPendingMap({})
      setReady(true)
      return
    }
    try {
      const mineRows = await firebaseMembers.listByUser(user.id)
      const nextMine: Record<string, MembershipStatus> = {}
      for (const row of mineRows) {
        if (row.status === "joined" || row.status === "pending") nextMine[row.activityId] = row.status
      }
      setMine(nextMine)

      const hosted = activities.filter((activity) => activity.creatorId === user.id)
      const nextPending: Record<string, JoinRequest[]> = {}
      const nextInbox: JoinRequest[] = []
      await Promise.all(
        hosted.map(async (activity) => {
          const members = await firebaseMembers.listByActivity(activity.id)
          const pending = members
            .filter((member) => member.status === "pending")
            .map((member) => ({
              id: member.id,
              activityId: member.activityId,
              hostId: user.id,
              userId: member.userId,
              userName: member.user.displayName,
              userAvatar: member.user.avatarUrl,
              status: "pending" as const,
              createdAt: member.joinedAt,
            }))
          nextPending[activity.id] = pending
          nextInbox.push(...pending)
        }),
      )
      setPendingMap(nextPending)
      setInboxItems(nextInbox)
    } catch {
      setMine({})
      setInboxItems([])
      setPendingMap({})
    } finally {
      setReady(true)
    }
  }, [activities, user])

  useEffect(() => {
    if (!activitiesReady) return
    if (!user?.username || !isFirebaseConfigured()) {
      setMine({})
      setInboxItems([])
      setPendingMap({})
      setReady(true)
      return
    }
    return watchMembers((rows) => {
      const nextMine: Record<string, MembershipStatus> = {}
      for (const row of rows) {
        if (row.userId === user.id && (row.status === "joined" || row.status === "pending")) {
          nextMine[row.activityId] = row.status
        }
      }
      setMine(nextMine)

      const hosted = new Set(activities.filter((activity) => activity.creatorId === user.id).map((activity) => activity.id))
      const nextPending: Record<string, JoinRequest[]> = {}
      const nextInbox: JoinRequest[] = []
      for (const row of rows) {
        if (row.status !== "pending" || !hosted.has(row.activityId)) continue
        const person = getUser(row.userId)
        const request: JoinRequest = {
          id: row.id,
          activityId: row.activityId,
          hostId: user.id,
          userId: row.userId,
          userName: person?.displayName ?? "Member",
          userAvatar: person?.avatarUrl ?? null,
          status: "pending",
          createdAt: row.joinedAt,
        }
        nextPending[row.activityId] = [...(nextPending[row.activityId] ?? []), request]
        nextInbox.push(request)
      }
      setPendingMap(nextPending)
      setInboxItems(nextInbox)
      setReady(true)
    })
  }, [activities, activitiesReady, getUser, user])

  const value = useMemo<MembershipsValue>(() => {
    const statusOf = (activityId: string) => mine[activityId] ?? null
    const isOrganizer = (activity: Activity) => Boolean(user && user.id === activity.creatorId)
    const pendingFor = (activityId: string) => pendingMap[activityId] ?? []
    const decorate = (activity: Activity) => activities.find((item) => item.id === activity.id) ?? activity
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
      pendingCount: (activityId) => pendingFor(activityId).length,
      inbox: () => inboxItems.filter((row) => activities.some((activity) => activity.id === row.activityId)),
      joinedIds: Object.entries(mine)
        .filter(([, status]) => status === "joined" || status === "pending")
        .map(([id]) => id),
      join: async (activity) => {
        if (!user || isOrganizer(activity) || isFull(activity)) return
        await firebaseMembers.join(activity.id, user.id)
        await reloadActivities()
        await reload()
      },
      leave: async (activityId) => {
        if (!user) return
        await firebaseMembers.leave(activityId, user.id)
        await reloadActivities()
        await reload()
      },
      accept: async (requestId, activity) => {
        if (!user) return null
        const row = pendingFor(activity.id).find((item) => item.id === requestId)
        if (!row) return null
        await firebaseMembers.accept(activity.id, row.userId, user.id)
        await reloadActivities()
        await reload()
        return { ...row, status: "accepted" }
      },
      decline: async (requestId) => {
        if (!user) return null
        const row = inboxItems.find((item) => item.id === requestId)
        if (!row) return null
        await firebaseMembers.decline(row.activityId, row.userId, user.id)
        await reloadActivities()
        await reload()
        return { ...row, status: "declined" }
      },
      reload,
    }
  }, [activities, inboxItems, mine, pendingMap, ready, reload, reloadActivities, user])

  return <MembershipsContext.Provider value={value}>{children}</MembershipsContext.Provider>
}

export function useMemberships() {
  const ctx = useContext(MembershipsContext)
  if (!ctx) throw new Error("useMemberships must be used inside MembershipProvider")
  return ctx
}
