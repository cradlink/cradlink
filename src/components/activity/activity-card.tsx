import Link from "next/link";
import { Calendar, MapPin, Users } from "lucide-react";
import { ActivityCover } from "@/components/activity/activity-gallery";
import { JoinButton } from "@/components/activity/join-button";
import { LookingForChips } from "@/components/activity/looking-for-chips";
import { TypeBadge } from "@/components/activity/type-badge";
import { Avatar } from "@/components/ui/avatar";
import { LOCATION_LABELS } from "@/lib/activity-meta";
import { formatHeadcount, formatJoinPolicy } from "@/lib/headcount";
import { formatActivityWhen, formatLocation } from "@/lib/format";
import type { Activity } from "@/lib/types";

export function ActivityCard({
  activity,
  showJoin = true,
}: {
  activity: Activity;
  showJoin?: boolean;
}) {
  return (
    <article className="border-b border-border px-4 py-3 transition-colors hover:bg-hover">
      <div className="flex gap-3">
        <Link href={`/u/${activity.creatorId}`} className="shrink-0 pt-0.5">
          <Avatar name={activity.creatorName} src={activity.creatorAvatar} />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[15px] leading-5">
            <Link href={`/u/${activity.creatorId}`} className="font-bold hover:underline">
              {activity.creatorName}
            </Link>
            <span className="text-muted-foreground">·</span>
            <TypeBadge type={activity.type} />
            <span className="text-[13px] text-muted-foreground">
              {LOCATION_LABELS[activity.location.type]}
              {activity.status === "full" ? " · Full" : ""}
            </span>
          </div>

          <Link href={`/activities/${activity.id}`} className="mt-1 block">
            <h3 className="text-[17px] font-bold leading-6 text-foreground">{activity.title}</h3>
            <p className="mt-1 line-clamp-4 text-[15px] leading-5 text-foreground">
              {activity.description}
            </p>
          </Link>

          {activity.tags?.length ? (
            <LookingForChips items={activity.tags} limit={5} className="mt-2" />
          ) : null}
          {activity.lookingFor.length > 0 ? (
            <LookingForChips items={activity.lookingFor} limit={4} className="mt-1.5" />
          ) : null}

          <div className="mt-2 flex flex-col gap-1 text-[13px] leading-4 text-muted-foreground">
            <p className="flex items-start gap-1.5">
              <MapPin className="mt-px size-3.5 shrink-0" />
              <span>{formatLocation(activity)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Calendar className="size-3.5 shrink-0" />
              <span>{formatActivityWhen(activity)}</span>
            </p>
            <p className="flex items-center gap-1.5">
              <Users className="size-3.5 shrink-0" />
              <span>
                {formatHeadcount(activity)} · {formatJoinPolicy(activity.joinPolicy ?? "auto")}
              </span>
            </p>
          </div>

          <Link href={`/activities/${activity.id}`} className="mt-3 block">
            <ActivityCover
              activity={activity}
              className="aspect-[16/9] rounded-2xl border border-border"
            />
          </Link>

          {showJoin ? (
            <div className="mt-3 flex justify-end">
              <JoinButton activity={activity} size="sm" />
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
