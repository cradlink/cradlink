import { Badge } from "@/components/ui/badge";
import { ACTIVITY_META } from "@/lib/activity-meta";
import type { ActivityType } from "@/lib/types";

export function TypeBadge({ type }: { type: ActivityType }) {
  const meta = ACTIVITY_META[type];
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
