import Link from "next/link";
import { LookingForChips } from "@/components/activity/looking-for-chips";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";

export function ProfileView({
  user,
  isSelf,
}: {
  user: User;
  isSelf?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar name={user.displayName} src={user.avatarUrl} size="lg" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">
            {user.location || "Somewhere"} · {user.email}
          </p>
        </div>
        {isSelf ? (
          <Button asChild variant="outline">
            <Link href="/profile/edit">Edit profile</Link>
          </Button>
        ) : null}
      </div>
      <p className="max-w-2xl text-base leading-relaxed text-foreground">
        {user.bio || "No bio yet."}
      </p>
      {user.skills.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skills
          </p>
          <LookingForChips items={user.skills} limit={12} />
        </div>
      ) : null}
    </div>
  );
}
