import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useAuth } from "@/hooks/use-auth";
import { userHandle } from "@/lib/username";

export function SettingsAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  if (!user) return null;
  const handle = userHandle(user);

  return (
    <div>
      <SettingsHeader title={t("settings.account")} backTo="/settings" />
      <div className="divide-y divide-border">
        <div className="px-4 py-4">
          <p className="text-[13px] text-muted-foreground">{t("settings.accountInfo")}</p>
          <p className="mt-2 text-[15px] font-bold">{user.displayName}</p>
          <p className="text-[15px] text-muted-foreground">@{handle}</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[13px] text-muted-foreground">{t("settings.email")}</p>
          <p className="mt-1 text-[15px]">{user.email}</p>
        </div>
        <Link to="/profile/edit" className="flex items-center gap-3 px-4 py-4 hover:bg-hover">
          <span className="min-w-0 flex-1 text-[15px]">{t("settings.editProfile")}</span>
          <ChevronRight className="size-5 text-muted-foreground" />
        </Link>
        <Link to="/settings/deactivate" className="flex items-center gap-3 px-4 py-4 hover:bg-hover">
          <span className="min-w-0 flex-1">
            <span className="block text-[15px]">{t("settings.deactivate")}</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">{t("settings.deactivateHint")}</span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-hover"
          onClick={async () => {
            await signOut();
            navigate("/login");
          }}
        >
          <span className="text-[15px]">{t("nav.signOut")}</span>
        </button>
      </div>
    </div>
  );
}
