import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { appError, errorMessage } from "@/lib/errors";
import { createId } from "@/lib/utils";
import { toast } from "sonner";

const MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGES = 6;

export type DraftImage = {
  id: string;
  src: string;
  file?: File;
};

function assertImage(file: File) {
  if (!file.type.startsWith("image/")) throw appError("errors.chooseImages");
  if (file.size > MAX_BYTES) throw appError("errors.eachImageTooLarge");
}

export function imagesFromFiles(files: File[]): DraftImage[] {
  return files.map((file) => ({
    id: createId("img"),
    src: URL.createObjectURL(file),
    file,
  }));
}

export function imagesFromUrls(urls: string[]): DraftImage[] {
  return urls.map((src) => ({ id: createId("img"), src }));
}

export function revokeDraftImage(image: DraftImage) {
  if (image.file) URL.revokeObjectURL(image.src);
}

export function ImagePicker({
  value,
  onChange,
}: {
  value: DraftImage[];
  onChange: (next: DraftImage[]) => void;
}) {
  const { t } = useTranslation();
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

  return (
    <div className="space-y-2">
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
        <p className="text-xs text-muted-foreground">
          {t("activity.form.photosEmpty")}
        </p>
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
