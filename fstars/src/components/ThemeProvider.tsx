"use client";
import { useShallow } from "zustand/react/shallow";
import { useThemeStore } from "./theme-store";
import { cn } from "@/lib/utils";

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
