import type { ReactNode } from "react";
import { Camera, X } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function ProfileBanner({
  src,
  className,
  children,
}: {
  src?: string | null;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("relative h-[120px] overflow-hidden bg-transparent sm:h-[200px]", className)}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
      {children}
    </div>
  );
}

export function PhotoAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-[2px] hover:bg-black/50"
    >
      <Camera className="size-5" />
    </button>
  );
}

export function RemovePhotoAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex size-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-[2px] hover:bg-black/50"
    >
      <X className="size-5" />
    </button>
  );
}

export function ProfileAvatarFrame({
  name,
  src,
  children,
}: {
  name: string;
  src?: string | null;
  children?: ReactNode;
}) {
  return (
    <span className="relative inline-flex rounded-full bg-background p-1">
      <Avatar
        name={name}
        src={src}
        size="2xl"
        className="h-[86px] w-[86px] text-2xl sm:h-[112px] sm:w-[112px] sm:text-3xl"
      />
      {children}
    </span>
  );
}
