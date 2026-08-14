import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { isDeactivated, isDeactivationExpired } from "@/lib/account";
import { errorMessage } from "@/lib/errors";

export function ReactivatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, ready, refresh, signOut } = useAuth();
  const update = useUpdateProfile(user?.id);
  const [busy, setBusy] = useState(false);

  if (!ready) return <div className="min-h-dvh bg-background" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isDeactivated(user)) return <Navigate to="/" replace />;

  const expired = isDeactivationExpired(user);

  async function reactivate() {
    setBusy(true);
    try {
      await update.mutateAsync({ deactivatedAt: null });
      await refresh();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(false);
    }
  }

  async function stayOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
      <Logo />
      {expired ? (
        <>
          <h1 className="mt-6 font-display text-3xl leading-tight">{t("settings.closedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.closedBody")}</p>
          <Button className="mt-6 w-full" variant="ink" onClick={() => void stayOut()}>
            {t("nav.signOut")}
          </Button>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-display text-3xl leading-tight">{t("settings.reactivateTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("settings.reactivateBody")}</p>
          <div className="mt-6 space-y-3">
            <Button className="w-full" disabled={busy} onClick={() => void reactivate()}>
              {busy ? t("settings.reactivateWorking") : t("settings.reactivateConfirm")}
            </Button>
            <Button className="w-full" variant="ghost" disabled={busy} onClick={() => void stayOut()}>
              {t("settings.reactivateStayOut")}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
