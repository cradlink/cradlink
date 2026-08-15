import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { DEACTIVATION_DAYS } from "@/lib/account";
import { errorMessage } from "@/lib/errors";
import { nowIso } from "@/lib/utils";

export function SettingsDeactivatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const update = useUpdateProfile(user?.id);
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  async function deactivate() {
    setBusy(true);
    try {
      await update.mutateAsync({ deactivatedAt: nowIso() });
      await signOut();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div>
      <SettingsHeader title={t("settings.deactivateTitle")} backTo="/settings/account" />
      <div className="space-y-4 px-4 py-5">
        <h2 className="text-2xl font-bold">{t("settings.deactivateLead")}</h2>
        <p className="text-[15px] leading-5 text-muted-foreground">
          {t("settings.deactivateBody", { days: DEACTIVATION_DAYS })}
        </p>
        <Button variant="ink" disabled={busy} onClick={() => void deactivate()}>
          {busy ? t("settings.deactivateWorking") : t("settings.deactivateConfirm")}
        </Button>
      </div>
    </div>
  );
}
