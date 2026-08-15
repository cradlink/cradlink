import { useTranslation } from "react-i18next";
import { SettingsChoice } from "@/components/settings/settings-row";
import { SettingsHeader } from "@/components/settings/settings-header";
import { useTheme } from "@/hooks/use-theme";

export function SettingsDisplayPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <SettingsHeader title={t("settings.display")} backTo="/settings" />
      <p className="px-4 pb-2 pt-4 text-[13px] font-bold uppercase tracking-wide text-muted-foreground">
        {t("settings.background")}
      </p>
      <SettingsChoice
        title={t("settings.light")}
        description={t("settings.lightHint")}
        selected={theme === "light"}
        onSelect={() => setTheme("light")}
      />
      <SettingsChoice
        title={t("settings.dark")}
        description={t("settings.darkHint")}
        selected={theme === "dark"}
        onSelect={() => setTheme("dark")}
      />
    </div>
  );
}
