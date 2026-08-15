import { Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function Fab() {
  const { t } = useTranslation();
  const pathname = useLocation().pathname;
  if (pathname.startsWith("/activities/new") || pathname.endsWith("/edit")) return null;

  return (
    <Link
      to="/activities/new"
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_8px_rgba(29,155,240,0.35)] hover:bg-[#1a8cd8] lg:bottom-6 lg:right-5 lg:h-14 lg:w-auto lg:px-5"
      aria-label={t("nav.create")}
    >
      <Plus className="size-6 lg:size-5" />
      <span className="hidden lg:inline">{t("nav.create")}</span>
    </Link>
  );
}
