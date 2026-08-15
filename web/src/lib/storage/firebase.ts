import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { StorageRepo } from "@/lib/data/types";
import { isDefaultCoverKey } from "@/lib/default-covers";
import { AppError, appError } from "@/lib/errors";
import { getFirebaseStorage } from "@/lib/firebase";
import { prepareImageFile } from "@/lib/image-file";
import { createId } from "@/lib/utils";

async function uploadImage(path: string, file: File) {
  try {
    const jpeg = await prepareImageFile(file);
    const bytes = new Uint8Array(await jpeg.arrayBuffer());
    const storageRef = ref(getFirebaseStorage(), path);
    await uploadBytes(storageRef, bytes, { contentType: "image/jpeg" });
    return await getDownloadURL(storageRef);
  } catch (err) {
    if (err instanceof AppError) throw err;
    const code = typeof err === "object" && err && "code" in err ? String(err.code) : "";
    if (code.includes("unauthorized") || code.includes("permission")) {
      throw appError("errors.uploadFailedRules");
    }
    throw appError("errors.uploadFailedSmaller");
  }
}

export async function ensureSharedDefault(key: string) {
  if (!isDefaultCoverKey(key)) return;
  const storageRef = ref(
    getFirebaseStorage(),
    `default-activities/${key}.jpg`,
  );
  try {
    await getDownloadURL(storageRef);
  } catch {
    /* shared objects are uploaded once; never write a per-user copy */
  }
}

export const firebaseStorageRepo: StorageRepo = {
  async uploadAvatar(userId, file) {
    return uploadImage(`avatars/${userId}/avatar.jpg`, file);
  },

  async uploadBanner(userId, file) {
    return uploadImage(`banners/${userId}/banner.jpg`, file);
  },

  async uploadActivityImage(userId, file) {
    return uploadImage(`activities/${userId}/${createId("img")}.jpg`, file);
  },
};
