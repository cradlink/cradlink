import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useAuth } from "@/hooks/use-auth"
import type { FollowRequest, FollowStatus, User } from "@/lib/types"

const KEY = "cl.connections"

type Store = {
  following: Record<string, string[]>
  requests: FollowRequest[]
  seeded: string[]
}

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

const empty: Store = { following: {}, requests: [], seeded: [] }

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

function createId() {
  return `fol_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function isPrivate(person: User | null | undefined) {
  return person?.visibility === "private"
}

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const { user, getUser } = useAuth()
  const [store, setStore] = useState<Store>(empty)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Store
          setStore({
            following: parsed.following ?? {},
            requests: parsed.requests ?? [],
            seeded: parsed.seeded ?? [],
          })
        } catch {
          setStore(empty)
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
    if (!ready || !user) return

    let following = { ...store.following }
    let requests = [...store.requests]
    let seeded = [...store.seeded]
    let dirty = false

    function followNow(fromId: string, toId: string) {
      const list = following[fromId] ?? []
      if (!list.includes(toId)) {
        following = { ...following, [fromId]: [...list, toId] }
        dirty = true
      }
    }

    if (user.visibility !== "private") {
      for (const row of requests) {
        if (row.toId === user.id && row.status === "pending") {
          followNow(row.fromId, row.toId)
          dirty = true
        }
      }
      const after = requests.map((row) =>
        row.toId === user.id && row.status === "pending" ? { ...row, status: "accepted" as const } : row,
      )
      if (after.some((row, i) => row.status !== requests[i]?.status)) {
        requests = after
        dirty = true
      }
    }

    const outgoing = requests.map((row) => {
      if (row.fromId !== user.id || row.status !== "pending") return row
      const target = getUser(row.toId)
      if (isPrivate(target)) return row
      followNow(row.fromId, row.toId)
      dirty = true
      return { ...row, status: "accepted" as const }
    })
    if (outgoing.some((row, i) => row.status !== requests[i]?.status)) requests = outgoing

    const flag = `inbox5:${user.id}`
    if (isPrivate(user) && !seeded.includes(flag)) {
      const extras = [
        { userId: "user_ana", userName: "Ana Kovač" },
        { userId: "user_luka", userName: "Luka Ilić" },
        { userId: "user_nina", userName: "Nina Petrić" },
        { userId: "user_teo", userName: "Teo Marković" },
        { userId: "user_iva", userName: "Iva Radić" },
      ].filter(
        (person) =>
          !requests.some((row) => row.toId === user.id && row.fromId === person.userId && row.status === "pending"),
      )
      const stamp = Date.now()
      seeded = [...seeded, flag]
      requests = [
        ...extras.map((person, index) => ({
          id: `fol_seed_${person.userId}_${user.id}_${stamp}`,
          fromId: person.userId,
          fromName: person.userName,
          fromAvatar: null,
          toId: user.id,
          status: "pending" as const,
          createdAt: new Date(stamp - (index + 1) * 3600_000).toISOString(),
        })),
        ...requests,
      ]
      dirty = true
    }

    if (dirty) void persist({ following, requests, seeded })
  }, [getUser, persist, ready, store, user])

  const value = useMemo<ConnectionsValue>(() => {
    const mine = user?.id
    const followingOf = (id: string) => store.following[id] ?? []

    return {
      ready,
      statusOf: (userId) => {
        if (!mine || userId === mine) return "none"
        if (followingOf(mine).includes(userId)) return "following"
        const target = getUser(userId)
        if (!isPrivate(target)) return "none"
        const pending = store.requests.some(
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
        if (isPrivate(target)) {
          const exists = store.requests.some(
            (row) => row.fromId === user.id && row.toId === person.id && row.status === "pending",
          )
          if (exists) return "pending"
          const next: FollowRequest = {
            id: createId(),
            fromId: user.id,
            fromName: user.displayName,
            fromAvatar: user.avatarUrl,
            toId: person.id,
            status: "pending",
            createdAt: new Date().toISOString(),
          }
          await persist({ ...store, requests: [next, ...store.requests] })
          return "pending"
        }
        await persist({
          ...store,
          following: { ...store.following, [user.id]: [...followingOf(user.id), person.id] },
          requests: store.requests.map((row) =>
            row.fromId === user.id && row.toId === person.id && row.status === "pending"
              ? { ...row, status: "accepted" as const }
              : row,
          ),
        })
        return "following"
      },
      unfollow: async (userId) => {
        if (!mine) return
        await persist({
          ...store,
          following: { ...store.following, [mine]: followingOf(mine).filter((id) => id !== userId) },
        })
      },
      cancelRequest: async (userId) => {
        if (!mine) return
        await persist({
          ...store,
          requests: store.requests.map((row) =>
            row.fromId === mine && row.toId === userId && row.status === "pending"
              ? { ...row, status: "declined" as const }
              : row,
          ),
        })
      },
      accept: async (requestId) => {
        const row = store.requests.find((item) => item.id === requestId)
        if (!row || !mine || row.toId !== mine || row.status !== "pending") return null
        const theirs = followingOf(row.fromId)
        await persist({
          following: {
            ...store.following,
            [row.fromId]: theirs.includes(row.toId) ? theirs : [...theirs, row.toId],
          },
          requests: store.requests.map((item) =>
            item.id === requestId ? { ...item, status: "accepted" as const } : item,
          ),
          seeded: store.seeded,
        })
        return { ...row, status: "accepted" }
      },
      decline: async (requestId) => {
        const row = store.requests.find((item) => item.id === requestId)
        if (!row || !mine || row.toId !== mine || row.status !== "pending") return null
        await persist({
          ...store,
          requests: store.requests.map((item) =>
            item.id === requestId ? { ...item, status: "declined" as const } : item,
          ),
        })
        return { ...row, status: "declined" }
      },
      inbox: () => {
        if (!mine) return []
        return store.requests
          .filter((row) => row.toId === mine && row.status === "pending")
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      },
      followerCount: (userId) => {
        const accepted = store.requests.filter(
          (row) => row.toId === userId && row.status === "accepted",
        ).length
        const extra = Object.entries(store.following).reduce((sum, [follower, ids]) => {
          if (!ids.includes(userId)) return sum
          const counted = store.requests.some(
            (row) => row.fromId === follower && row.toId === userId && row.status === "accepted",
          )
          return counted ? sum : sum + 1
        }, 0)
        return accepted + extra
      },
      followingCount: (userId) => followingOf(userId).length,
      reload: async () => {
        const raw = await AsyncStorage.getItem(KEY)
        if (!raw) {
          setStore(empty)
          return
        }
        try {
          const parsed = JSON.parse(raw) as Store
          setStore({
            following: parsed.following ?? {},
            requests: parsed.requests ?? [],
            seeded: parsed.seeded ?? [],
          })
        } catch {
          setStore(empty)
        }
      },
    }
  }, [getUser, persist, ready, store, user])

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>
}

export function useConnections() {
  return useContext(ConnectionsContext)
}
