import { isPrivateProfile, type FollowStatus, type User } from "@/lib/types";

export function canSeeProfileActivities(
  viewerId: string | undefined,
  profile: Pick<User, "id" | "profileVisibility">,
  outgoingStatus: FollowStatus | null | undefined,
) {
  if (!viewerId) return !isPrivateProfile(profile);
  if (viewerId === profile.id) return true;
  if (!isPrivateProfile(profile)) return true;
  return outgoingStatus === "accepted";
}

export function followRequestId(followerId: string) {
  return `follow_request_${followerId}`;
}

export function followedNotificationId(followerId: string, followeeId: string) {
  return `followed_${followerId}_${followeeId}`;
}
