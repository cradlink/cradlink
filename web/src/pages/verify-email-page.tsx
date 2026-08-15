import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/errors";
import { needsEmailVerification } from "@/lib/types";

export function VerifyEmailPage() {
  const { t } = useTranslation();
  const { user, ready, sendVerificationEmail, reloadUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  async function checkVerified() {
    setChecking(true);
    try {
      const next = await reloadUser();
      if (next && next.emailVerified !== false) {
        toast.success(t("auth.emailConfirmed"));
        navigate("/", { replace: true });
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (!needsEmailVerification(user)) return;
    const onFocus = () => {
      void checkVerified();
    };
    window.addEventListener("focus", onFocus);
    const timer = window.setInterval(() => {
      void checkVerified();
    }, 4000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!ready) return <div className="min-h-dvh bg-background" />;
  if (!user) return <Navigate to="/login" replace />;
  if (!needsEmailVerification(user)) return <Navigate to="/" replace />;

  async function resend() {
    setPending(true);
    setSendError(null);
    try {
      await sendVerificationEmail();
      toast.success(t("auth.verificationSent"));
    } catch (err) {
      const message = errorMessage(err);
      setSendError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl leading-tight">{t("auth.verifyTitle")}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <Trans
          i18nKey="auth.verifyBody"
          values={{ email: user.email, sender: "noreply@cradlink.firebaseapp.com" }}
          components={{
            email: <span className="font-medium text-foreground" />,
            sender: <span className="font-medium text-foreground" />,
          }}
        />
      </p>
      {sendError ? <p className="mt-3 text-sm text-[#f4212e]">{sendError}</p> : null}
      <p className="mt-3 text-xs text-muted-foreground">{t("auth.verifySmtpHint")}</p>
      <div className="mt-6 space-y-3">
        <Button className="w-full" variant="ink" disabled={checking} onClick={() => void checkVerified()}>
          {checking ? t("auth.checking") : t("auth.iveConfirmed")}
        </Button>
        <Button className="w-full" variant="outline" disabled={pending} onClick={() => void resend()}>
          {pending ? t("auth.sending") : t("auth.resendEmail")}
        </Button>
        <Button
          className="w-full"
          variant="ghost"
          onClick={async () => {
            await signOut();
            navigate("/login", { replace: true });
          }}
        >
          {t("auth.useDifferentAccount")}
        </Button>
      </div>
    </div>
  );
}
