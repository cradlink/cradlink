import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { StorageRepo } from "@/lib/data/types";
import { AppError } from "@/lib/errors";
import { getFirebaseStorage } from "@/lib/firebase";

const MAX_BYTES = 1.5 * 1024 * 1024;

export const firebaseStorageRepo: StorageRepo = {
  async uploadAvatar(userId, file) {
    if (!file.type.startsWith("image/")) throw new AppError("Please choose an image file.");
    if (file.size > MAX_BYTES) throw new AppError("Keep avatars under 1.5 MB.");
    const ext = file.name.split(".").pop() || "jpg";
    const storageRef = ref(getFirebaseStorage(), `avatars/${userId}/avatar.${ext}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  },
};
