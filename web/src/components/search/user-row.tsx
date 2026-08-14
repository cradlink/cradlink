import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { FollowButton } from "@/components/profile/follow-button";
import { Avatar } from "@/components/ui/avatar";
import { handleFromName } from "@/lib/format";
import { isPrivateProfile, type User } from "@/lib/types";

export function UserRow({ user, followsYou }: { user: User; followsYou?: boolean }) {
  const { t } = useTranslation();
  const handle = handleFromName(user.displayName);
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-hover">
      <Link to={`/u/${user.id}`} className="shrink-0">
        <Avatar name={user.displayName} src={user.avatarUrl} />
      </Link>
      <Link to={`/u/${user.id}`} className="min-w-0 flex-1">
        <p className="inline-flex max-w-full items-center gap-1 truncate text-[15px] font-bold leading-5">
          <span className="truncate">{user.displayName}</span>
          {isPrivateProfile(user) ? <Lock className="size-3.5 shrink-0 text-muted-foreground" /> : null}
        </p>
        <p className="flex flex-wrap items-center gap-1.5 text-[15px] leading-5 text-muted-foreground">
          <span className="truncate">@{handle}</span>
          {followsYou ? (
            <span className="rounded-sm bg-muted px-1 py-px text-[11px] font-medium leading-4">
              {t("connections.followsYou")}
            </span>
          ) : null}
        </p>
        {user.bio ? (
          <p className="mt-1 line-clamp-2 text-[15px] leading-5 text-foreground">{user.bio}</p>
        ) : null}
        {user.location ? (
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{user.location}</p>
        ) : null}
      </Link>
      <div className="shrink-0 pt-0.5">
        <FollowButton user={user} />
      </div>
    </div>
  );
}
