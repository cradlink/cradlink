import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { UserRow } from "@/components/search/user-row";
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useFollowers, useFollowing } from "@/hooks/use-follows";
import { useUser } from "@/hooks/use-profile";
import { connectionsPath, profilePath, type ConnectionsTab } from "@/lib/connections";
import { handleFromName } from "@/lib/format";

export function ConnectionsPage({ tab }: { tab: ConnectionsTab }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user: me } = useAuth();
  const id = userId ?? me?.id;
  const isSelf = Boolean(me && id === me.id);
  const profile = useUser(id);
  const user = profile.data;
  const followers = useFollowers(id);
  const following = useFollowing(id);
  const myFollowers = useFollowers(me?.id);
  const list = tab === "followers" ? followers : following;
  const people = list.data ?? [];
  const followsYou = new Set(
    (myFollowers.data ?? []).filter((row) => row.status === "accepted").map((row) => row.followerId),
  );
  const handle = user ? handleFromName(user.displayName) : "";

  function setTab(value: string) {
    if (!id || (value !== "followers" && value !== "following")) return;
    navigate(connectionsPath(id, value, isSelf), { replace: true });
  }

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
        <div className="flex items-center gap-6 px-2 py-1">
          <button
            type="button"
            onClick={() => navigate(id ? profilePath(id, isSelf) : "/")}
            className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="size-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold leading-6">
              {user?.displayName ?? t("nav.profile")}
            </h1>
            {handle ? <p className="text-[13px] text-muted-foreground">@{handle}</p> : null}
          </div>
        </div>
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { value: "followers", label: t("connections.followers") },
            { value: "following", label: t("connections.following") },
          ]}
        />
      </div>

      {list.isLoading || profile.isLoading ? (
        <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">{t("common.loading")}</p>
      ) : null}

      {list.isError ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">{t("connections.loadError")}</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">{t("common.refreshTryAgain")}</p>
        </div>
      ) : null}

      {!list.isLoading && !list.isError && people.length === 0 ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">
            {tab === "followers" ? t("connections.emptyFollowersTitle") : t("connections.emptyFollowingTitle")}
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {tab === "followers"
              ? isSelf
                ? t("connections.emptyFollowersBodySelf")
                : t("connections.emptyFollowersBodyOther", { name: user?.displayName ?? "" })
              : isSelf
                ? t("connections.emptyFollowingBodySelf")
                : t("connections.emptyFollowingBodyOther", { name: user?.displayName ?? "" })}
          </p>
        </div>
      ) : null}

      <div>
        {people.map((row) => (
          <UserRow
            key={row.id}
            user={row.user}
            followsYou={Boolean(me && row.user.id !== me.id && followsYou.has(row.user.id))}
          />
        ))}
      </div>
    </div>
  );
}
