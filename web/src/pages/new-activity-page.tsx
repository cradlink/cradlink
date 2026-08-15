import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { CreateActivityForm } from "@/components/activity/create-form";

export function NewActivityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <div>
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-border bg-background/65 px-2 py-1 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-hover"
          aria-label={t("common.back")}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="truncate text-xl font-bold">{t("activity.newTitle")}</h1>
      </div>
      <CreateActivityForm />
    </div>
  );
}
