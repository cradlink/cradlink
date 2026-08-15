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
      className="fixed bottom-6 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground hover:bg-[#1a8cd8]"
    >
      <Plus className="size-5" />
      {t("nav.create")}
    </Link>
  );
}
