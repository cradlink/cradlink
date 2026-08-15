import type {
  Activity,
  ActivityComment,
  ActivityFilters,
  AppNotification,
  CreateActivityInput,
  Follow,
  FollowWithUser,
  MemberWithUser,
  Paginated,
  UpdateActivityInput,
  UpdateProfileInput,
  User,
} from "@/lib/types";

export type UsersRepo = {
  getById(id: string): Promise<User | null>;
  getByIds(ids: string[]): Promise<User[]>;
  list(limit?: number): Promise<User[]>;
  upsert(user: User): Promise<User>;
  update(id: string, patch: UpdateProfileInput): Promise<User>;
};

export type ActivitiesRepo = {
  list(filters: ActivityFilters): Promise<Paginated<Activity>>;
  getById(id: string): Promise<Activity | null>;
  create(creator: User, input: CreateActivityInput): Promise<Activity>;
  update(id: string, actorId: string, input: UpdateActivityInput): Promise<Activity>;
  remove(id: string, actorId: string): Promise<void>;
  listCreatedBy(userId: string): Promise<Activity[]>;
  listJoinedBy(userId: string): Promise<Activity[]>;
};

export type MembersRepo = {
  listByActivity(activityId: string): Promise<MemberWithUser[]>;
  getMembership(activityId: string, userId: string): Promise<MemberWithUser | null>;
  join(activityId: string, userId: string): Promise<Activity>;
  leave(activityId: string, userId: string): Promise<Activity>;
  accept(activityId: string, userId: string, actorId: string): Promise<Activity>;
  decline(activityId: string, userId: string, actorId: string): Promise<Activity>;
  kick(activityId: string, userId: string, actorId: string): Promise<Activity>;
};

export type StorageRepo = {
  uploadAvatar(userId: string, file: File): Promise<string>;
  uploadBanner(userId: string, file: File): Promise<string>;
  uploadActivityImage(userId: string, file: File): Promise<string>;
};

export type NotificationsRepo = {
  list(userId: string): Promise<AppNotification[]>;
  ensure(notification: AppNotification): Promise<{ created: boolean; notification: AppNotification }>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
  remove(id: string, userId: string): Promise<void>;
};

export type CreateCommentInput = {
  activityId: string;
  authorId: string;
  body: string;
  parentId?: string | null;
};

export type FollowsRepo = {
  get(followerId: string, followeeId: string): Promise<Follow | null>;
  listOutgoing(userId: string): Promise<Follow[]>;
  listIncoming(userId: string): Promise<Follow[]>;
  listFollowers(userId: string): Promise<FollowWithUser[]>;
  listFollowing(userId: string): Promise<FollowWithUser[]>;
  listRequests(userId: string): Promise<FollowWithUser[]>;
  follow(actorId: string, targetId: string): Promise<Follow>;
  unfollow(actorId: string, targetId: string): Promise<void>;
  accept(actorId: string, followerId: string): Promise<Follow>;
  decline(actorId: string, followerId: string): Promise<void>;
  acceptAllPending(userId: string): Promise<void>;
};

export type CommentsRepo = {
  listByActivity(activityId: string): Promise<ActivityComment[]>;
  getById(id: string): Promise<ActivityComment | null>;
  create(input: CreateCommentInput): Promise<ActivityComment>;
  remove(activityId: string, commentId: string, actorId: string): Promise<ActivityComment>;
};
