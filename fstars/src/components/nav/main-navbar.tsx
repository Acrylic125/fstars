"use client";

import { MoonIcon, SunIcon } from "lucide-react";
import { FullLogo } from "../icons/full-logo";
import { useThemeStore } from "../theme-store";
import { Button } from "../ui/button";
import { useShallow } from "zustand/react/shallow";

export function MainNavbar() {
  const { theme, setTheme } = useThemeStore(
    useShallow(({ theme, setTheme }) => ({
      theme,
      setTheme,
    }))
  );

  return (
    <nav className="flex flex-col items-center border-b border-border">
      <div className="w-full h-14 md:h-16 max-w-ui flex flex-row items-center justify-between py-1.5 px-2">
        <div className="flex flex-row items-center gap-2 h-full">
          <FullLogo className="h-full" />
        </div>
        <div className="flex flex-row items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            {theme === "dark" ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </nav>
  );
}
