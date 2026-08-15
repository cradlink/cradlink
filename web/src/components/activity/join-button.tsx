import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-activity";
import { useJoinLeave } from "@/hooks/use-membership";
import { errorMessage } from "@/lib/errors";
import { isActivityFull } from "@/lib/headcount";
import type { Activity } from "@/lib/types";

export function JoinButton({
  activity,
  size = "default",
}: {
  activity: Activity;
  size?: "default" | "sm" | "lg";
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: membership } = useMembership(activity.id, user?.id);
  const { join, leave } = useJoinLeave();
  const [confirm, setConfirm] = useState<"join" | "leave" | null>(null);

  const isOrganizer = user?.id === activity.creatorId;
  const isMember = membership?.status === "joined";
  const isPending = membership?.status === "pending";
  const isFull = isActivityFull(activity);
  const manual = activity.joinPolicy === "manual";
  const busy = join.isPending || leave.isPending;

  if (isOrganizer) {
    return (
      <Button size={size} variant="outline" disabled>
        {t("activity.organizer")}
      </Button>
    );
  }

  if (isPending) {
    return (
      <>
        <Button size={size} variant="outline" onClick={() => setConfirm("leave")}>
          {t("activity.requested")}
        </Button>
        <Dialog open={confirm === "leave"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">{t("activity.withdrawTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("activity.withdrawBody")}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t("follows.keepIt")}
            </Button>
            <Button
              variant="ink"
              disabled={busy}
              onClick={async () => {
                if (!user) return;
                try {
                  await leave.mutateAsync({ activityId: activity.id, userId: user.id });
                  toast.success(t("activity.requestWithdrawn"));
                  setConfirm(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              {t("activity.withdraw")}
            </Button>
          </div>
        </Dialog>
      </>
    );
  }

  if (isMember) {
    return (
      <>
        <Button size={size} variant="outline" onClick={() => setConfirm("leave")}>
          {t("activity.leave")}
        </Button>
        <Dialog open={confirm === "leave"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">{t("activity.leaveTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("activity.leaveBody")}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t("activity.stay")}
            </Button>
            <Button
              variant="ink"
              disabled={busy}
              onClick={async () => {
                if (!user) return;
                try {
                  await leave.mutateAsync({ activityId: activity.id, userId: user.id });
                  toast.success(t("activity.left"));
                  setConfirm(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              {t("activity.leave")}
            </Button>
          </div>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant="terracotta"
        disabled={isFull || busy}
        onClick={() => setConfirm("join")}
      >
        {isFull ? t("common.full") : manual ? t("activity.requestToJoin") : t("activity.join")}
      </Button>
      <Dialog open={confirm === "join"} onOpenChange={(open) => !open && setConfirm(null)}>
        <h2 className="text-xl font-bold">
          {manual
            ? t("activity.requestTitle", { title: activity.title })
            : t("activity.joinTitle", { title: activity.title })}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {manual ? t("activity.requestBody") : t("activity.joinBody")}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="terracotta"
            disabled={busy}
            onClick={async () => {
              if (!user) return;
              try {
                await join.mutateAsync({ activityId: activity.id, userId: user.id });
                toast.success(manual ? t("activity.requestSent") : t("activity.youreIn"));
                setConfirm(null);
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            {manual ? t("activity.sendRequest") : t("activity.confirmJoin")}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
