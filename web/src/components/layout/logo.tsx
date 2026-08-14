import { Link } from "react-router-dom";
import { APP_NAME } from "@/lib/config";
import { cn } from "@/lib/utils";

function SvgAsset({ src, className }: { src: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block bg-foreground", className)}
      style={{
        maskImage: `url(${src})`,
        WebkitMaskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
      }}
    />
  );
}

export function Logo({
  className,
  wordmarkClassName,
}: {
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <Link
      to="/"
      aria-label={APP_NAME}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <SvgAsset src="/images/cradlink.svg" className="h-8 w-8" />
      <SvgAsset
        src="/images/cradlink-text.svg"
        className={cn("h-5 aspect-[219/46]", wordmarkClassName)}
      />
    </Link>
  );
}
