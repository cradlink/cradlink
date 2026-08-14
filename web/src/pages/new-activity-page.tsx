import { useTranslation } from "react-i18next";
import { CreateActivityForm } from "@/components/activity/create-form";

export function NewActivityPage() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">{t("activity.newTitle")}</h1>
      </div>
      <CreateActivityForm />
    </div>
  );
}
