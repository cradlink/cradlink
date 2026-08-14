import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4 flex items-center gap-1">
        <LanguageSwitcher compact align="right" />
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  );
}
