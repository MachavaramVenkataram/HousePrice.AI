"use client";

import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ModeProvider } from "./mode-context";
import { ThemeAccentProvider } from "./ui/ThemeAccentContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeAccentProvider>
        <ModeProvider>{children}</ModeProvider>
      </ThemeAccentProvider>
    </QueryClientProvider>
  );
}
