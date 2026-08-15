import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsRow({
  to,
  title,
  description,
}: {
  to: string;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="flex items-start gap-3 px-4 py-4 hover:bg-hover">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] leading-5 text-foreground">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-4 text-muted-foreground">{description}</span>
      </span>
      <ChevronRight className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
}

export function SettingsChoice({
  title,
  description,
  selected,
  onSelect,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-hover"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold leading-5">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-[13px] leading-4 text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border",
          selected ? "border-primary bg-primary" : "border-muted-foreground",
        )}
        aria-hidden
      >
        {selected ? <span className="size-2 rounded-full bg-primary-foreground" /> : null}
      </span>
    </button>
  );
}
