import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { StorageRepo } from "@/lib/data/types";
import { appError } from "@/lib/errors";
import { getFirebaseStorage } from "@/lib/firebase";
import { createId } from "@/lib/utils";

const MAX_BYTES = 1.5 * 1024 * 1024;

function assertImage(file: File, label: string) {
  if (!file.type.startsWith("image/")) throw appError("errors.chooseImage");
  if (file.size > MAX_BYTES) throw appError("errors.imageTooLarge", { label });
}

async function uploadImage(path: string, file: File) {
  try {
    const storageRef = ref(getFirebaseStorage(), path);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return await getDownloadURL(storageRef);
  } catch (err) {
    const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
    if (code.includes("unauthorized") || code.includes("permission")) {
      throw appError("errors.uploadFailedRules");
    }
    throw appError("errors.uploadFailedSmaller");
  }
}

export const firebaseStorageRepo: StorageRepo = {
  async uploadAvatar(userId, file) {
    assertImage(file, "avatars");
    const ext = file.name.split(".").pop() || "jpg";
    return uploadImage(`avatars/${userId}/avatar.${ext}`, file);
  },

  async uploadBanner(userId, file) {
    assertImage(file, "banners");
    const ext = file.name.split(".").pop() || "jpg";
    return uploadImage(`banners/${userId}/banner.${ext}`, file);
  },

  async uploadActivityImage(userId, file) {
    assertImage(file, "each photo");
    const ext = file.name.split(".").pop() || "jpg";
    return uploadImage(`activities/${userId}/${createId("img")}.${ext}`, file);
  },
};
