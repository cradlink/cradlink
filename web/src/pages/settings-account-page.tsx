import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useAuth } from "@/hooks/use-auth";
import { handleFromName } from "@/lib/format";

export function SettingsAccountPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  if (!user) return null;
  const handle = handleFromName(user.displayName);

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
      </div>
    </div>
  );
}
