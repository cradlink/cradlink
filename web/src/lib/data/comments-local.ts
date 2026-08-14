import type { CommentsRepo } from "@/lib/data/types";
import { localActivities, localMembers, localUsers } from "@/lib/data/local";
import { localNotifications } from "@/lib/data/notifications-local";
import { notifyDiscussion } from "@/lib/data/notify";
import { AppError } from "@/lib/errors";
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

async function assertCanDiscuss(activityId: string, userId: string) {
  const activity = await localActivities.getById(activityId);
  if (!activity) throw new AppError("Activity not found.");
  if (activity.creatorId === userId) return activity;
  const membership = await localMembers.getMembership(activityId, userId);
  if (membership?.status !== "joined") {
    throw new AppError("Join this activity to take part in the discussion.");
  }
  return activity;
}

export const localComments: CommentsRepo = {
  async listByActivity(activityId) {
    return Object.values(load())
      .filter((row) => row.activityId === activityId)
      .map((row) => ({
        ...row,
        rootId: row.rootId || row.parentId || row.id,
      }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async getById(id) {
    return load()[id] ?? null;
  },

  async create(input) {
    const body = input.body.trim();
    if (!body) throw new AppError("Write something first.");
    if (body.length > COMMENT_MAX_LENGTH) {
      throw new AppError(`Keep it under ${COMMENT_MAX_LENGTH} characters.`);
    }

    const activity = await assertCanDiscuss(input.activityId, input.authorId);
    const author = await localUsers.getById(input.authorId);
    if (!author) throw new AppError("User not found.");

    const parentId = input.parentId || null;
    const rows = load();
    const parent = parentId ? (rows[parentId] ?? null) : null;
    if (parentId && (!parent || parent.activityId !== input.activityId)) {
      throw new AppError("That reply is gone.");
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
    if (!activity) throw new AppError("Activity not found.");
    const rows = load();
    const current = rows[commentId];
    if (!current || current.activityId !== activityId) throw new AppError("That reply is gone.");
    if (isCommentDeleted(current)) return current;
    if (activity.creatorId !== actorId && current.authorId !== actorId) {
      throw new AppError("You can only delete your own replies.");
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
