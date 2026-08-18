import type { CommentsRepo } from "@/lib/data/types";
import { localActivities, localUsers } from "@/lib/data/local";
import { localNotifications } from "@/lib/data/notifications-local";
import { notifyDiscussion } from "@/lib/data/notify";
import { appError } from "@/lib/errors";
import { COMMENT_MAX_LENGTH, isCommentDeleted, type ActivityComment } from "@/lib/types";
import { createId, nowIso } from "@/lib/utils";

const KEY = "cl_comments";

function load(): Record<string, ActivityComment> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, ActivityComment>;
  } catch {
    return {};
  }
}

function save(rows: Record<string, ActivityComment>) {
  localStorage.setItem(KEY, JSON.stringify(rows));
}

async function assertCanDiscuss(activityId: string) {
  const activity = await localActivities.getById(activityId);
  if (!activity) throw appError("errors.activityNotFound");
  return activity;
}

export const localComments: CommentsRepo = {
  async listByActivity(activityId) {
    const rows = Object.values(load())
      .filter((row) => row.activityId === activityId)
      .map((row) => ({
        ...row,
        rootId: row.rootId || row.parentId || row.id,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const authors = await localUsers.getByIds(rows.map((row) => row.authorId));
    const byId = new Map(authors.map((user) => [user.id, user]));
    return rows.map((row) => {
      const author = byId.get(row.authorId);
      if (!author) return row;
      return {
        ...row,
        authorName: author.displayName,
        authorAvatar: author.avatarUrl,
      };
    });
  },

  async getById(id) {
    return load()[id] ?? null;
  },

  async create(input) {
    const body = input.body.trim();
    if (!body) throw appError("errors.writeSomething");
    if (body.length > COMMENT_MAX_LENGTH) {
      throw appError("errors.commentTooLong", { max: COMMENT_MAX_LENGTH });
    }

    const activity = await assertCanDiscuss(input.activityId);
    const author = await localUsers.getById(input.authorId);
    if (!author) throw appError("errors.userNotFound");

    const parentId = input.parentId || null;
    const rows = load();
    const parent = parentId ? (rows[parentId] ?? null) : null;
    if (parentId && (!parent || parent.activityId !== input.activityId)) {
      throw appError("errors.replyGone");
    }

    const id = createId("cmt");
    const comment: ActivityComment = {
      id,
      activityId: input.activityId,
      parentId,
      rootId: parent ? parent.rootId || parent.id : id,
      authorId: author.id,
      authorName: author.displayName,
      authorAvatar: author.avatarUrl,
      body,
      createdAt: nowIso(),
    };
    rows[comment.id] = comment;
    save(rows);
    void notifyDiscussion(localNotifications, activity, comment, parent);
    return comment;
  },

  async remove(activityId, commentId, actorId) {
    const activity = await localActivities.getById(activityId);
    if (!activity) throw appError("errors.activityNotFound");
    const rows = load();
    const current = rows[commentId];
    if (!current || current.activityId !== activityId) throw appError("errors.replyGone");
    if (isCommentDeleted(current)) return current;
    if (activity.creatorId !== actorId && current.authorId !== actorId) {
      throw appError("errors.deleteOwnReplies");
    }
    const next: ActivityComment = {
      ...current,
      deletedAt: nowIso(),
      deletedBy: actorId,
    };
    rows[commentId] = next;
    save(rows);
    return next;
  },
};
