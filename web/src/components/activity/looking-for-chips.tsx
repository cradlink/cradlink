import { cn } from "@/lib/utils";

export function LookingForChips({
  items,
  limit = 4,
  className,
}: {
  items: string[];
  limit?: number;
  className?: string;
}) {
  const visible = items.slice(0, limit);
  const extra = items.length - visible.length;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {visible.map((item) => (
        <span
          key={item}
          className="rounded-full bg-[#1d9bf01a] px-2.5 py-0.5 text-xs text-primary"
        >
          {item}
        </span>
      ))}
      {extra > 0 ? (
        <span className="rounded-full bg-[#1d9bf01a] px-2.5 py-0.5 text-xs text-muted-foreground">
          +{extra}
        </span>
      ) : null}
    </div>
  );
}
