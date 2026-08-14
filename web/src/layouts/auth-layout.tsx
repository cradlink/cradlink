import { Outlet } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export function AuthLayout() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <Outlet />
    </div>
  );
}
