import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"

import { useAuth } from "@/hooks/use-auth"
import type { Activity, ActivityReply, ReplyComposeTarget, ReplyThreadItem } from "@/lib/types"

const KEY = "cl.activity-replies"
const MAX_BODY = 280
const SEED_VERSION = 4

type Store = {
  seeded: number | boolean
  items: ActivityReply[]
}

type RepliesValue = {
  ready: boolean
  composing: ReplyComposeTarget | null
  openCompose: (activity: Activity, parent?: ActivityReply | null) => void
  closeCompose: () => void
  forActivity: (activityId: string) => ActivityReply[]
  threadFor: (activityId: string) => ReplyThreadItem[]
  add: (activityId: string, body: string, parentId?: string | null) => Promise<ActivityReply>
  remove: (id: string) => Promise<void>
  hide: (id: string, activity: Activity) => Promise<void>
  reload: () => Promise<void>
}

const RepliesContext = createContext<RepliesValue | null>(null)

function createId() {
  return `rep_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

function parentIdOf(row: Pick<ActivityReply, "parentId">) {
  return row.parentId ?? null
}

function childrenOf(replies: ActivityReply[], parentId: string | null) {
  return replies
    .filter((row) => parentIdOf(row) === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export function threadItems(replies: ActivityReply[], parentId: string | null = null, depth = 0): ReplyThreadItem[] {
  return childrenOf(replies, parentId).flatMap((reply) => {
    const parent = reply.parentId ? (replies.find((row) => row.id === reply.parentId) ?? null) : null
    return [{ reply, parent, depth }, ...threadItems(replies, reply.id, depth + 1)]
  })
}

export function RepliesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [store, setStore] = useState<Store>({ seeded: false, items: [] })
  const [composing, setComposing] = useState<ReplyComposeTarget | null>(null)
  const [ready, setReady] = useState(false)

  const persist = useCallback(async (next: Store) => {
    setStore(next)
    await AsyncStorage.setItem(KEY, JSON.stringify(next))
  }, [])

  useEffect(() => {
    void AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Store
          if (parsed.seeded === SEED_VERSION) {
            setStore({ seeded: SEED_VERSION, items: parsed.items ?? [] })
            setReady(true)
            return
          }
        } catch {
          /* reset below */
        }
      }
      const next = { seeded: SEED_VERSION, items: [] as ActivityReply[] }
      setStore(next)
      void AsyncStorage.setItem(KEY, JSON.stringify(next))
      setReady(true)
    })
  }, [])

  const reload = useCallback(async () => {
    const raw = await AsyncStorage.getItem(KEY)
    if (!raw) {
      setStore({ seeded: SEED_VERSION, items: [] })
      return
    }
    try {
      const parsed = JSON.parse(raw) as Store
      setStore(
        parsed.seeded === SEED_VERSION
          ? { seeded: SEED_VERSION, items: parsed.items ?? [] }
          : { seeded: SEED_VERSION, items: [] },
      )
    } catch {
      setStore({ seeded: SEED_VERSION, items: [] })
    }
  }, [])

  const value = useMemo<RepliesValue>(() => {
    const items = store.items.map((row) => {
      const next = {
        ...row,
        parentId: parentIdOf(row),
        deleted: Boolean(row.deleted),
        deletedBy: row.deletedBy === "host" ? ("host" as const) : row.deleted ? ("author" as const) : undefined,
      }
      return user && next.userId === user.id
        ? { ...next, userName: user.displayName, userAvatar: user.avatarUrl }
        : next
    })
    return {
      ready,
      composing,
      openCompose: (activity, parent = null) => setComposing({ activity, parent }),
      closeCompose: () => setComposing(null),
      forActivity: (activityId) =>
        items
          .filter((row) => row.activityId === activityId)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      threadFor: (activityId) =>
        threadItems(items.filter((row) => row.activityId === activityId)),
      add: async (activityId, body, parentId = null) => {
        if (!user) throw new Error("signInFirst")
        const text = body.trim()
        if (!text) throw new Error("replyEmpty")
        if (text.length > MAX_BODY) throw new Error("replyTooLong")
        const parent = parentId ? items.find((row) => row.id === parentId) : null
        if (parentId && (!parent || parent.activityId !== activityId || parent.deleted)) {
          throw new Error("activityNotFound")
        }
        const next: ActivityReply = {
          id: createId(),
          activityId,
          parentId: parent ? parent.id : null,
          userId: user.id,
          userName: user.displayName,
          userAvatar: user.avatarUrl,
          body: text,
          createdAt: new Date().toISOString(),
        }
        await persist({ ...store, items: [...store.items, next] })
        return next
      },
      remove: async (id) => {
        if (!user) throw new Error("signInFirst")
        const row = store.items.find((item) => item.id === id)
        if (!row) return
        if (row.userId !== user.id) throw new Error("onlyAuthor")
        const fallback = parentIdOf(row)
        await persist({
          ...store,
          items: store.items
            .filter((item) => item.id !== id)
            .map((item) => (item.parentId === id ? { ...item, parentId: fallback } : item)),
        })
      },
      hide: async (id, activity) => {
        if (!user) throw new Error("signInFirst")
        const row = store.items.find((item) => item.id === id)
        if (!row || row.activityId !== activity.id || row.deleted) return
        const author = row.userId === user.id
        const host = activity.creatorId === user.id
        if (!author && !host) throw new Error("onlyAuthor")
        await persist({
          ...store,
          items: store.items.map((item) =>
            item.id === id
              ? { ...item, deleted: true, deletedBy: author ? "author" : "host" }
              : item,
          ),
        })
      },
      reload,
    }
  }, [composing, persist, ready, reload, store, user])

  return <RepliesContext.Provider value={value}>{children}</RepliesContext.Provider>
}

export function useReplies() {
  const ctx = useContext(RepliesContext)
  if (!ctx) throw new Error("useReplies must be used inside RepliesProvider")
  return ctx
}

export { MAX_BODY }
