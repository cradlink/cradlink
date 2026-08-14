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
