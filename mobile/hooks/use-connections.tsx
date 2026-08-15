import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/hooks/use-auth"
import {
  deleteFollow,
  followId,
  setFollowStatus,
  watchFollows,
  writeFollow,
} from "@/lib/data/social"
import { isFirebaseConfigured } from "@/lib/env"
import type { FollowRequest, FollowStatus, User } from "@/lib/types"
import { nowIso } from "@/lib/utils"

type ConnectionsValue = {
  ready: boolean
  statusOf: (userId: string) => FollowStatus
  canSeeActivities: (person: User | null | undefined) => boolean
  follow: (person: User) => Promise<FollowStatus>
  unfollow: (userId: string) => Promise<void>
  cancelRequest: (userId: string) => Promise<void>
  accept: (requestId: string) => Promise<FollowRequest | null>
  decline: (requestId: string) => Promise<FollowRequest | null>
  inbox: () => FollowRequest[]
  followerCount: (userId: string) => number
  followingCount: (userId: string) => number
  reload: () => Promise<void>
}

const fallback: ConnectionsValue = {
  ready: false,
  statusOf: () => "none",
  canSeeActivities: (person) => Boolean(person && person.visibility !== "private"),
  follow: async () => "none",
  unfollow: async () => undefined,
  cancelRequest: async () => undefined,
  accept: async () => null,
  decline: async () => null,
  inbox: () => [],
  followerCount: () => 0,
  followingCount: () => 0,
  reload: async () => undefined,
}

const ConnectionsContext = createContext<ConnectionsValue>(fallback)

function isPrivate(person: User | null | undefined) {
  return person?.visibility === "private"
}

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const { user, getUser } = useAuth()
  const [rows, setRows] = useState<FollowRequest[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user || !isFirebaseConfigured()) {
      setRows([])
      setReady(true)
      return
    }
    return watchFollows(user.id, (next) => {
      setRows(next)
      setReady(true)
    })
  }, [user])

  const value = useMemo<ConnectionsValue>(() => {
    const mine = user?.id
    const accepted = rows.filter((row) => row.status === "accepted")
    const followingOf = (id: string) => accepted.filter((row) => row.fromId === id).map((row) => row.toId)

    return {
      ready,
      statusOf: (userId) => {
        if (!mine || userId === mine) return "none"
        if (followingOf(mine).includes(userId)) return "following"
        const pending = rows.some(
          (row) => row.fromId === mine && row.toId === userId && row.status === "pending",
        )
        return pending ? "pending" : "none"
      },
      canSeeActivities: (person) => {
        if (!person) return false
        if (person.id === mine) return true
        if (!isPrivate(person)) return true
        return Boolean(mine && followingOf(mine).includes(person.id))
      },
      follow: async (person) => {
        if (!user || person.id === user.id) return "none"
        if (followingOf(user.id).includes(person.id)) return "following"
        const target = getUser(person.id) ?? person
        const pending = isPrivate(target)
        await writeFollow({
          fromId: user.id,
          toId: person.id,
          status: pending ? "pending" : "accepted",
          createdAt: nowIso(),
        })
        return pending ? "pending" : "following"
      },
      unfollow: async (userId) => {
        if (!mine) return
        await deleteFollow(followId(mine, userId))
      },
      cancelRequest: async (userId) => {
        if (!mine) return
        await deleteFollow(followId(mine, userId))
      },
      accept: async (requestId) => {
        const row = rows.find((item) => item.id === requestId)
        if (!row || !mine || row.toId !== mine || row.status !== "pending") return null
        await setFollowStatus(requestId, "accepted")
        return { ...row, status: "accepted" }
      },
      decline: async (requestId) => {
        const row = rows.find((item) => item.id === requestId)
        if (!row || !mine || row.toId !== mine || row.status !== "pending") return null
        await deleteFollow(requestId)
        return { ...row, status: "declined" }
      },
      inbox: () => {
        if (!mine) return []
        return rows
          .filter((row) => row.toId === mine && row.status === "pending")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      },
      followerCount: (userId) => accepted.filter((row) => row.toId === userId).length,
      followingCount: (userId) => followingOf(userId).length,
      reload: async () => undefined,
    }
  }, [getUser, ready, rows, user])

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>
}

export function useConnections() {
  return useContext(ConnectionsContext)
}
