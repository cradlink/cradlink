"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider, useTheme } from "@/hooks/use-theme";

function ThemedToaster() {
  const { theme } = useTheme();
  return <Toaster position="top-center" richColors theme={theme} />;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <AuthProvider>
          {children}
          <ThemedToaster />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
