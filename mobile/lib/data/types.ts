import type {
  Activity,
  ActivityFilters,
  CreateActivityInput,
  MemberWithUser,
  Paginated,
  UpdateActivityInput,
  User,
} from "@/lib/types"

export type { ActivityMember } from "@/lib/types"

export type UsersRepo = {
  getById(id: string): Promise<User | null>
  getByIds(ids: string[]): Promise<User[]>
  list(): Promise<User[]>
}

export type ActivitiesRepo = {
  list(filters?: ActivityFilters): Promise<Paginated<Activity>>
  getById(id: string): Promise<Activity | null>
  create(creator: User, input: CreateActivityInput): Promise<Activity>
  update(id: string, actorId: string, input: UpdateActivityInput): Promise<Activity>
  remove(id: string, actorId: string): Promise<void>
  listCreatedBy(userId: string): Promise<Activity[]>
  listJoinedBy(userId: string): Promise<Activity[]>
}

export type MembersRepo = {
  listByActivity(activityId: string): Promise<MemberWithUser[]>
  listByUser(userId: string): Promise<import("@/lib/types").ActivityMember[]>
  getMembership(activityId: string, userId: string): Promise<MemberWithUser | null>
  join(activityId: string, userId: string): Promise<Activity>
  leave(activityId: string, userId: string): Promise<Activity>
  accept(activityId: string, userId: string, actorId: string): Promise<Activity>
  decline(activityId: string, userId: string, actorId: string): Promise<Activity>
}
