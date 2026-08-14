import { useTranslation } from "react-i18next";
import { ProfileForm } from "@/components/profile/profile-form";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

export function EditProfilePage() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  if (!ready) return <Skeleton className="h-40 w-full" />;
  if (!user) return null;
  return (
    <div>
      <div className="sticky top-0 z-20 border-b border-border bg-background/65 px-4 py-3 backdrop-blur-md">
        <h1 className="text-xl font-bold">{t("profile.edit")}</h1>
      </div>
      <div className="px-4 py-4">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
