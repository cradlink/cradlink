import { useTranslation } from "react-i18next";
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
      <div className="flex gap-2 overflow-x-auto pb-1">
        <FilterChip active={type === "all"} onClick={() => onType("all")}>
          {t("feed.allTypes")}
        </FilterChip>
        {ACTIVITY_TYPES.map((value) => (
          <FilterChip key={value} active={type === value} onClick={() => onType(value)}>
            <span className={cn("size-1.5 rounded-full", ACTIVITY_META[value].dot)} />
            {activityTypeLabel(value)}
          </FilterChip>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {locations.map((item) => (
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
