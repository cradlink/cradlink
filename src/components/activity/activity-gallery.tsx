import { useState } from "react";
import { Images } from "lucide-react";
import { resolveActivityImages } from "@/lib/activity-meta";
import type { Activity } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ActivityCover({
  activity,
  className,
}: {
  activity: Pick<Activity, "type" | "images" | "title">;
  className?: string;
}) {
  const images = resolveActivityImages(activity);
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <img src={images[0]} alt="" className="h-full w-full object-cover" />
      {images.length > 1 ? (
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-0.5 text-[11px] font-medium text-white">
          <Images className="size-3" />
          {images.length}
        </span>
      ) : null}
    </div>
  );
}

export function ActivityGallery({ activity }: { activity: Activity }) {
  const images = resolveActivityImages(activity);
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        <img src={current} alt={activity.title} className="aspect-[16/9] w-full object-cover" />
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={cn(
                "h-16 w-24 shrink-0 overflow-hidden rounded-xl border",
                index === active ? "border-primary ring-2 ring-primary/40" : "border-border",
              )}
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
