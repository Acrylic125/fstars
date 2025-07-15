"use client";
import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "./theme-store";
import { cn } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type AppRouter } from "@/server/router";
import { createTRPCReact, httpBatchLink } from "@trpc/react-query";
import { makeQueryClient } from "@/server/query-client";
import { useState } from "react";
import { getTrpcUrl } from "@/server/utils";
import { trpc } from "@/server/client";

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

let clientQueryClientSingleton: QueryClient;
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }
  // Browser: use singleton pattern to keep the same query client
  return (clientQueryClientSingleton ??= makeQueryClient());
}

export function Providers({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          // transformer: superjson, <-- if you use a data transformer
          url: getTrpcUrl(),
        }),
      ],
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider className={className}>{children}</ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
