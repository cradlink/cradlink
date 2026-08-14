import { AppError } from "@/lib/errors";
import type { StorageRepo } from "@/lib/data/types";

const MAX_BYTES = 1.5 * 1024 * 1024;

function readAsDataUrl(file: File, label: string) {
  if (!file.type.startsWith("image/")) throw new AppError("Please choose an image file.");
  if (file.size > MAX_BYTES) throw new AppError(`Keep ${label} under 1.5 MB.`);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new AppError("Could not read that image."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export const localStorageRepo: StorageRepo = {
  uploadAvatar(_userId, file) {
    return readAsDataUrl(file, "avatars");
  },
  uploadActivityImage(_userId, file) {
    return readAsDataUrl(file, "each photo");
  },
};
