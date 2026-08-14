import { Link, useParams } from "react-router-dom";
import { Calendar, MapPin, Users } from "lucide-react";
import { ActivityGallery } from "@/components/activity/activity-gallery";
import { JoinButton } from "@/components/activity/join-button";
import { LookingForChips } from "@/components/activity/looking-for-chips";
import { TypeBadge } from "@/components/activity/type-badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity, useActivityMembers } from "@/hooks/use-activity";
import { useAuth } from "@/hooks/use-auth";
import { useJoinLeave } from "@/hooks/use-membership";
import { errorMessage } from "@/lib/errors";
import { formatHeadcount, formatJoinPolicy } from "@/lib/headcount";
import { formatActivityWhen, formatLocation } from "@/lib/format";
import { toast } from "sonner";

export function ActivityDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useAuth();
  const activityQuery = useActivity(id);
  const membersQuery = useActivityMembers(id);
  const { accept, decline } = useJoinLeave();
  const activity = activityQuery.data;
  const joined = (membersQuery.data ?? []).filter((m) => m.status === "joined");
  const pending = (membersQuery.data ?? []).filter((m) => m.status === "pending");
  const isOrganizer = Boolean(user && activity && user.id === activity.creatorId);

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
        <h1 className="font-display text-3xl">This activity isn’t here.</h1>
        <p className="mt-2 text-sm text-muted-foreground">It may have been removed.</p>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          Back to feed
        </Link>
      </div>
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Organizer</p>
              <p className="font-medium">{activity.creatorName}</p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2">
            {isOrganizer ? (
              <Button asChild variant="outline" size="lg">
                <Link to={`/activities/edit/${activity.id}`}>Edit</Link>
              </Button>
            ) : null}
            <JoinButton activity={activity} size="lg" />
          </div>
        </div>

        <div className="max-w-2xl space-y-3">
          <h2 className="font-display text-2xl">The idea</h2>
          <p className="whitespace-pre-wrap text-base leading-relaxed">{activity.description}</p>
        </div>

        {activity.tags?.length ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Tags</h2>
            <LookingForChips items={activity.tags} limit={12} />
          </div>
        ) : null}

        {activity.lookingFor.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Looking for</h2>
            <LookingForChips items={activity.lookingFor} limit={12} />
          </div>
        ) : null}

        {isOrganizer && pending.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-bold">Requests</h2>
            <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
              {pending.map((member) => (
                <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                  <Link to={`/u/${member.user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={member.user.displayName} src={member.user.avatarUrl} />
                    <div className="min-w-0">
                      <p className="truncate font-bold">{member.user.displayName}</p>
                      <p className="truncate text-[13px] text-muted-foreground">Wants to join</p>
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
                        toast.success("Declined.");
                      } catch (err) {
                        toast.error(errorMessage(err));
                      }
                    }}
                  >
                    Decline
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
                        toast.success("Accepted.");
                      } catch (err) {
                        toast.error(errorMessage(err));
                      }
                    }}
                  >
                    Accept
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-3">
          <h2 className="text-2xl font-bold">People</h2>
          {membersQuery.isLoading ? <Skeleton className="h-20 w-full" /> : null}
          <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
            {joined.map((member) => (
              <li key={member.id}>
                <Link
                  to={`/u/${member.user.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-hover"
                >
                  <Avatar name={member.user.displayName} src={member.user.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{member.user.displayName}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {member.role === "organizer" ? "Organizer" : "Joined"}
                      {member.user.location ? ` · ${member.user.location}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
