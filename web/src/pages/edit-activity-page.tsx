import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { EditActivityForm } from "@/components/activity/create-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useActivity } from "@/hooks/use-activity";
import { useAuth } from "@/hooks/use-auth";

export function EditActivityPage() {
  const { t } = useTranslation();
  const { id = "" } = useParams<{ id: string }>();
  const { user } = useAuth();
  const activityQuery = useActivity(id);
  const activity = activityQuery.data;

  if (activityQuery.isLoading) {
    return (
      <div className="space-y-4 px-4 py-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="px-8 py-16 text-center">
        <h1 className="text-3xl font-bold">{t("activity.missingTitle")}</h1>
        <Link to="/" className="mt-4 inline-block text-sm underline">
          {t("activity.backToFeed")}
        </Link>
      </div>
    );
  }

  if (!user || user.id !== activity.creatorId) {
    return <Navigate to={`/activities/${activity.id}`} replace />;
  }

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">{t("activity.editTitle")}</h1>
      </div>
      <EditActivityForm activity={activity} />
    </div>
  );
}
