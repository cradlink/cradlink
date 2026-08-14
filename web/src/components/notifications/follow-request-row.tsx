import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowActions } from "@/hooks/use-follows";
import { errorMessage } from "@/lib/errors";
import { formatCompactTime } from "@/lib/format";
import type { FollowWithUser, User } from "@/lib/types";

export function FollowRequestActions({
  meId,
  follower,
}: {
  meId: string;
  follower: User;
}) {
  const { t } = useTranslation();
  const { accept, decline } = useFollowActions();
  const busy = accept.isPending || decline.isPending;

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Button
        size="sm"
        disabled={busy}
        onClick={async () => {
          try {
            await accept.mutateAsync({ actorId: meId, followerId: follower.id });
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      >
        {t("follows.confirm")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={async () => {
          try {
            await decline.mutateAsync({ actorId: meId, followerId: follower.id });
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      >
        {t("follows.delete")}
      </Button>
    </div>
  );
}

export function FollowRequestRow({
  meId,
  request,
}: {
  meId: string;
  request: FollowWithUser;
}) {
  const { t } = useTranslation();
  const follower = request.user;
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Link to={`/u/${follower.id}`} className="shrink-0">
        <Avatar name={follower.displayName} src={follower.avatarUrl} />
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/u/${follower.id}`} className="block">
          <p className="truncate text-[15px] font-bold leading-5 hover:underline">{follower.displayName}</p>
          <p className="text-[13px] text-muted-foreground">
            {t("follows.requestedToFollow", { time: formatCompactTime(request.createdAt) })}
          </p>
        </Link>
      </div>
      <FollowRequestActions meId={meId} follower={follower} />
    </div>
  );
}
