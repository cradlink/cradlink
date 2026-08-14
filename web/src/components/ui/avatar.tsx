import { cn, initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const dim =
    size === "sm"
      ? "h-8 w-8 text-[10px]"
      : size === "lg"
        ? "h-16 w-16 text-lg"
        : size === "xl"
          ? "h-[72px] w-[72px] text-xl"
          : size === "2xl"
            ? "h-[112px] w-[112px] text-3xl"
            : "h-10 w-10 text-xs";
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#333639] font-semibold text-foreground",
        dim,
        className,
      )}
      aria-hidden={!src}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
