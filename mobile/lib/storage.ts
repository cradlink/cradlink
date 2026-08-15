import { EncodingType, readAsStringAsync } from "expo-file-system/legacy"
import { SaveFormat, manipulateAsync } from "expo-image-manipulator"
import { getDownloadURL, ref, uploadString } from "firebase/storage"

import { rasterizeGenerated } from "@/components/ArtRasterHost"
import { AppError } from "@/lib/errors"
import { getFirebaseStorage } from "@/lib/firebase"
import { isGeneratedArt } from "@/lib/generated-art"
import { createId } from "@/lib/utils"

const DATA_LIMIT = 550_000

export function isRemoteImage(uri: string | null | undefined) {
  return Boolean(uri && /^https?:\/\//i.test(uri))
}

export function isEmbeddedImage(uri: string | null | undefined) {
  return Boolean(uri && uri.startsWith("data:image/"))
}

export function isLocalImage(uri: string | null | undefined) {
  if (!uri || isRemoteImage(uri) || isEmbeddedImage(uri)) return false
  return (
    uri.startsWith("file:") ||
    uri.startsWith("content:") ||
    uri.startsWith("ph:") ||
    uri.startsWith("blob:") ||
    uri.startsWith("/")
  )
}

async function shrink(uri: string, maxWidth: number) {
  const first = await manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
    compress: 0.62,
    format: SaveFormat.JPEG,
  })
  let ready = first.uri
  let base64 = await readAsStringAsync(ready, { encoding: EncodingType.Base64 })
  if (base64.length <= DATA_LIMIT) return { uri: ready, base64 }
  const again = await manipulateAsync(ready, [{ resize: { width: Math.round(maxWidth * 0.7) } }], {
    compress: 0.5,
    format: SaveFormat.JPEG,
  })
  ready = again.uri
  base64 = await readAsStringAsync(ready, { encoding: EncodingType.Base64 })
  return { uri: ready, base64 }
}

async function tryStorage(path: string, base64: string) {
  const storageRef = ref(getFirebaseStorage(), path)
  await uploadString(storageRef, base64, "base64", { contentType: "image/jpeg" })
  return getDownloadURL(storageRef)
}

async function persistImage(path: string, uri: string, maxWidth: number) {
  if (isRemoteImage(uri) || isEmbeddedImage(uri)) return uri
  const { base64 } = await shrink(uri, maxWidth)
  if (!base64) throw new AppError("uploadFailed")
  try {
    return await tryStorage(path, base64)
  } catch {
    if (base64.length > DATA_LIMIT) throw new AppError("imageTooLarge")
    return `data:image/jpeg;base64,${base64}`
  }
}

async function readyUri(uri: string, kind: "avatar" | "banner" | "activity") {
  if (isGeneratedArt(uri)) return rasterizeGenerated(uri, kind === "banner" ? "banner" : "avatar")
  return uri
}

export async function uploadAvatar(userId: string, uri: string) {
  return persistImage(`avatars/${userId}/avatar.jpg`, await readyUri(uri, "avatar"), 512)
}

export async function uploadBanner(userId: string, uri: string) {
  return persistImage(`banners/${userId}/banner.jpg`, await readyUri(uri, "banner"), 1200)
}

export async function uploadActivityImage(userId: string, uri: string) {
  return persistImage(`activities/${userId}/${createId("img")}.jpg`, await readyUri(uri, "activity"), 1080)
}
