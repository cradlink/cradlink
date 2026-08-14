"use client";

import { ACTIVITY_META } from "@/lib/activity-meta";
import { ACTIVITY_TYPES, type ActivityType, type LocationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const LOCATIONS: { value: LocationType | "all"; label: string }[] = [
  { value: "all", label: "Any place" },
  { value: "online", label: "Online" },
  { value: "in-person", label: "In person" },
  { value: "hybrid", label: "Hybrid" },
];

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
  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={type === "all"} onClick={() => onType("all")}>
          All types
        </FilterChip>
        {ACTIVITY_TYPES.map((value) => (
          <FilterChip key={value} active={type === value} onClick={() => onType(value)}>
            <span className={cn("size-1.5 rounded-full", ACTIVITY_META[value].dot)} />
            {ACTIVITY_META[value].label}
          </FilterChip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LOCATIONS.map((item) => (
          <FilterChip
            key={item.value}
            active={locationType === item.value}
            onClick={() => onLocation(item.value)}
          >
            {item.label}
          </FilterChip>
        ))}
      </div>
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
  children: React.ReactNode;
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
