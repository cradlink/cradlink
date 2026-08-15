import { doc, getDoc, runTransaction, type DocumentData } from "firebase/firestore";
import type { CommentsRepo } from "@/lib/data/types";
import { firebaseActivities, firebaseUsers } from "@/lib/data/firebase";
import { firebaseNotifications } from "@/lib/data/notifications-firebase";
import { notifyDiscussion } from "@/lib/data/notify";
import { AppError, appError, isPermissionDenied } from "@/lib/errors";
import { getFirebaseDb } from "@/lib/firebase";
import { COMMENT_MAX_LENGTH, isCommentDeleted, type ActivityComment } from "@/lib/types";
import { createId, nowIso, stripUndefined } from "@/lib/utils";

const DISCUSSION_CAP = 400;

function mapComment(id: string, data: DocumentData, fallbackActivityId = ""): ActivityComment {
  const parentId = typeof data.parentId === "string" ? data.parentId : null;
  return {
    id,
    activityId: typeof data.activityId === "string" ? data.activityId : fallbackActivityId,
    parentId,
    rootId: typeof data.rootId === "string" ? data.rootId : parentId || id,
    authorId: typeof data.authorId === "string" ? data.authorId : "",
    authorName: typeof data.authorName === "string" ? data.authorName : "Member",
    authorAvatar: (data.authorAvatar as string | null) ?? null,
    body: typeof data.body === "string" ? data.body : "",
    createdAt: typeof data.createdAt === "string" ? data.createdAt : nowIso(),
    deletedAt: typeof data.deletedAt === "string" ? data.deletedAt : null,
    deletedBy: typeof data.deletedBy === "string" ? data.deletedBy : null,
  };
}

function readDiscussion(activityId: string, data: DocumentData | undefined): ActivityComment[] {
  if (!data || !Array.isArray(data.discussion)) return [];
  return data.discussion
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const item = row as DocumentData;
      const id = typeof item.id === "string" ? item.id : "";
      if (!id) return null;
      return mapComment(id, item, activityId);
    })
    .filter((row): row is ActivityComment => Boolean(row));
}

async function assertCanDiscuss(activityId: string) {
  const activity = await firebaseActivities.getById(activityId);
  if (!activity) throw appError("errors.activityNotFound");
  return activity;
}

export const firebaseComments: CommentsRepo = {
  async listByActivity(activityId) {
    const snap = await getDoc(doc(getFirebaseDb(), "activities", activityId));
    if (!snap.exists()) return [];
    return readDiscussion(activityId, snap.data()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async getById(id) {
    // Comments live on the activity document; callers that need a parent already have the thread.
    void id;
    return null;
  },

  async create(input) {
    const body = input.body.trim();
    if (!body) throw appError("errors.writeSomething");
    if (body.length > COMMENT_MAX_LENGTH) {
      throw appError("errors.commentTooLong", { max: COMMENT_MAX_LENGTH });
    }

    const activity = await assertCanDiscuss(input.activityId);
    const author = await firebaseUsers.getById(input.authorId);
    if (!author) throw appError("errors.userNotFound");

    const parentId = input.parentId || null;
    const commentId = createId("cmt");

    try {
      const saved = await runTransaction(getFirebaseDb(), async (tx) => {
        const actRef = doc(getFirebaseDb(), "activities", input.activityId);
        const snap = await tx.get(actRef);
        if (!snap.exists()) throw appError("errors.activityNotFound");
        const existing = readDiscussion(input.activityId, snap.data());
        if (existing.length >= DISCUSSION_CAP) {
          throw appError("errors.threadFull");
        }

        const parent = parentId ? existing.find((row) => row.id === parentId) ?? null : null;
        if (parentId && (!parent || parent.activityId !== input.activityId)) {
          throw appError("errors.replyGone");
        }

        const comment: ActivityComment = {
          id: commentId,
          activityId: input.activityId,
          parentId,
          rootId: parent ? parent.rootId || parent.id : commentId,
          authorId: author.id,
          authorName: author.displayName,
          authorAvatar: author.avatarUrl,
          body,
          createdAt: nowIso(),
        };

        tx.update(actRef, {
          discussion: [...existing, stripUndefined(comment)],
          updatedAt: nowIso(),
        });
        return { comment, parent };
      });

      void notifyDiscussion(firebaseNotifications, activity, saved.comment, saved.parent);
      return saved.comment;
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (isPermissionDenied(err)) {
        throw appError("errors.saveReplyRules");
      }
      throw err;
    }
  },

  async remove(activityId, commentId, actorId) {
    try {
      return await runTransaction(getFirebaseDb(), async (tx) => {
        const actRef = doc(getFirebaseDb(), "activities", activityId);
        const snap = await tx.get(actRef);
        if (!snap.exists()) throw appError("errors.activityNotFound");
        const activity = snap.data();
        const existing = readDiscussion(activityId, activity);
        const index = existing.findIndex((row) => row.id === commentId);
        if (index < 0) throw appError("errors.replyGone");
        const current = existing[index];
        if (isCommentDeleted(current)) return current;
        const organizer = activity.creatorId === actorId;
        if (!organizer && current.authorId !== actorId) {
          throw appError("errors.deleteOwnReplies");
        }
        const next: ActivityComment = {
          ...current,
          deletedAt: nowIso(),
          deletedBy: actorId,
        };
        const discussion = existing.slice();
        discussion[index] = next;
        tx.update(actRef, {
          discussion: discussion.map((row) => stripUndefined(row)),
          updatedAt: nowIso(),
        });
        return next;
      });
    } catch (err) {
      if (err instanceof AppError) throw err;
      if (isPermissionDenied(err)) {
        throw appError("errors.deleteReplyRules");
      }
      throw err;
    }
  },
};
