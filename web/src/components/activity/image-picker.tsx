import { X } from "lucide-react";
import { AppError, errorMessage } from "@/lib/errors";
import { toast } from "sonner";

const MAX_BYTES = 1.5 * 1024 * 1024;
const MAX_IMAGES = 6;

function assertImage(file: File) {
  if (!file.type.startsWith("image/")) throw new AppError("Please choose image files.");
  if (file.size > MAX_BYTES) throw new AppError("Keep each image under 1.5 MB.");
}

export function ImagePicker({
  value,
  previews,
  onChange,
}: {
  value: File[];
  previews: string[];
  onChange: (next: File[]) => void;
}) {
  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    try {
      const extras = Array.from(files);
      extras.forEach(assertImage);
      onChange([...value, ...extras].slice(0, MAX_IMAGES));
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {value.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
              className="relative h-20 w-28 overflow-hidden rounded-xl border border-border bg-muted"
            >
              {previews[index] ? (
                <img src={previews[index]} alt="" className="h-full w-full object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 rounded-full bg-black/80 p-0.5 text-white"
                aria-label="Remove image"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          None added — we’ll use the default photo for this type.
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
