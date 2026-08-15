import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { appError, errorMessage } from "@/lib/errors";
import { defaultCoverKey, localDefaultSrc, presetsForType, resolveCoverSrc } from "@/lib/default-covers";
import type { ActivityType } from "@/lib/types";
import { cn, createId } from "@/lib/utils";
import { toast } from "sonner";

const MAX_IMAGES = 6;

export type DraftImage = {
  id: string;
  src: string;
  file?: File;
  key?: string;
};

function assertImage(file: File) {
  if (file.type && !file.type.startsWith("image/") && file.type !== "application/octet-stream") {
    throw appError("errors.chooseImages");
  }
}

export function imagesFromFiles(files: File[]): DraftImage[] {
  return files.map((file) => ({
    id: createId("img"),
    src: URL.createObjectURL(file),
    file,
  }));
}

export function imagesFromUrls(urls: string[]): DraftImage[] {
  return urls.map((src) => {
    const key = defaultCoverKey(src) ?? undefined;
    return {
      id: createId("img"),
      src: key ? localDefaultSrc(key) : resolveCoverSrc(src),
      key,
    };
  });
}

export function revokeDraftImage(image: DraftImage) {
  if (image.file) URL.revokeObjectURL(image.src);
}

export function ImagePicker({
  value,
  onChange,
  type,
}: {
  value: DraftImage[];
  onChange: (next: DraftImage[]) => void;
  type: ActivityType;
}) {
  const { t } = useTranslation();
  const presets = presetsForType(type);

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      const extras = Array.from(files);
      extras.forEach(assertImage);
      onChange([...value, ...imagesFromFiles(extras)].slice(0, MAX_IMAGES));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  function togglePreset(key: string) {
    if (value.some((image) => image.key === key)) {
      onChange(value.filter((image) => image.key !== key));
      return;
    }
    if (value.length >= MAX_IMAGES) return;
    onChange([
      ...value,
      { id: createId("img"), src: localDefaultSrc(key), key },
    ]);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((key) => {
          const active = value.some((image) => image.key === key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => togglePreset(key)}
              className={cn(
                "h-16 w-24 overflow-hidden rounded-xl border",
                active ? "border-primary ring-2 ring-primary/40" : "border-border",
              )}
              aria-pressed={active}
            >
              <img src={localDefaultSrc(key)} alt="" className="h-full w-full object-cover" />
            </button>
          );
        })}
      </div>
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((image) => (
            <div
              key={image.id}
              className="relative h-20 w-28 overflow-hidden rounded-xl border border-border bg-muted"
            >
              <img src={image.src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  revokeDraftImage(image);
                  onChange(value.filter((item) => item.id !== image.id));
                }}
                className="absolute right-1 top-1 rounded-full bg-black/80 p-0.5 text-white"
                aria-label={t("activity.form.removeImage")}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("activity.form.photosEmpty")}</p>
      )}
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={value.length >= MAX_IMAGES}
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
        className="block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
      />
    </div>
  );
}
