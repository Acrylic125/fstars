import { create } from "zustand";
import {
  ALL_WEEKS,
  CalendarViewWeekSelector,
} from "../calendar-view-week-selector";
import { getCurrentAcadWeek } from "@/lib/acad";

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

function getInitialSelectedWeeksBitMask() {
  const { acadWeek } = getCurrentAcadWeek();
  if (!acadWeek || !acadWeek.week) {
    return ALL_WEEKS;
  }
  return 1 << (acadWeek.week - 1);
}

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
