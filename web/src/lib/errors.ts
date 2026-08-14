import i18n from "@/i18n";

export class AppError extends Error {
  key?: string;
  params?: Record<string, unknown>;

  constructor(message: string, options?: { key?: string; params?: Record<string, unknown> }) {
    super(message);
    this.name = "AppError";
    this.key = options?.key;
    this.params = options?.params;
  }
}

function translate(key: string, params?: Record<string, unknown>, fallback?: string) {
  return String(i18n.t(key, { ...params, defaultValue: fallback ?? key }));
}

export function appError(key: string, params?: Record<string, unknown>) {
  return new AppError(translate(key, params), { key, params });
}

export function errorMessage(err: unknown, fallbackKey = "errors.generic"): string {
  if (err instanceof AppError) {
    if (err.key) return translate(err.key, err.params, err.message);
    return err.message;
  }
  if (err instanceof Error && err.message) {
    if (err.message.startsWith("errors.")) return translate(err.message);
    return err.message;
  }
  return translate(fallbackKey);
}

export function isPermissionDenied(err: unknown) {
  if (typeof err === "object" && err && "code" in err) {
    return String((err as { code: string }).code).includes("permission-denied");
  }
  return String(err).toLowerCase().includes("permission");
}
