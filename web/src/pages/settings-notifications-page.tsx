import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { errorMessage } from "@/lib/errors";

export function SettingsNotificationsPage() {
  const { t } = useTranslation();
  const { user, refresh } = useAuth();
  const update = useUpdateProfile(user?.id);
  const [params, setParams] = useSearchParams();
  const supported = typeof Notification !== "undefined";
  const [permission, setPermission] = useState(
    () => (supported ? Notification.permission : "denied"),
  );
  const emailOn = user?.emailReminders !== false;
  const appliedUnsub = useRef(false);

  useEffect(() => {
    if (appliedUnsub.current || !user || params.get("emailReminders") !== "off") return;
    appliedUnsub.current = true;
    const next = new URLSearchParams(params);
    next.delete("emailReminders");
    setParams(next, { replace: true });
    if (user.emailReminders === false) {
      toast.success(t("settings.emailRemindersOff"));
      return;
    }
    void update
      .mutateAsync({ emailReminders: false })
      .then(async () => {
        await refresh();
        toast.success(t("settings.emailRemindersOff"));
      })
      .catch((err) => toast.error(errorMessage(err)));
  }, [params, refresh, setParams, t, update, user]);

  async function enable() {
    if (!supported) return;
    const next = await Notification.requestPermission();
    setPermission(next);
  }

  async function setEmailReminders(next: boolean) {
    if (!user) return;
    try {
      await update.mutateAsync({ emailReminders: next });
      await refresh();
      toast.success(next ? t("settings.emailRemindersOn") : t("settings.emailRemindersOff"));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div>
      <SettingsHeader title={t("settings.notifications")} backTo="/settings" />
      <div className="space-y-8 px-4 py-4">
        <section>
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
        </section>
        <section>
          <h2 className="text-[17px] font-bold">{t("settings.emailRemindersTitle")}</h2>
          <p className="mt-2 text-[15px] leading-5 text-muted-foreground">
            {t("settings.emailRemindersBody")}
          </p>
          <p className="mt-4 text-[15px]">
            {emailOn ? t("settings.emailRemindersOn") : t("settings.emailRemindersOff")}
          </p>
          <Button
            className="mt-4"
            variant={emailOn ? "outline" : "default"}
            disabled={update.isPending || !user}
            onClick={() => void setEmailReminders(!emailOn)}
          >
            {emailOn ? t("settings.emailRemindersDisable") : t("settings.emailRemindersEnable")}
          </Button>
        </section>
      </div>
    </div>
  );
}
