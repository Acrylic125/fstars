"use client";
import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "./theme-store";
import { cn } from "@/lib/utils";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

export function ThemeProvider({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const { theme } = useThemeStore(useShallow(({ theme }) => ({ theme })));

  return (
    <body
      className={cn(
        {
          dark: theme === "dark",
        },
        className
      )}
    >
      {children}
    </body>
  );
}

const queryClient = new QueryClient();

export function Providers({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider className={className}>{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
