import { useEffect, useState } from "react";
import { Images } from "lucide-react";
import { rawActivityImages } from "@/lib/activity-meta";
import { coverSrcs } from "@/lib/default-covers";
import type { Activity } from "@/lib/types";
import { cn } from "@/lib/utils";

function CoverImage({
  src,
  type,
  alt,
  className,
}: {
  src: string;
  type?: Activity["type"];
  alt?: string;
  className?: string;
}) {
  const sources = coverSrcs(src, type);
  const list = sources.length ? sources : [src];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [src]);
  const current = list[Math.min(index, list.length - 1)];
  return (
    <img
      src={current}
      alt={alt ?? ""}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setIndex((i) => Math.min(i + 1, list.length - 1))}
    />
  );
}

export function ActivityCover({
  activity,
  className,
}: {
  activity: Pick<Activity, "type" | "images" | "title">;
  className?: string;
}) {
  const images = rawActivityImages(activity);
  return (
    <div className={cn("relative overflow-hidden bg-muted", className)}>
      <CoverImage src={images[0]} type={activity.type} className="h-full w-full object-cover" />
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
  const images = rawActivityImages(activity);
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-2">
      <div className="overflow-hidden rounded-2xl border border-border bg-muted">
        <CoverImage
          src={current}
          type={activity.type}
          alt={activity.title}
          className="aspect-[16/9] w-full object-cover"
        />
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
              <CoverImage src={src} type={activity.type} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
