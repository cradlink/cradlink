import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="px-8 py-16 text-center">
      <h1 className="text-3xl font-bold">{t("notFound.title")}</h1>
      <p className="mt-2 text-[15px] text-muted-foreground">{t("notFound.body")}</p>
      <Link to="/" className="mt-4 inline-block text-sm underline">
        {t("activity.backToFeed")}
      </Link>
    </div>
  );
}
