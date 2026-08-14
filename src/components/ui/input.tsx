import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
