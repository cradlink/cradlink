import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/avatar";
import { handleFromName } from "@/lib/format";
import type { User } from "@/lib/types";

export function UserRow({ user }: { user: User }) {
  const handle = handleFromName(user.displayName);
  return (
    <Link to={`/u/${user.id}`} className="flex gap-3 px-4 py-3 hover:bg-hover">
      <Avatar name={user.displayName} src={user.avatarUrl} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold leading-5">{user.displayName}</p>
        <p className="truncate text-[15px] leading-5 text-muted-foreground">@{handle}</p>
        {user.bio ? (
          <p className="mt-1 line-clamp-2 text-[15px] leading-5 text-foreground">{user.bio}</p>
        ) : null}
        {user.location ? (
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{user.location}</p>
        ) : null}
      </div>
    </Link>
  );
}
