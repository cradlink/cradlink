import { appError } from "@/lib/errors";
import type { StorageRepo } from "@/lib/data/types";
import { prepareImageFile } from "@/lib/image-file";

async function readAsDataUrl(file: File) {
  const jpeg = await prepareImageFile(file);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(appError("errors.couldNotReadImage"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(jpeg);
  });
}

export const localStorageRepo: StorageRepo = {
  uploadAvatar(_userId, file) {
    return readAsDataUrl(file);
  },
  uploadBanner(_userId, file) {
    return readAsDataUrl(file);
  },
  uploadActivityImage(_userId, file) {
    return readAsDataUrl(file);
  },
};
