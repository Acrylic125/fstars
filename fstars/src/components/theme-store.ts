import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type ThemeStore = {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme: "light" | "dark") => set({ theme }),
    }),
    { name: "theme", storage: createJSONStorage(() => localStorage) }
  )
);
