import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, Lock, MapPin, Users } from "lucide-react";
import { ActivityDiscussion } from "@/components/activity/activity-discussion";
import { ActivityGallery } from "@/components/activity/activity-gallery";
import { JoinButton } from "@/components/activity/join-button";
import { FollowButton } from "@/components/profile/follow-button";
import { TypeBadge } from "@/components/activity/type-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity, useActivityMembers, useMembership } from "@/hooks/use-activity";
import { useAuth } from "@/hooks/use-auth";
import { useFollow } from "@/hooks/use-follows";
import { useJoinLeave } from "@/hooks/use-membership";
import { useUser } from "@/hooks/use-profile";
import { isDeactivated } from "@/lib/account";
import { canSeeProfileActivities } from "@/lib/follow";
import { errorMessage } from "@/lib/errors";
import { formatHeadcount, formatJoinPolicy } from "@/lib/headcount";
import { formatActivityWhen, formatLocation } from "@/lib/format";
import { toast } from "sonner";

export function ActivityDetailPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useAuth();
  const activityQuery = useActivity(id);
  const membersQuery = useActivityMembers(id);
  const membershipQuery = useMembership(id, user?.id);
  const { accept, decline, kick } = useJoinLeave();
  const [kickUserId, setKickUserId] = useState<string | null>(null);
  const activity = activityQuery.data;
  const joined = (membersQuery.data ?? []).filter((m) => m.status === "joined");
  const pending = (membersQuery.data ?? []).filter((m) => m.status === "pending");
  const isOrganizer = Boolean(user && activity && user.id === activity.creatorId);
  const membershipStatus = membershipQuery.data?.status === "joined" || membershipQuery.data?.status === "pending"
    ? membershipQuery.data.status
    : null;
  const canDiscuss = Boolean(user && activity);
  const creatorQuery = useUser(activity?.creatorId);
  const followQuery = useFollow(user?.id, activity?.creatorId);
  const canSeePrivate = Boolean(
    isOrganizer
    || membershipStatus === "joined"
    || (creatorQuery.data
      && canSeeProfileActivities(user?.id, creatorQuery.data, followQuery.data?.status)),
  );

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!activity || (creatorQuery.data && isDeactivated(creatorQuery.data))) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <h1 className="font-display text-3xl">{t("activity.missingTitle")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("activity.missingBody")}</p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          {t("activity.backToFeed")}
        </Link>
      </div>
    );
  }

  if (!isOrganizer && membershipStatus !== "joined" && (creatorQuery.isLoading || followQuery.isLoading)) {
    return (
      <div className="space-y-4 px-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (creatorQuery.data && !canSeePrivate) {
    return (
      <article>
        <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
          <h1 className="truncate text-xl font-bold">{t("activity.privateTitle")}</h1>
        </div>
        <div className="px-8 py-16 text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full border-2 border-foreground">
            <Lock className="size-7" />
          </span>
          <h1 className="mt-4 text-3xl font-bold">{t("activity.privateHeading")}</h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {t("activity.privateBody", { name: creatorQuery.data.displayName })}
          </p>
          <div className="mt-5 flex justify-center">
            <FollowButton user={creatorQuery.data} size="default" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="truncate text-xl font-bold">{activity.title}</h1>
      </div>
      <div className="space-y-6 px-4 py-4">
        <ActivityGallery activity={activity} />
        <div className="space-y-3">
          <TypeBadge type={activity.type} />
          <h1 className="max-w-3xl font-display text-4xl font-semibold tracking-tight">{activity.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-4" />
              {formatLocation(activity)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" />
              {formatActivityWhen(activity)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" />
              {formatHeadcount(activity)}
            </span>
            <span>{formatJoinPolicy(activity.joinPolicy ?? "auto")}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4">
          <Link to={`/u/${activity.creatorId}`} className="flex items-center gap-3">
            <Avatar name={activity.creatorName} src={activity.creatorAvatar} />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("activity.organizer")}</p>
              <p className="font-medium">{activity.creatorName}</p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2">
            {isOrganizer ? (
              <Button asChild variant="outline" size="lg">
                <Link to={`/activities/edit/${activity.id}`}>{t("common.edit")}</Link>
              </Button>
            ) : null}
            <JoinButton activity={activity} size="lg" />
          </div>
        </div>

        <div className="max-w-2xl space-y-3">
          <h2 className="font-display text-2xl">{t("activity.theIdea")}</h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{activity.description}</p>
        </div>

        {isOrganizer && pending.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">{t("activity.requests")}</h2>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {pending.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <Link to={`/u/${member.user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={member.user.displayName} src={member.user.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{member.user.displayName}</p>
                      <p className="truncate text-[13px] text-muted-foreground">{t("activity.wantsToJoin")}</p>
                    </div>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decline.isPending}
                    onClick={async () => {
                      if (!user) return;
                      try {
                        await decline.mutateAsync({
                          activityId: activity.id,
                          userId: member.userId,
                          actorId: user.id,
                        });
                        toast.success(t("common.declined"));
                      } catch (err) {
                        toast.error(errorMessage(err));
                      }
                    }}
                  >
                    {t("common.decline")}
                  </Button>
                  <Button
                    size="sm"
                    disabled={accept.isPending}
                    onClick={async () => {
                      if (!user) return;
                      try {
                        await accept.mutateAsync({
                          activityId: activity.id,
                          userId: member.userId,
                          actorId: user.id,
                        });
                        toast.success(t("common.accepted"));
                      } catch (err) {
                        toast.error(errorMessage(err));
                      }
                    }}
                  >
                    {t("common.accept")}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-3">
          <h2 className="text-2xl font-bold">{t("activity.people")}</h2>
          {membersQuery.isLoading ? <Skeleton className="h-20 w-full" /> : null}
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {joined.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/u/${member.user.id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-90">
                  <Avatar name={member.user.displayName} src={member.user.avatarUrl} />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{member.user.displayName}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {member.role === "organizer" ? t("activity.organizer") : t("activity.joined")}
                      {member.user.location ? ` · ${member.user.location}` : ""}
                    </p>
                  </div>
                </Link>
                {isOrganizer && member.user.id !== user?.id ? (
                  <Button size="sm" variant="outline" onClick={() => setKickUserId(member.user.id)}>
                    {t("common.remove")}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ActivityDiscussion
        activity={activity}
        user={user}
        canDiscuss={canDiscuss}
        isOrganizer={isOrganizer}
      />

      <Dialog open={Boolean(kickUserId)} onOpenChange={(open) => !open && setKickUserId(null)}>
        <h2 className="text-xl font-bold">{t("activity.removePersonTitle")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t("activity.removePersonBody")}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setKickUserId(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="ink"
            disabled={kick.isPending}
            onClick={async () => {
              if (!user || !kickUserId) return;
              try {
                await kick.mutateAsync({
                  activityId: activity.id,
                  userId: kickUserId,
                  actorId: user.id,
                });
                toast.success(t("common.removed"));
                setKickUserId(null);
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            {t("common.remove")}
          </Button>
        </div>
      </Dialog>
    </article>
  );
}
