import { useState } from "react";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityCardSkeleton } from "@/components/activity/activity-card-skeleton";
import { Tabs } from "@/components/ui/tabs";
import { useCreatedActivities, useJoinedActivities } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { FEED_GRID } from "@/lib/activity-meta";

export function MyActivitiesPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState("created");
  const created = useCreatedActivities(user?.id);
  const joined = useJoinedActivities(user?.id);
  const list = tab === "created" ? created : joined;

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">My activities</h1>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "created", label: "Created" },
            { value: "joined", label: "Joined" },
          ]}
        />
      </div>
      {list.isLoading ? (
        <div className={FEED_GRID}>
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
        </div>
      ) : null}
      {!list.isLoading && (list.data?.length ?? 0) === 0 ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">
            {tab === "created" ? "You haven’t posted yet." : "You haven’t joined anything yet."}
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {tab === "created" ? "Create one from the sidebar." : "The feed is full of open seats."}
          </p>
        </div>
      ) : null}
      <div className={FEED_GRID}>
        {(list.data ?? []).map((activity) => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
