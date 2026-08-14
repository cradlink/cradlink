import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { TagInput } from "@/components/activity/tag-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/use-profile";
import { getBackend } from "@/lib/backend";
import { errorMessage } from "@/lib/errors";
import { isPrivateProfile, type User } from "@/lib/types";

export function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const update = useUpdateProfile(user.id);
  const upload = useUploadAvatar();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [skills, setSkills] = useState(user.skills);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isPrivate, setIsPrivate] = useState(isPrivateProfile(user));
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    try {
      const url = await upload.mutateAsync({ userId: user.id, file });
      setAvatarUrl(url);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (displayName.trim().length < 2) {
      setError(t("profile.nameTooShort"));
      return;
    }
    setError(null);
    try {
      await update.mutateAsync({
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
        skills,
        avatarUrl,
        profileVisibility: isPrivate ? "private" : "public",
      });
      if (!isPrivate && isPrivateProfile(user)) {
        await getBackend().follows.acceptAllPending(user.id);
      }
      await refresh();
      toast.success(t("profile.saved"));
      navigate("/profile");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={displayName || user.displayName} src={avatarUrl} size="lg" />
        <div>
          <Label htmlFor="avatar">{t("profile.avatar")}</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            className="mt-1"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("profile.name")}</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">{t("profile.location")}</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder={t("profile.locationPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">{t("profile.bio")}</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>{t("profile.skills")}</Label>
        <TagInput value={skills} onChange={setSkills} placeholder={t("profile.skillsPlaceholder")} />
      </div>
      <div className="rounded-2xl border border-border px-4 py-3">
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium">{t("profile.privateAccount")}</span>
            <span className="mt-1 block text-[13px] leading-5 text-muted-foreground">
              {t("profile.privateAccountHint")}
            </span>
          </span>
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(event) => setIsPrivate(event.target.checked)}
            className="mt-1 size-5 accent-primary"
          />
        </label>
      </div>
      {error ? <p className="text-sm text-[#f4212e]">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="terracotta" disabled={update.isPending || upload.isPending}>
          {update.isPending ? t("common.saving") : t("common.save")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => navigate("/profile")}>
          {t("common.cancel")}
        </Button>
      </div>
    </form>
  );
}
