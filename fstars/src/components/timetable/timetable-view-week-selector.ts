import { create } from "zustand";
import { getAcadWeek, getNow } from "@/lib/acad";
import { Config } from "@/lib/config";

export type CalendarViewWeekSelector = {
  selectedWeeksBitMask: number;
  setSelectedBitMask: (selectedBitMask: number) => void;
};

const ALL_WEEKS = (1 << Config.lastWeek) - 1;

function getInitialSelectedWeeksBitMask() {
  // Only run on client side - during build/SSR, return default
  if (typeof window === "undefined") {
    return ALL_WEEKS;
  }
  const currentDateTime = getNow();
  const acadWeek = getAcadWeek(currentDateTime);
  if (!acadWeek || !acadWeek.week) {
    return ALL_WEEKS;
  }
  return 1 << (acadWeek.week - 1);
}

export const useTimetableViewWeekSelector = create<CalendarViewWeekSelector>(
  (set) => ({
    selectedWeeksBitMask: ALL_WEEKS,
    setSelectedBitMask: (selectedBitMask) => {
      return set({
        selectedWeeksBitMask: selectedBitMask,
      });
    },
  })
);

export const usePreviewViewWeekSelector = create<CalendarViewWeekSelector>(
  (set) => ({
    selectedWeeksBitMask: getInitialSelectedWeeksBitMask(),
    setSelectedBitMask: (selectedBitMask) => {
      return set({
        selectedWeeksBitMask: selectedBitMask,
      });
    },
  })
);
