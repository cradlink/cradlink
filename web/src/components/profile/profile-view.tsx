import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarDays, Lock, MapPin } from "lucide-react";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityCardSkeleton } from "@/components/activity/activity-card-skeleton";
import { LookingForChips } from "@/components/activity/looking-for-chips";
import { FollowButton } from "@/components/profile/follow-button";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useCreatedActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useFollow, useIncomingFollows, useOutgoingFollows } from "@/hooks/use-follows";
import { FEED_GRID } from "@/lib/activity-meta";
import { canSeeProfileActivities } from "@/lib/follow";
import { handleFromName } from "@/lib/format";
import { formatJoined, isActivityPast } from "@/lib/search";
import { isPrivateProfile, type Activity, type User } from "@/lib/types";

function sortActive(a: Activity, b: Activity) {
  return (a.startAt || a.createdAt).localeCompare(b.startAt || b.createdAt);
}

function sortPast(a: Activity, b: Activity) {
  return (b.endAt || b.startAt || b.createdAt).localeCompare(a.endAt || a.startAt || a.createdAt);
}

export function ProfileView({
  user,
  isSelf,
}: {
  user: User;
  isSelf?: boolean;
}) {
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const created = useCreatedActivities(user.id);
  const outgoing = useFollow(me?.id, user.id);
  const incoming = useIncomingFollows(user.id);
  const following = useOutgoingFollows(user.id);
  const [tab, setTab] = useState("active");
  const handle = handleFromName(user.displayName);
  const joined = formatJoined(user.createdAt);
  const privateAccount = isPrivateProfile(user);
  const locked =
    privateAccount &&
    !isSelf &&
    (outgoing.isLoading || !canSeeProfileActivities(me?.id, user, outgoing.data?.status));
  const followerCount = (incoming.data ?? []).filter((row) => row.status === "accepted").length;
  const followingCount = (following.data ?? []).filter((row) => row.status === "accepted").length;

  const visible = useMemo(() => {
    if (locked) return [];
    return (created.data ?? []).filter((activity) => activity.visibility === "public" || isSelf);
  }, [created.data, isSelf, locked]);

  const active = useMemo(() => visible.filter((activity) => !isActivityPast(activity)).sort(sortActive), [visible]);
  const past = useMemo(() => visible.filter((activity) => isActivityPast(activity)).sort(sortPast), [visible]);
  const list = tab === "past" ? past : active;

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
        <div className="flex items-center gap-6 px-2 py-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
            aria-label="Back"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold leading-6">{user.displayName}</h1>
            <p className="text-[13px] text-muted-foreground">
              {locked
                ? "Private account"
                : `${visible.length} ${visible.length === 1 ? "activity" : "activities"}`}
            </p>
          </div>
        </div>
      </div>

      <div className="relative h-32 bg-muted" />

      <div className="px-4">
        <div className="-mt-10 flex items-end justify-between">
          <span className="rounded-full bg-background p-1">
            <Avatar name={user.displayName} src={user.avatarUrl} size="xl" />
          </span>
          <div className="mb-1 flex flex-wrap justify-end gap-2">
            {isSelf ? (
              <Button asChild variant="outline" size="sm">
                <Link to="/profile/edit">Edit profile</Link>
              </Button>
            ) : (
              <FollowButton user={user} />
            )}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="inline-flex items-center gap-1.5 text-xl font-bold leading-6">
            {user.displayName}
            {privateAccount ? <Lock className="size-4 text-muted-foreground" aria-label="Private account" /> : null}
          </h2>
          <p className="text-[15px] leading-5 text-muted-foreground">@{handle}</p>
        </div>

        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-5">
          {user.bio || (isSelf ? "No bio yet. Edit your profile to add one." : "No bio yet.")}
        </p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[15px] text-muted-foreground">
          {user.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {user.location}
            </span>
          ) : null}
          {joined ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" />
              {joined}
            </span>
          ) : null}
        </div>

        <p className="mt-3 text-[15px] leading-5">
          <span className="font-bold">{followerCount}</span>{" "}
          <span className="text-muted-foreground">{followerCount === 1 ? "follower" : "followers"}</span>
          <span className="mx-2 text-muted-foreground">·</span>
          <span className="font-bold">{followingCount}</span>{" "}
          <span className="text-muted-foreground">following</span>
        </p>

        {user.skills.length > 0 ? (
          <div className="mt-3">
            <LookingForChips items={user.skills} limit={12} />
          </div>
        ) : null}
      </div>

      {locked ? (
        <div className="mt-6 border-t border-border px-8 py-16 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-foreground">
            <Lock className="size-7" />
          </span>
          <h2 className="mt-4 text-3xl font-bold">This account is private</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Follow @{handle} to see their activities. They’ll have to confirm your request.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-4">
            <Tabs
              value={tab}
              onChange={setTab}
              items={[
                { value: "active", label: "Active" },
                { value: "past", label: "Past" },
              ]}
            />
          </div>

          {created.isLoading ? (
            <div className={FEED_GRID}>
              <ActivityCardSkeleton />
              <ActivityCardSkeleton />
            </div>
          ) : null}

          {!created.isLoading && list.length === 0 ? (
            <div className="px-8 py-16 text-center">
              <h2 className="text-3xl font-bold">
                {tab === "past" ? "No past activities." : "No active activities."}
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground">
                {tab === "past"
                  ? isSelf
                    ? "Finished and cancelled ones will land here."
                    : `${user.displayName} hasn’t wrapped any activities yet.`
                  : isSelf
                    ? "Create one and it’ll show up here."
                    : `${user.displayName} hasn’t posted anything upcoming.`}
              </p>
            </div>
          ) : null}

          <div className={FEED_GRID}>
            {list.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} showJoin={tab !== "past"} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
