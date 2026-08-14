import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useFollow, useFollowActions } from "@/hooks/use-follows";
import { errorMessage } from "@/lib/errors";
import { handleFromName } from "@/lib/format";
import { isPrivateProfile, type User } from "@/lib/types";

export function FollowButton({
  user,
  size = "sm",
}: {
  user: User;
  size?: "sm" | "default";
}) {
  const { user: me } = useAuth();
  const outgoing = useFollow(me?.id, user.id);
  const incoming = useFollow(user.id, me?.id);
  const { follow, unfollow, accept } = useFollowActions();
  const [confirm, setConfirm] = useState<"cancel" | "unfollow" | null>(null);

  if (!me || me.id === user.id) return null;

  const out = outgoing.data;
  const theyFollow = incoming.data?.status === "accepted";
  const busy = follow.isPending || unfollow.isPending || accept.isPending || outgoing.isLoading;
  const handle = handleFromName(user.displayName);

  async function sendFollow() {
    try {
      const result = await follow.mutateAsync({ actorId: me!.id, targetId: user.id });
      toast.success(result.status === "pending" ? "Request sent." : `You’re following ${user.displayName}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmIncoming() {
    try {
      await accept.mutateAsync({ actorId: me!.id, followerId: user.id });
      toast.success("Confirmed.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (out?.status === "accepted") {
    return (
      <>
        <Button size={size} variant="outline" disabled={busy} onClick={() => setConfirm("unfollow")}>
          Following
        </Button>
        <Dialog open={confirm === "unfollow"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">Unfollow @{handle}?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPrivateProfile(user)
              ? "Their activities will be hidden until they accept you again."
              : "You can follow them again later."}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="ink"
              disabled={busy}
              onClick={async () => {
                try {
                  await unfollow.mutateAsync({ actorId: me.id, targetId: user.id });
                  setConfirm(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Unfollow
            </Button>
          </div>
        </Dialog>
      </>
    );
  }

  if (out?.status === "pending") {
    return (
      <>
        <Button size={size} variant="outline" disabled={busy} onClick={() => setConfirm("cancel")}>
          Requested
        </Button>
        <Dialog open={confirm === "cancel"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">Cancel follow request?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            @{handle} won’t be notified. You can request again later.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              Keep it
            </Button>
            <Button
              variant="ink"
              disabled={busy}
              onClick={async () => {
                try {
                  await unfollow.mutateAsync({ actorId: me.id, targetId: user.id });
                  setConfirm(null);
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
            >
              Cancel request
            </Button>
          </div>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} variant="terracotta" disabled={busy} onClick={() => void sendFollow()}>
        {theyFollow ? "Follow back" : "Follow"}
      </Button>
      {incoming.data?.status === "pending" ? (
        <Button size={size} variant="outline" disabled={busy} onClick={() => void confirmIncoming()}>
          Confirm
        </Button>
      ) : null}
    </div>
  );
}
