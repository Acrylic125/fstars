import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";
import { fallback } from "@/lib/zod";

const ThemeStoreStateSchema = z.object({
  theme: z.enum(["light", "dark"]).default("dark").or(fallback("dark")),
});

type ThemeStoreState = z.infer<typeof ThemeStoreStateSchema>;

type ThemeStore = {
  setTheme: (theme: "light" | "dark") => void;
} & ThemeStoreState;

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme: "light" | "dark") => set({ theme }),
    }),
    { name: "theme", storage: createJSONStorage(() => localStorage) }
  )
);
