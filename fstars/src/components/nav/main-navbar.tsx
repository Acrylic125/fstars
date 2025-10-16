"use client";

import { Hamburger, MenuIcon, MoonIcon, PlusIcon, SunIcon } from "lucide-react";
import { useThemeStore } from "../theme-store";
import { Button } from "../ui/button";
import { useShallow } from "zustand/react/shallow";
import Link from "next/link";
import { Favicon } from "../icons/favicon";
import { FStarsLogo } from "../icons/fstars-logo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function MainNavbar() {
  const { theme, setTheme } = useThemeStore(
    useShallow(({ theme, setTheme }) => ({
      theme,
      setTheme,
    }))
  );

  return (
    <nav className="flex flex-col items-center border-b border-border">
      <div className="w-full md:h-16 h-14 flex lg:hidden flex-row items-center justify-between py-1.5 px-4 md:px-8">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>
                <div className="relative h-6 aspect-[150/53]">
                  <FStarsLogo />
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col">
              <Button
                variant="ghost"
                asChild
                className="text-left flex flex-row items-center justify-start"
              >
                <Link href="/timetable">Timetable</Link>
              </Button>
              <Button
                variant="ghost"
                asChild
                className="text-left flex flex-row items-center justify-start"
              >
                <Link href="/vacant-classrooms">Vacant Classrooms</Link>
              </Button>
            </div>
            <div className="flex flex-row items-center gap-2 px-4">
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
          </SheetContent>
        </Sheet>
        <Link href="/" className="h-full flex flex-row items-center gap-4">
          <div className="relative h-full aspect-square">
            <Favicon />
          </div>
        </Link>
      </div>
      <div className="w-full h-14 md:h-16 max-w-ui hidden lg:flex flex-row items-center justify-between py-1.5 px-4 md:px-8">
        <div className="flex flex-row items-center h-full gap-4">
          <Link href="/" className="h-full flex flex-row items-center gap-4">
            <div className="relative h-full aspect-square">
              <Favicon />
            </div>
            <div className="relative h-6 aspect-[150/53]">
              <FStarsLogo />
            </div>
          </Link>
          <div className="flex flex-row items-center">
            <Button variant="ghost" asChild className="h-full px-2">
              <Link href="/timetable">Timetable</Link>
            </Button>
            <Button variant="ghost" asChild className="h-full px-2">
              <Link href="/vacant-classrooms">Vacant Classrooms</Link>
            </Button>
          </div>
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
