import { Skeleton } from "@/components/ui/skeleton";

export function ActivityCardSkeleton() {
  return (
    <div className="border-b border-border px-4 py-3">
      <div className="flex gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
