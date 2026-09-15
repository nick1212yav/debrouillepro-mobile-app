// src/components/providers/default.tsx
import { type ReactNode } from "react";
import { AuthProvider } from "./auth";
import { ConvexProviderWrapper } from "./convex";
import { QueryClientProvider } from "./query-client";
import { ThemeProvider } from "./theme";
import { TooltipProvider } from "../ui/tooltip";

export function DefaultProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ConvexProviderWrapper>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ConvexProviderWrapper>
    </AuthProvider>
  );
}
