"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Avatar } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Feed", short: "Feed" },
  { href: "/me", label: "My activities", short: "Mine" },
];

export function Header() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-2 px-4">
        <Logo />
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm",
                pathname === item.href
                  ? "font-bold text-foreground"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground",
              )}
            >
              <span className="sm:hidden">{item.short}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
        {user ? (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="rounded-full ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar name={user.displayName} src={user.avatarUrl} />
            </button>
            {open ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-border bg-card py-1 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-medium">{user.displayName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <MenuLink href="/profile" onClick={() => setOpen(false)}>
                  Profile
                </MenuLink>
                <MenuLink href="/me" onClick={() => setOpen(false)}>
                  My activities
                </MenuLink>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={async () => {
                    setOpen(false);
                    await signOut();
                    router.push("/login");
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <Link href="/login" className="text-sm text-muted-foreground">
            Sign in
          </Link>
        )}
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} onClick={onClick} className="block px-3 py-2 text-sm hover:bg-muted">
      {children}
    </Link>
  );
}
