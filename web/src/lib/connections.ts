export type ConnectionsTab = "followers" | "following";

export function connectionsPath(userId: string, tab: ConnectionsTab, isSelf?: boolean) {
  if (isSelf) return tab === "followers" ? "/profile/followers" : "/profile/following";
  return `/u/${userId}/${tab}`;
}

export function profilePath(userId: string, isSelf?: boolean) {
  return isSelf ? "/profile" : `/u/${userId}`;
}
