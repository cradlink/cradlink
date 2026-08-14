"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

export function Fab() {
  const pathname = usePathname();
  if (pathname.startsWith("/activities/new")) return null;

  return (
    <Link
      href="/activities/new"
      className="fixed bottom-6 right-5 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-primary px-5 text-base font-bold text-primary-foreground hover:bg-[#1a8cd8]"
    >
      <Plus className="size-5" />
      Create
    </Link>
  );
}
