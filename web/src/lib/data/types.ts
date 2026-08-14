import type {
  Activity,
  ActivityComment,
  ActivityFilters,
  AppNotification,
  CreateActivityInput,
  MemberWithUser,
  Paginated,
  UpdateActivityInput,
  UpdateProfileInput,
  User,
} from "@/lib/types";

export type UsersRepo = {
  getById(id: string): Promise<User | null>;
  getByIds(ids: string[]): Promise<User[]>;
  upsert(user: User): Promise<User>;
  update(id: string, patch: UpdateProfileInput): Promise<User>;
};

export type ActivitiesRepo = {
  list(filters: ActivityFilters): Promise<Paginated<Activity>>;
  getById(id: string): Promise<Activity | null>;
  create(creator: User, input: CreateActivityInput): Promise<Activity>;
  update(id: string, actorId: string, input: UpdateActivityInput): Promise<Activity>;
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
};

export type StorageRepo = {
  uploadAvatar(userId: string, file: File): Promise<string>;
  uploadActivityImage(userId: string, file: File): Promise<string>;
};

export type NotificationsRepo = {
  list(userId: string): Promise<AppNotification[]>;
  ensure(notification: AppNotification): Promise<{ created: boolean; notification: AppNotification }>;
  markRead(id: string, userId: string): Promise<void>;
  markAllRead(userId: string): Promise<void>;
};

export type CreateCommentInput = {
  activityId: string;
  authorId: string;
  body: string;
  parentId?: string | null;
};

export type CommentsRepo = {
  listByActivity(activityId: string): Promise<ActivityComment[]>;
  getById(id: string): Promise<ActivityComment | null>;
  create(input: CreateCommentInput): Promise<ActivityComment>;
};
