export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  if (err instanceof AppError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function isPermissionDenied(err: unknown) {
  if (typeof err === "object" && err && "code" in err) {
    return String((err as { code: string }).code).includes("permission-denied");
  }
  return String(err).toLowerCase().includes("permission");
}
