export const ACTIVITY_TYPES = [
  "hackathon",
  "workshop",
  "research",
  "software",
  "game",
  "sports",
  "boardgames",
  "film",
  "social",
  "other",
] as const;

export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export type LocationType = "online" | "in-person" | "hybrid";
export type ActivityStatus = "open" | "full" | "cancelled" | "completed";
export type Visibility = "public" | "unlisted";
export type ProfileVisibility = "public" | "private";
export type FollowStatus = "pending" | "accepted";
export type MemberStatus = "joined" | "pending" | "declined";
export type JoinPolicy = "auto" | "manual";
export type HeadcountMode = "open" | "limit" | "range" | "estimate";

export type Headcount = {
  mode: HeadcountMode;
  min?: number | null;
  max?: number | null;
  about?: number | null;
};

export type User = {
  id: string;
  displayName: string;
  email: string;
  bio: string;
  skills: string[];
  avatarUrl: string | null;
  bannerUrl?: string | null;
  location: string;
  createdAt: string;
  updatedAt: string;
  emailVerified?: boolean;
  profileVisibility?: ProfileVisibility;
  locale?: string | null;
  deactivatedAt?: string | null;
  username?: string | null;
};

export function isPrivateProfile(user: Pick<User, "profileVisibility">) {
  return user.profileVisibility === "private";
}

export type Follow = {
  id: string;
  followerId: string;
  followeeId: string;
  status: FollowStatus;
  createdAt: string;
};

export type FollowWithUser = Follow & { user: User };

export function needsEmailVerification(user: User | null) {
  return Boolean(user && user.emailVerified === false);
}

export type ActivityLocation = {
  type: LocationType;
  city?: string;
  venue?: string;
};

export type Activity = {
  id: string;
  title: string;
  description: string;
  type: ActivityType;
  lookingFor: string[];
  tags: string[];
  location: ActivityLocation;
  startAt: string | null;
  endAt: string | null;
  isFlexible: boolean;
  capacity: number | null;
  joinPolicy: JoinPolicy;
  headcount: Headcount;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string | null;
  memberCount: number;
  status: ActivityStatus;
  createdAt: string;
  updatedAt: string;
  visibility: Visibility;
  images: string[];
};

export type ActivityMember = {
  id: string;
  activityId: string;
  userId: string;
  status: MemberStatus;
  joinedAt: string;
  role?: string;
};

export type MemberWithUser = ActivityMember & { user: User };

export type CreateActivityInput = {
  title: string;
  description: string;
  type: ActivityType;
  lookingFor?: string[];
  tags?: string[];
  location: ActivityLocation;
  startAt: string | null;
  endAt: string | null;
  isFlexible: boolean;
  capacity: number | null;
  joinPolicy?: JoinPolicy;
  headcount?: Headcount;
  visibility?: Visibility;
  images?: string[];
};

export type UpdateActivityInput = CreateActivityInput;

export type UpdateProfileInput = {
  displayName?: string;
  username?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  profileVisibility?: ProfileVisibility;
  locale?: string | null;
  deactivatedAt?: string | null;
};

export type ActivityFilters = {
  type?: ActivityType | "all";
  locationType?: LocationType | "all";
  cursor?: string | null;
  limit?: number;
};

export type Paginated<T> = {
  items: T[];
  nextCursor: string | null;
};

export const COMMENT_MAX_LENGTH = 280;

export type ActivityComment = {
  id: string;
  activityId: string;
  parentId: string | null;
  rootId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  body: string;
  createdAt: string;
  deletedAt?: string | null;
  deletedBy?: string | null;
};

export function isCommentDeleted(comment: Pick<ActivityComment, "deletedAt">) {
  return Boolean(comment.deletedAt);
}

export type NotificationKind =
  | "joined"
  | "join_request"
  | "accepted"
  | "declined"
  | "edited"
  | "comment"
  | "reply"
  | "follow_request"
  | "followed"
  | "kicked"
  | "reminder_day"
  | "reminder_hour";

export type AppNotification = {
  id: string;
  recipientId: string;
  kind: NotificationKind;
  activityId: string;
  activityTitle: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string | null;
  commentId?: string;
  createdAt: string;
  read: boolean;
};
