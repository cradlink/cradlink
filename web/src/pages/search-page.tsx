import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { ActivityCard } from "@/components/activity/activity-card";
import { ActivityCardSkeleton } from "@/components/activity/activity-card-skeleton";
import { UserRow } from "@/components/search/user-row";
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useSearchResults } from "@/hooks/use-search";
import { useVisibleActivities } from "@/hooks/use-visible-activities";
import { FEED_GRID } from "@/lib/activity-meta";

const TABS = [
  { value: "top", label: "Top" },
  { value: "activities", label: "Activities" },
  { value: "people", label: "People" },
] as const;

type SearchTab = (typeof TABS)[number]["value"];

function parseTab(value: string | null): SearchTab {
  if (value === "activities" || value === "people") return value;
  return "top";
}

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const tab = parseTab(params.get("f"));
  const [draft, setDraft] = useState(q);
  const { user } = useAuth();
  const results = useSearchResults(q);
  const visibleActivities = useVisibleActivities(user?.id, results.activities);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = draft.trim();
      if (next === q) return;
      setParams(
        (current) => {
          const copy = new URLSearchParams(current);
          if (next) copy.set("q", next);
          else copy.delete("q");
          return copy;
        },
        { replace: true },
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, q, setParams]);

  function setTab(value: string) {
    setParams(
      (current) => {
        const copy = new URLSearchParams(current);
        if (value === "top") copy.delete("f");
        else copy.set("f", value);
        return copy;
      },
      { replace: true },
    );
  }

  const showPeople = tab === "top" || tab === "people";
  const showActivities = tab === "top" || tab === "activities";
  const people = tab === "top" ? results.people.slice(0, 5) : results.people;
  const activities = visibleActivities;
  const empty = Boolean(q) && !results.isLoading && people.length === 0 && activities.length === 0;

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
        <div className="px-4 py-2">
          <label className="flex items-center gap-3 rounded-full bg-muted px-4 py-2 ring-1 ring-transparent focus-within:bg-background focus-within:ring-primary">
            <Search className="size-[18px] shrink-0 text-muted-foreground" />
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Search"
              autoFocus
              className="h-8 w-full bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {draft ? (
              <button
                type="button"
                onClick={() => setDraft("")}
                className="flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </label>
        </div>
        <Tabs value={tab} onChange={setTab} items={[...TABS]} />
      </div>

      {!q ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">Search Cradlink</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Find people or activities — same idea as Explore on X.
          </p>
        </div>
      ) : null}

      {q && results.isLoading ? (
        <div className={FEED_GRID}>
          <ActivityCardSkeleton />
          <ActivityCardSkeleton />
        </div>
      ) : null}

      {q && results.isError ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">Couldn’t search.</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">Refresh and try again.</p>
        </div>
      ) : null}

      {empty ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">No results for “{q}”</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">Try a name, a place, or an activity type.</p>
        </div>
      ) : null}

      {q && !results.isLoading && !results.isError && !empty ? (
        <div>
          {showPeople && people.length > 0 ? (
            <section>
              {tab === "top" ? (
                <h2 className="px-4 pb-1 pt-3 text-xl font-bold">People</h2>
              ) : null}
              <div className="divide-y divide-border border-b border-border">
                {people.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </div>
            </section>
          ) : null}

          {showActivities && activities.length > 0 ? (
            <section>
              {tab === "top" ? (
                <h2 className="px-4 pb-1 pt-3 text-xl font-bold">Activities</h2>
              ) : null}
              <div className={FEED_GRID}>
                {activities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            </section>
          ) : null}

          {tab === "people" && people.length === 0 && activities.length > 0 ? (
            <p className="px-8 py-12 text-center text-[15px] text-muted-foreground">No people match that.</p>
          ) : null}
          {tab === "activities" && activities.length === 0 && people.length > 0 ? (
            <p className="px-8 py-12 text-center text-[15px] text-muted-foreground">No activities match that.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
