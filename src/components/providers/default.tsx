import { AuthProvider } from "./auth";
import { ConvexProviderWrapper } from "./convex";
import { UserSync } from "./UserSync";
import { QueryClientProvider } from "./query-client";
import { ThemeProvider } from "./theme";
import { Toaster } from "../ui/sonner";
import { TooltipProvider } from "../ui/tooltip";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConvexProviderWrapper>
        <UserSync />

        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>
              <Toaster />
              {children}
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ConvexProviderWrapper>
    </AuthProvider>
  );
}
