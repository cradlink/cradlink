import { appError } from "@/lib/errors";
import type { StorageRepo } from "@/lib/data/types";

const MAX_BYTES = 1.5 * 1024 * 1024;

function readAsDataUrl(file: File, label: string) {
  if (!file.type.startsWith("image/")) throw appError("errors.chooseImage");
  if (file.size > MAX_BYTES) throw appError("errors.imageTooLarge", { label });
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(appError("errors.couldNotReadImage"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

export const localStorageRepo: StorageRepo = {
  uploadAvatar(_userId, file) {
    return readAsDataUrl(file, "avatars");
  },
  uploadBanner(_userId, file) {
    return readAsDataUrl(file, "banners");
  },
  uploadActivityImage(_userId, file) {
    return readAsDataUrl(file, "each photo");
  },
};
