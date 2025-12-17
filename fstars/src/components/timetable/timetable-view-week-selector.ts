import { create } from "zustand";
import {
  ALL_WEEKS,
  CalendarViewWeekSelector,
  getInitialSelectedWeeksBitMask,
} from "../calendar-view-week-selector";

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
