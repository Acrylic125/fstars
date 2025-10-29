"use client";

import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "./theme-store";
import { cn } from "@/lib/utils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/react-query";
import { makeQueryClient } from "@/server/query-client";
import { useEffect, useState } from "react";
import { getTrpcUrl } from "@/server/utils";
import { trpc } from "@/server/client";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { env } from "@/lib/env";

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
  useEffect(() => {
    posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
      // api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
      api_host: "/relay-AQvm",
      ui_host: "https://us.posthog.com",
      person_profiles: "always", // or 'always' to create profiles for anonymous users as well
      defaults: "2025-05-24",
    });
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <PHProvider client={posthog}>
            <ThemeProvider className={className}>{children}</ThemeProvider>
          </PHProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
