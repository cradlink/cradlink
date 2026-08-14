import { cn } from "@/lib/utils";

export function Tabs({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  items: { value: string; label: string }[];
}) {
  return (
    <div className="flex border-b border-border">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={cn(
            "relative px-5 py-3 text-sm font-medium transition-colors hover:bg-hover",
            value === item.value ? "font-bold text-foreground" : "text-muted-foreground",
          )}
        >
          {item.label}
          {value === item.value ? (
            <span className="absolute inset-x-3 bottom-0 h-1 rounded-full bg-primary" />
          ) : null}
        </button>
      ))}
    </div>
  );
}
