import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      toast.success(
        result.status === "pending"
          ? t("follows.requestSent")
          : t("follows.nowFollowing", { name: user.displayName }),
      );
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function confirmIncoming() {
    try {
      await accept.mutateAsync({ actorId: me!.id, followerId: user.id });
      toast.success(t("follows.confirmed"));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (out?.status === "accepted") {
    return (
      <>
        <Button size={size} variant="outline" disabled={busy} onClick={() => setConfirm("unfollow")}>
          {t("follows.following")}
        </Button>
        <Dialog open={confirm === "unfollow"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">{t("follows.unfollowTitle", { handle })}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isPrivateProfile(user) ? t("follows.unfollowPrivate") : t("follows.unfollowPublic")}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t("common.cancel")}
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
              {t("follows.unfollow")}
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
          {t("follows.requested")}
        </Button>
        <Dialog open={confirm === "cancel"} onOpenChange={(open) => !open && setConfirm(null)}>
          <h2 className="text-xl font-bold">{t("follows.cancelTitle")}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{t("follows.cancelBody", { handle })}</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirm(null)}>
              {t("follows.keepIt")}
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
              {t("follows.cancelRequest")}
            </Button>
          </div>
        </Dialog>
      </>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size={size} variant="terracotta" disabled={busy} onClick={() => void sendFollow()}>
        {theyFollow ? t("follows.followBack") : t("follows.follow")}
      </Button>
      {incoming.data?.status === "pending" ? (
        <Button size={size} variant="outline" disabled={busy} onClick={() => void confirmIncoming()}>
          {t("follows.confirm")}
        </Button>
      ) : null}
    </div>
  );
}
