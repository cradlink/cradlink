import type {
  Activity,
  ActivityFilters,
  CreateActivityInput,
  MemberWithUser,
  Paginated,
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
};
