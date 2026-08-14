"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ActivityCard } from "@/components/activity/activity-card";
import { ImagePicker } from "@/components/activity/image-picker";
import { TagInput } from "@/components/activity/tag-input";
import { TypeBadge } from "@/components/activity/type-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateActivity } from "@/hooks/use-activities";
import { useAuth } from "@/hooks/use-auth";
import { ACTIVITY_META } from "@/lib/activity-meta";
import { errorMessage } from "@/lib/errors";
import { datetimeLocalToIso } from "@/lib/format";
import { ACTIVITY_TYPES, type Activity, type ActivityType, type LocationType } from "@/lib/types";
import { cn } from "@/lib/utils";

const LOCATIONS: LocationType[] = ["online", "in-person", "hybrid"];

type FormState = {
  title: string;
  type: ActivityType;
  description: string;
  lookingFor: string[];
  tags: string[];
  locationType: LocationType;
  city: string;
  venue: string;
  isFlexible: boolean;
  startAt: string;
  endAt: string;
  capacity: string;
  images: string[];
};

const empty: FormState = {
  title: "",
  type: "other",
  description: "",
  lookingFor: [],
  tags: [],
  locationType: "in-person",
  city: "",
  venue: "",
  isFlexible: false,
  startAt: "",
  endAt: "",
  capacity: "",
  images: [],
};

export function CreateActivityForm() {
  const { user } = useAuth();
  const router = useRouter();
  const create = useCreateActivity();
  const [form, setForm] = useState<FormState>(empty);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo<Activity | null>(() => {
    if (!user) return null;
    const capacity = form.capacity ? Number(form.capacity) : null;
    return {
      id: "preview",
      title: form.title.trim() || "Untitled activity",
      description: form.description,
      type: form.type,
      lookingFor: form.lookingFor,
      tags: form.tags,
      location: {
        type: form.locationType,
        city: form.city || undefined,
        venue: form.venue || undefined,
      },
      startAt: form.isFlexible ? null : datetimeLocalToIso(form.startAt),
      endAt: form.isFlexible ? null : datetimeLocalToIso(form.endAt),
      isFlexible: form.isFlexible,
      capacity: Number.isFinite(capacity) ? capacity : null,
      creatorId: user.id,
      creatorName: user.displayName,
      creatorAvatar: user.avatarUrl,
      memberCount: 1,
      status: "open",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      visibility: "public",
      images: form.images,
      joinPolicy: "auto",
      headcount: { mode: "open" },
    };
  }, [form, user]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    const title = form.title.trim();
    const description = form.description.trim();
    if (title.length < 3) return setError("Give it a title (at least 3 characters).");
    if (description.length < 10) return setError("Add a short description so people know what they’re joining.");
    if (form.lookingFor.length === 0) return setError("Add at least one role or skill you’re looking for.");
    if (form.locationType !== "online" && !form.city.trim()) {
      return setError("Add a city for in-person or hybrid activities.");
    }
    if (!form.isFlexible && !form.startAt) return setError("Pick a start time, or mark it as flexible.");
    const capacity = form.capacity ? Number(form.capacity) : null;
    if (form.capacity && (!Number.isFinite(capacity) || (capacity ?? 0) < 1)) {
      return setError("Capacity must be a positive number, or leave it blank.");
    }

    setError(null);
    try {
      const activity = await create.mutateAsync({
        creator: user,
        input: {
          title,
          description,
          type: form.type,
          lookingFor: form.lookingFor,
          tags: form.tags,
          location: {
            type: form.locationType,
            city: form.city.trim() || undefined,
            venue: form.venue.trim() || undefined,
          },
          startAt: form.isFlexible ? null : datetimeLocalToIso(form.startAt),
          endAt: form.isFlexible ? null : datetimeLocalToIso(form.endAt),
          isFlexible: form.isFlexible,
          capacity,
          images: form.images,
        },
      });
      toast.success("Activity posted.");
      router.push(`/activities/${activity.id}`);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-5 px-4 py-4">
        <Field label="Title">
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Sunday pickup football"
          />
        </Field>

        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set("type", type)}
                className={cn(
                  "rounded-full ring-offset-background",
                  form.type === type && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                <TypeBadge type={type} />
              </button>
            ))}
          </div>
        </div>

        <Field label="Description">
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="What happens, who it’s for, what to bring."
          />
        </Field>

        <Field label="Tags" hint="What this is about.">
          <TagInput
            value={form.tags}
            onChange={(next) => set("tags", next)}
            placeholder="Film, Hiking, AI"
          />
        </Field>

        <Field label="Looking for" hint="Press Enter after each role.">
          <TagInput
            value={form.lookingFor}
            onChange={(next) => set("lookingFor", next)}
            placeholder="Designer, beginner climber, +1"
          />
        </Field>

        <div className="space-y-2">
          <Label>Where</Label>
          <div className="flex flex-wrap gap-2">
            {LOCATIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => set("locationType", value)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm capitalize",
                  form.locationType === value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-transparent text-muted-foreground hover:bg-hover",
                )}
              >
                {value.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {form.locationType !== "online" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="City">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Belgrade" />
            </Field>
            <Field label="Venue (optional)">
              <Input value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Ada Ciganlija" />
            </Field>
          </div>
        ) : (
          <Field label="Link or note (optional)">
            <Input
              value={form.venue}
              onChange={(e) => set("venue", e.target.value)}
              placeholder="Meet link goes out the day before"
            />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isFlexible}
            onChange={(e) => set("isFlexible", e.target.checked)}
            className="size-4 accent-primary"
          />
          Dates are flexible
        </label>

        {!form.isFlexible ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Starts">
              <Input type="datetime-local" value={form.startAt} onChange={(e) => set("startAt", e.target.value)} />
            </Field>
            <Field label="Ends (optional)">
              <Input type="datetime-local" value={form.endAt} onChange={(e) => set("endAt", e.target.value)} />
            </Field>
          </div>
        ) : null}

        <Field label="Photos" hint="Optional. Up to 6. Empty uses the type default.">
          <ImagePicker value={form.images} onChange={(next) => set("images", next)} />
        </Field>

        <Field label="Capacity" hint="Leave blank for no limit.">
          <Input
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => set("capacity", e.target.value)}
            placeholder="12"
          />
        </Field>

        {error ? <p className="text-sm text-[#f4212e]">{error}</p> : null}

        <Button type="submit" variant="terracotta" size="lg" disabled={create.isPending}>
          {create.isPending ? "Posting…" : "Post activity"}
        </Button>
      </form>

      <div className="border-t border-border">
        <p className="px-4 pt-3 text-[13px] text-muted-foreground">
          Preview · {ACTIVITY_META[form.type].label}
        </p>
        {preview ? <ActivityCard activity={preview} showJoin={false} /> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label>{label}</Label>
        {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
