import { useTranslation } from "react-i18next";
import { SettingsHeader } from "@/components/settings/settings-header";
import { SettingsRow } from "@/components/settings/settings-row";

export function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div>
      <SettingsHeader title={t("settings.title")} />
      <div className="divide-y divide-border">
        <SettingsRow
          to="/settings/account"
          title={t("settings.account")}
          description={t("settings.accountHint")}
        />
        <SettingsRow
          to="/settings/display"
          title={t("settings.display")}
          description={t("settings.displayHint")}
        />
        <SettingsRow
          to="/settings/language"
          title={t("settings.language")}
          description={t("settings.languageHint")}
        />
        <SettingsRow
          to="/settings/notifications"
          title={t("settings.notifications")}
          description={t("settings.notificationsHint")}
        />
      </div>
    </div>
  );
}
