"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { TagInput } from "@/components/activity/tag-input";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useUpdateProfile, useUploadAvatar } from "@/hooks/use-profile";
import { errorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";

export function ProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const { refresh } = useAuth();
  const update = useUpdateProfile(user.id);
  const upload = useUploadAvatar();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [skills, setSkills] = useState(user.skills);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
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
      setError("Name needs at least 2 characters.");
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
      });
      await refresh();
      toast.success("Profile saved.");
      router.push("/profile");
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-5">
      <div className="flex items-center gap-4">
        <Avatar name={displayName || user.displayName} src={avatarUrl} size="lg" />
        <div>
          <Label htmlFor="avatar">Avatar</Label>
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
        <Label htmlFor="displayName">Name</Label>
        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Belgrade"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Skills</Label>
        <TagInput value={skills} onChange={setSkills} placeholder="Research, climbing, Figma" />
      </div>
      {error ? <p className="text-sm text-[#f4212e]">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="terracotta" disabled={update.isPending || upload.isPending}>
          {update.isPending ? "Saving…" : "Save"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.push("/profile")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
