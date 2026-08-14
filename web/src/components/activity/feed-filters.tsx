import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ACTIVITY_META, activityTypeLabel, locationLabel } from "@/lib/activity-meta";
import { ACTIVITY_TYPES, type ActivityType, type LocationType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FeedFilters({
  type,
  locationType,
  onType,
  onLocation,
}: {
  type: ActivityType | "all";
  locationType: LocationType | "all";
  onType: (value: ActivityType | "all") => void;
  onLocation: (value: LocationType | "all") => void;
}) {
  const { t } = useTranslation();
  const locations: { value: LocationType | "all"; label: string }[] = [
    { value: "all", label: t("feed.anyPlace") },
    { value: "online", label: locationLabel("online") },
    { value: "in-person", label: locationLabel("in-person") },
    { value: "hybrid", label: locationLabel("hybrid") },
  ];
  return (
    <div className="space-y-3">
      <ChipScroller>
        <FilterChip active={type === "all"} onClick={() => onType("all")}>
          {t("feed.allTypes")}
        </FilterChip>
        {ACTIVITY_TYPES.map((value) => (
          <FilterChip key={value} active={type === value} onClick={() => onType(value)}>
            <span className={cn("size-1.5 rounded-full", ACTIVITY_META[value].dot)} />
            {activityTypeLabel(value)}
          </FilterChip>
        ))}
      </ChipScroller>
      <ChipScroller>
        {locations.map((item) => (
          <FilterChip
            key={item.value}
            active={locationType === item.value}
            onClick={() => onLocation(item.value)}
          >
            {item.label}
          </FilterChip>
        ))}
      </ChipScroller>
    </div>
  );
}

function ChipScroller({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const scroller = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    const left = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(left > 2);
    setCanRight(max - left > 2);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    const inner = track.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (inner) observer.observe(inner);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scroll(direction: -1 | 1) {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: direction * Math.max(180, el.clientWidth * 0.7), behavior: "smooth" });
  }

  return (
    <div className="group/scroll relative">
      <div
        ref={scroller}
        className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        <div ref={track} className="flex w-max gap-2">
          {children}
        </div>
      </div>
      {canLeft ? (
        <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-14 items-center bg-gradient-to-r from-background from-35% to-transparent group-hover/scroll:flex">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={t("feed.scrollLeft")}
            className="pointer-events-auto ml-0.5 flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-[0_0_8px_rgba(0,0,0,0.18)] hover:bg-hover"
          >
            <ChevronLeft className="size-5" />
          </button>
        </div>
      ) : null}
      {canRight ? (
        <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-14 items-center justify-end bg-gradient-to-l from-background from-35% to-transparent group-hover/scroll:flex">
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={t("feed.scrollRight")}
            className="pointer-events-auto mr-0.5 flex size-8 items-center justify-center rounded-full border border-border bg-background text-foreground shadow-[0_0_8px_rgba(0,0,0,0.18)] hover:bg-hover"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-transparent text-muted-foreground hover:bg-hover hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
