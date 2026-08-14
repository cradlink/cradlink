import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { t } = useTranslation();
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? t("theme.toLight") : t("theme.toDark")}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted"
    >
      {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
