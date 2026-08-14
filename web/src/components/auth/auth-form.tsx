import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { getBackendName } from "@/lib/config";
import { DEMO_ACCOUNT_EMAIL, DEMO_ACCOUNT_PASSWORD } from "@/lib/data/seed";
import { errorMessage } from "@/lib/errors";
import { ensureNameFilter, nameFilterReason } from "@/lib/name-filter";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { t } = useTranslation();
  const { user, ready, signIn, signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const next = search.get("next") || "/";
  const [displayName, setDisplayName] = useState("");
  const local = getBackendName() === "local";
  const [email, setEmail] = useState(local ? DEMO_ACCOUNT_EMAIL : "");
  const [password, setPassword] = useState(local ? DEMO_ACCOUNT_PASSWORD : "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = () => navigate(next.startsWith("/") ? next : "/", { replace: true });

  useEffect(() => {
    if (ready && user) go();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only bounce once auth is known
  }, [ready, user]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (mode === "signup") {
        await ensureNameFilter();
        const nameIssue = nameFilterReason(displayName);
        if (nameIssue === "tooShort") throw new Error(t("errors.addName"));
        if (nameIssue === "reserved") throw new Error(t("errors.nameReserved"));
        if (nameIssue === "blocked") throw new Error(t("errors.nameBlocked"));
      }
      const signedIn =
        mode === "signup"
          ? await signUp({ email, password, displayName })
          : await signIn({ email, password });
      if (signedIn.emailVerified === false) {
        navigate("/verify-email", { replace: true });
        return;
      }
      go();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  async function onGoogle() {
    setPending(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (local) {
        toast.message(t("auth.signedInDemo"));
      }
      go();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
      <Logo />
      <h1 className="mt-6 font-display text-3xl leading-tight">
        {mode === "login" ? t("auth.welcomeBack") : t("auth.comeIn")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{t("app.tagline")}</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === "signup" ? (
          <div className="space-y-1.5">
            <Label htmlFor="name">{t("auth.name")}</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("auth.namePlaceholder")}
              required
            />
          </div>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="email">{t("auth.email")}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
          />
        </div>
        {error ? <p className="text-sm text-[#f4212e]">{error}</p> : null}
        <Button type="submit" className="w-full" variant="ink" disabled={pending}>
          {pending ? t("common.working") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        {t("common.or")}
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onGoogle} disabled={pending}>
        {local ? null : <GoogleMark />}
        {local ? t("auth.continueDemo") : t("auth.continueGoogle")}
      </Button>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? (
          <>
            {t("auth.newHere")}{" "}
            <Link to="/signup" className="text-foreground underline">
              {t("auth.createAccount")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.alreadyHaveOne")}{" "}
            <Link to="/login" className="text-foreground underline">
              {t("auth.signIn")}
            </Link>
          </>
        )}
      </p>

      {getBackendName() === "local" ? (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("auth.demoPrefill", { account: "marko@cradlink.com / demo1234" })}
        </p>
      ) : null}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.3 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.4-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.3 0 10.1 0 12s.5 3.7 1.4 5.5l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.7 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}
