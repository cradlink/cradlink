import { Link } from "react-router-dom";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link to="/" className={cn("inline-flex items-center gap-2", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
          <circle cx="8" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="16" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
          <path d="M11 12h2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className={cn("text-xl font-bold tracking-tight text-foreground", wordmarkClassName)}>
        {APP_NAME}
      </span>
    </Link>
  );
}
