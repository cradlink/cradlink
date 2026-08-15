import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { FollowRequestRow } from "@/components/notifications/follow-request-row";
import { useAuth } from "@/hooks/use-auth";
import { useFollowRequests } from "@/hooks/use-follows";

export function FollowRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const requests = useFollowRequests(user?.id);

  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
        <div className="flex items-center gap-6 px-2 py-1">
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="text-xl font-bold">{t("follows.title")}</h1>
        </div>
      </div>

      {requests.isLoading ? (
        <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">{t("common.loading")}</p>
      ) : null}

      {!requests.isLoading && (requests.data ?? []).length === 0 ? (
        <div className="px-8 py-16 text-center">
          <h2 className="text-3xl font-bold">{t("follows.emptyTitle")}</h2>
          <p className="mt-2 text-[15px] text-muted-foreground">{t("follows.emptyBody")}</p>
        </div>
      ) : null}

      <div>
        {(requests.data ?? []).map((request) =>
          user ? <FollowRequestRow key={request.id} meId={user.id} request={request} /> : null,
        )}
      </div>
    </div>
  );
}
