"use client";

import { useState } from "react";
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
        Organizer
      </Button>
    );
  }

  if (isPending) {
    return (
      <>
        <Button size={size} variant="outline" onClick={() => setConfirm("leave")}>
          Requested
        </Button>
        <Dialog open={confirm === "leave"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">Withdraw request?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            The organizer won’t see this request anymore.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant="ink"
              disabled={busy}
              onClick={async () => {
                if (!user) return;
                try {
                  await leave.mutateAsync({ activityId: activity.id, userId: user.id });
                  toast.success("Request withdrawn.");
                  setConfirm(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Withdraw
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
          Leave
        </Button>
        <Dialog open={confirm === "leave"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">Leave this activity?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You can join again later if there is still a spot.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Stay
            </Button>
            <Button
              variant="ink"
              disabled={busy}
              onClick={async () => {
                if (!user) return;
                try {
                  await leave.mutateAsync({ activityId: activity.id, userId: user.id });
                  toast.success("You’ve left.");
                  setConfirm(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Leave
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
        {isFull ? "Full" : manual ? "Request to join" : "Join"}
      </Button>
      <Dialog open={confirm === "join"} onOpenChange={(open) => !open && setConfirm(null)}>
        <h2 className="text-xl font-bold">
          {manual ? `Request to join ${activity.title}?` : `Join ${activity.title}?`}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {manual
            ? "The organizer will accept or decline. You’ll see Requested until they do."
            : "You’ll show up on the member list. The organizer can see your name."}
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirm(null)}>
            Cancel
          </Button>
          <Button
            variant="terracotta"
            disabled={busy}
            onClick={async () => {
              if (!user) return;
              try {
                await join.mutateAsync({ activityId: activity.id, userId: user.id });
                toast.success(manual ? "Request sent." : "You’re in.");
                setConfirm(null);
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            {manual ? "Send request" : "Confirm join"}
          </Button>
        </div>
      </Dialog>
    </>
  );
}
