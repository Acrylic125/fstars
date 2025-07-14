"use client";

import { MoonIcon, PlusIcon, SunIcon } from "lucide-react";
import { FullLogo } from "../icons/full-logo";
import { useThemeStore } from "../theme-store";
import { Button } from "../ui/button";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";

export function MainNavbar() {
  const { theme, setTheme } = useThemeStore(
    useShallow(({ theme, setTheme }) => ({
      theme,
      setTheme,
    }))
  );

  return (
    <nav className="flex flex-col items-center border-b border-border">
      <div className="w-full h-14 md:h-16 max-w-ui flex flex-row items-center justify-between py-1.5 px-4 md:px-8">
        <div className="flex flex-row items-center gap-2 h-full">
          <FullLogo className="h-full" />
          <Button variant="ghost" asChild className="h-full">
            <Link href="/timetable">Timetable</Link>
          </Button>
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

          <Button variant="default" asChild>
            <Link href="/new">
              <PlusIcon className="h-4 w-4" />
              New
            </Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
