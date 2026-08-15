import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";

export function SettingsHeader({
  title,
  backTo,
}: {
  title: string;
  backTo?: string;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div className="sticky top-0 z-20 border-b border-border bg-background/65 backdrop-blur-md">
      <div className="flex items-center gap-6 px-2 py-1">
        {backTo ? (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}
        <h1 className="truncate text-xl font-bold">{title}</h1>
      </div>
    </div>
  );
}
