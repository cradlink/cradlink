import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LOCALES, resolveLocale } from "@/i18n";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  compact = false,
  align = "left",
}: {
  compact?: boolean;
  align?: "left" | "right";
}) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((locale) => locale.code === resolveLocale(i18n.language)) ?? LOCALES[0];

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.choose")}
        className={cn(
          "inline-flex items-center gap-2 rounded-full text-foreground hover:bg-muted",
          compact ? "h-10 w-10 justify-center" : "h-10 px-3",
        )}
      >
        <Languages className="size-4 shrink-0" />
        {compact ? null : <span className="text-sm">{current.nativeName}</span>}
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={t("language.label")}
          className={cn(
            "absolute z-40 mt-2 min-w-56 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-[0_0_15px_rgba(255,255,255,0.08)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {LOCALES.map((locale) => {
            const active = locale.code === current.code;
            return (
              <button
                key={locale.code}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                  active && "font-bold",
                )}
                onClick={() => {
                  void i18n.changeLanguage(locale.code);
                  setOpen(false);
                }}
              >
                <span className="block">{locale.nativeName}</span>
                <span className="block text-xs text-muted-foreground">{locale.englishName}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
