import { appError } from "@/lib/errors";

const MAX_BYTES = 1.4 * 1024 * 1024;

function loadViaElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    image.src = url;
  });
}

async function sourceSize(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height, draw: bitmap, close: () => bitmap.close() };
    return size;
  } catch {
    const image = await loadViaElement(file);
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: image,
      close: () => undefined,
    };
  }
}

export async function prepareImageFile(file: File, maxEdge = 1600): Promise<File> {
  let source: Awaited<ReturnType<typeof sourceSize>>;
  try {
    source = await sourceSize(file);
  } catch {
    throw appError("errors.chooseImage");
  }

  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height, 1));
  const width = Math.max(1, Math.round(source.width * scale));
  const height = Math.max(1, Math.round(source.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    source.close();
    throw appError("errors.couldNotReadImage");
  }
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source.draw, 0, 0, width, height);
  source.close();

  for (const quality of [0.88, 0.76, 0.64, 0.52, 0.4]) {
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((next) => resolve(next), "image/jpeg", quality);
    });
    if (!blob) continue;
    if (blob.size <= MAX_BYTES || quality === 0.4) {
      return new File([blob], "image.jpg", { type: "image/jpeg" });
    }
  }
  throw appError("errors.imageTooLarge");
}

export function isStorageUrl(url: string | null | undefined) {
  if (!url) return true;
  return (
    url.startsWith("https://") &&
    !url.startsWith("blob:") &&
    !url.startsWith("data:") &&
    !url.startsWith("file:")
  );
}
