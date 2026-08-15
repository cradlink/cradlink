import { createContext, useContext, useEffect, useMemo, useState } from "react"

import { useAuth } from "@/hooks/use-auth"
import { useMemberships } from "@/hooks/use-memberships"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/hooks/use-i18n"
import { hideReply, notifyDiscussion, watchDiscussions, writeReply } from "@/lib/data/social"
import { isFirebaseConfigured } from "@/lib/env"
import { LOCAL_REPLIES, isLocalSceneId, mergeById } from "@/lib/local-scene"
import { createId, nowIso } from "@/lib/utils"
import type { Activity, ActivityReply, ReplyComposeTarget, ReplyThreadItem } from "@/lib/types"

const MAX_BODY = 280

type RepliesValue = {
  ready: boolean
  composing: ReplyComposeTarget | null
  canReply: (activity: Activity) => boolean
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
  const { user, getUser } = useAuth()
  const { statusOf, isOrganizer } = useMemberships()
  const { show } = useToast()
  const { messages } = useI18n()
  const [items, setItems] = useState<ActivityReply[]>([])
  const [composing, setComposing] = useState<ReplyComposeTarget | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!user?.username || !isFirebaseConfigured()) {
      setItems(user ? LOCAL_REPLIES : [])
      setReady(true)
      return
    }
    return watchDiscussions((next) => {
      setItems((current) => {
        const extra = current.filter(
          (row) => row.activityId.startsWith("local_") && !LOCAL_REPLIES.some((seed) => seed.id === row.id),
        )
        return mergeById(next, mergeById(LOCAL_REPLIES, extra))
      })
      setReady(true)
    })
  }, [user])

  const value = useMemo<RepliesValue>(() => {
    const live = items.map((row) => {
      const next = {
        ...row,
        parentId: parentIdOf(row),
        deleted: Boolean(row.deleted),
        deletedBy: row.deletedBy === "host" ? ("host" as const) : row.deleted ? ("author" as const) : undefined,
      }
      const person = getUser(next.userId)
      return person
        ? { ...next, userName: person.displayName, userAvatar: person.avatarUrl }
        : next
    })
    const canReply = (activity: Activity) =>
      Boolean(user && (isOrganizer(activity) || statusOf(activity.id) === "joined"))
    return {
      ready,
      composing,
      canReply,
      openCompose: (activity, parent = null) => {
        if (!canReply(activity)) {
          show({ title: messages.reply.joinFirst })
          return
        }
        setComposing({ activity, parent })
      },
      closeCompose: () => setComposing(null),
      forActivity: (activityId) =>
        live.filter((row) => row.activityId === activityId).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      threadFor: (activityId) => threadItems(live.filter((row) => row.activityId === activityId)),
      add: async (activityId, body, parentId = null) => {
        if (!user) throw new Error("signInFirst")
        const text = body.trim()
        if (!text) throw new Error("replyEmpty")
        if (text.length > MAX_BODY) throw new Error("replyTooLong")
        const parent = parentId ? live.find((row) => row.id === parentId) : null
        if (parentId && (!parent || parent.activityId !== activityId || parent.deleted)) {
          throw new Error("activityNotFound")
        }
        const activity = composing?.activity
        if (!activity || activity.id !== activityId) throw new Error("activityNotFound")
        if (!canReply(activity)) throw new Error("joinToReply")
        if (isLocalSceneId(activityId)) {
          const local: ActivityReply = {
            id: createId("rep"),
            activityId,
            parentId: parent ? parent.id : null,
            userId: user.id,
            userName: user.displayName,
            userAvatar: user.avatarUrl,
            body: text,
            createdAt: nowIso(),
          }
          setItems((current) => mergeById(current, [local]))
          return local
        }
        const next = await writeReply({
          activity,
          parentId: parent ? parent.id : null,
          userId: user.id,
          userName: user.displayName,
          userAvatar: user.avatarUrl,
          body: text,
        })
        void notifyDiscussion({ activity, comment: next, parent: parent ?? null })
        return next
      },
      remove: async (id) => {
        if (!user) throw new Error("signInFirst")
        const row = live.find((item) => item.id === id)
        if (!row || row.userId !== user.id) throw new Error("onlyAuthor")
        await hideReply(row.activityId, id, user.id)
      },
      hide: async (id, activity) => {
        if (!user) throw new Error("signInFirst")
        const row = live.find((item) => item.id === id)
        if (!row || row.activityId !== activity.id || row.deleted) return
        const author = row.userId === user.id
        const host = activity.creatorId === user.id
        if (!author && !host) throw new Error("onlyAuthor")
        await hideReply(activity.id, id, user.id)
      },
      reload: async () => undefined,
    }
  }, [composing, getUser, isOrganizer, items, messages.reply.joinFirst, ready, show, statusOf, user])

  return <RepliesContext.Provider value={value}>{children}</RepliesContext.Provider>
}

export function useReplies() {
  const ctx = useContext(RepliesContext)
  if (!ctx) throw new Error("useReplies must be used inside RepliesProvider")
  return ctx
}

export { MAX_BODY }
