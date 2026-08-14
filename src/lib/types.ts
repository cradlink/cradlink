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
export type FollowStatus = "none" | "following" | "pending";
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
  location: string;
  visibility: ProfileVisibility;
  createdAt: string;
  updatedAt: string;
};

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
  lookingFor: string[];
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

export type FollowRequest = {
  id: string;
  fromId: string;
  fromName: string;
  fromAvatar: string | null;
  toId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
};

export type NotificationType =
  | "joined"
  | "request"
  | "accepted"
  | "declined"
  | "updated"
  | "reminder"
  | "follow"
  | "follow_request"
  | "follow_accepted";

export type AppNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  activityId: string | null;
  actorId?: string | null;
  actorName: string;
  actorAvatar: string | null;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
};

export type UpdateProfileInput = {
  displayName?: string;
  bio?: string;
  skills?: string[];
  location?: string;
  avatarUrl?: string | null;
  visibility?: ProfileVisibility;
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
