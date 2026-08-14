"use client";

import { useCallback, useMemo, useState } from "react";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityCardSkeleton } from "@/components/activity/activity-card-skeleton";
import { FeedFilters } from "@/components/activity/feed-filters";
import { useActivityFeed } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { FEED_GRID } from "@/lib/activity-meta";
import type { ActivityType, LocationType } from "@/lib/types";

export default function FeedPage() {
  const { user, ready } = useAuth();
  const [type, setType] = useState<ActivityType | "all">("all");
  const [locationType, setLocationType] = useState<LocationType | "all">("all");
  const filters = useMemo(() => ({ type, locationType }), [type, locationType]);
  const feed = useActivityFeed(filters);
  const loadMore = useCallback(() => {
    if (feed.hasNextPage && !feed.isFetchingNextPage) {
      void feed.fetchNextPage();
    }
  }, [feed]);
  const sentinel = useInfiniteScroll(loadMore, Boolean(feed.hasNextPage));

  const activities = feed.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">Home</h1>
        <p className="text-[13px] text-muted-foreground">
          {ready && user ? `Hi ${user.displayName.split(" ")[0]}.` : "What’s assembling"}
        </p>
      </div>

      <div className="border-b border-border px-4 py-3">
        <FeedFilters
          type={type}
          locationType={locationType}
          onType={setType}
          onLocation={setLocationType}
        />
      </div>

      {feed.isLoading ? (
        <div className={FEED_GRID}>
          {Array.from({ length: 4 }).map((_, i) => (
            <ActivityCardSkeleton key={i} />
          ))}
        </div>
      ) : null}

      {feed.isError ? (
        <Empty title="Couldn’t load the feed." body="Refresh and try again." />
      ) : null}

      {!feed.isLoading && activities.length === 0 ? (
        <Empty
          title="Nothing here yet."
          body="Try another filter, or be the one who posts first."
        />
      ) : null}

      <div className={FEED_GRID}>
        {activities.map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>

      <div ref={sentinel} />
      {feed.isFetchingNextPage ? (
        <p className="py-4 text-center text-[13px] text-muted-foreground">Loading more…</p>
      ) : null}
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-8 py-16 text-center">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-[15px] text-muted-foreground">{body}</p>
    </div>
  );
}
