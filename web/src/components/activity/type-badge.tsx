import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY_META, activityTypeLabel } from "@/lib/activity-meta";
import type { ActivityType } from "@/lib/types";

export function TypeBadge({ type }: { type: ActivityType }) {
  useTranslation();
  const meta = ACTIVITY_META[type];
  return <Badge className={meta.className}>{activityTypeLabel(type)}</Badge>;
}
