import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";

export function SettingsNotificationsPage() {
  const { t } = useTranslation();
  const supported = typeof Notification !== "undefined";
  const [permission, setPermission] = useState(
    () => (supported ? Notification.permission : "denied"),
  );

  async function enable() {
    if (!supported) return;
    const next = await Notification.requestPermission();
    setPermission(next);
  }

  return (
    <div>
      <SettingsHeader title={t("settings.notifications")} backTo="/settings" />
      <div className="px-4 py-4">
        <h2 className="text-[17px] font-bold">{t("settings.alertsTitle")}</h2>
        <p className="mt-2 text-[15px] leading-5 text-muted-foreground">{t("settings.alertsBody")}</p>
        <p className="mt-4 text-[15px]">
          {permission === "granted" ? t("settings.alertsOn") : t("settings.alertsOff")}
        </p>
        {permission !== "granted" ? (
          <Button className="mt-4" onClick={() => void enable()} disabled={!supported}>
            {t("settings.turnOnAlerts")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
