import { useTranslation } from "react-i18next";
import { SettingsChoice } from "@/components/settings/settings-row";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile } from "@/hooks/use-profile";
import { LOCALES, resolveLocale } from "@/i18n";

export function SettingsLanguagePage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const update = useUpdateProfile(user?.id);
  const current = resolveLocale(i18n.language);

  async function choose(code: string) {
    await i18n.changeLanguage(code);
    if (user) await update.mutateAsync({ locale: code });
  }

  return (
    <div>
      <SettingsHeader title={t("settings.language")} backTo="/settings" />
      <p className="px-4 pb-2 pt-4 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
        {t("settings.displayLanguage")}
      </p>
      <p className="px-4 pb-3 text-[13px] leading-4 text-muted-foreground">{t("settings.languagePageHint")}</p>
      {LOCALES.map((locale) => (
        <SettingsChoice
          key={locale.code}
          title={locale.nativeName}
          description={locale.englishName}
          selected={locale.code === current}
          onSelect={() => void choose(locale.code)}
        />
      ))}
    </div>
  );
}
