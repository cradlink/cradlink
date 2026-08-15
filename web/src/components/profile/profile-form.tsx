import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { TagInput } from "@/components/activity/tag-input";
import {
  PhotoAction,
  ProfileAvatarFrame,
  ProfileBanner,
  RemovePhotoAction,
} from "@/components/profile/profile-hero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useUploadAvatar, useUploadBanner } from "@/hooks/use-profile";
import { getBackend } from "@/lib/backend";
import { errorMessage } from "@/lib/errors";
import { ensureNameFilter, nameFilterReason } from "@/lib/name-filter";
import { isPrivateProfile, type User } from "@/lib/types";

export function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const update = useUpdateProfile(user.id);
  const uploadAvatar = useUploadAvatar();
  const uploadBanner = useUploadBanner();
  const avatarInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [skills, setSkills] = useState(user.skills);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [bannerUrl, setBannerUrl] = useState(user.bannerUrl ?? null);
  const [isPrivate, setIsPrivate] = useState(isPrivateProfile(user));
  const [error, setError] = useState<string | null>(null);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function rememberPreview(file: File) {
    const url = URL.createObjectURL(file);
    previewUrls.current.push(url);
    return url;
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    setAvatarUrl(rememberPreview(file));
    try {
      setAvatarUrl(await uploadAvatar.mutateAsync({ userId: user.id, file }));
    } catch (err) {
      setAvatarUrl(user.avatarUrl);
      toast.error(errorMessage(err));
    }
  }

  async function onBanner(file: File | undefined) {
    if (!file) return;
    setBannerUrl(rememberPreview(file));
    try {
      setBannerUrl(await uploadBanner.mutateAsync({ userId: user.id, file }));
    } catch (err) {
      setBannerUrl(user.bannerUrl ?? null);
      toast.error(errorMessage(err));
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    await ensureNameFilter();
    const nameIssue = nameFilterReason(displayName);
    if (nameIssue === "tooShort") {
      setError(t("profile.nameTooShort"));
      return;
    }
    if (nameIssue === "unavailable") {
      setError(t("errors.nameUnavailable"));
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
        bannerUrl,
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

  const busy = update.isPending || uploadAvatar.isPending || uploadBanner.isPending;

  return (
    <form id="edit-profile" onSubmit={onSubmit}>
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/65 px-2 py-1 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-6">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex size-9 items-center justify-center rounded-full hover:bg-hover"
            aria-label={t("common.back")}
          >
            <ArrowLeft className="size-5" />
          </button>
          <h1 className="truncate text-xl font-bold">{t("profile.edit")}</h1>
        </div>
        <Button type="submit" size="sm" className="mr-2" disabled={busy}>
          {update.isPending ? t("common.saving") : t("common.save")}
        </Button>
      </div>
      <input
        ref={avatarInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void onAvatar(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <input
        ref={bannerInput}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void onBanner(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="relative">
        <ProfileBanner src={bannerUrl}>
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30">
            <PhotoAction
              label={bannerUrl ? t("profile.changeBanner") : t("profile.addBanner")}
              onClick={() => bannerInput.current?.click()}
            />
            {bannerUrl ? (
              <RemovePhotoAction
                label={t("profile.removeBanner")}
                onClick={() => setBannerUrl(null)}
              />
            ) : null}
          </div>
        </ProfileBanner>
        <div className="absolute bottom-0 left-4 translate-y-1/2">
          <ProfileAvatarFrame name={displayName || user.displayName} src={avatarUrl}>
            <span className="absolute inset-0 flex items-center justify-center">
              <PhotoAction label={t("profile.changeAvatar")} onClick={() => avatarInput.current?.click()} />
            </span>
          </ProfileAvatarFrame>
        </div>
      </div>

      <div className="mt-[68px] space-y-5 px-4 pb-6">
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
      </div>
    </form>
  );
}
