import { Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function Fab() {
  const pathname = useLocation().pathname;
  if (pathname.startsWith("/activities/new") || pathname.endsWith("/edit")) return null;

  return (
    <Link
      to="/activities/new"
      className="fixed bottom-6 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground hover:bg-[#1a8cd8]"
    >
      <Plus className="size-5" />
      Create
    </Link>
  );
}
