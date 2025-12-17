import { create } from "zustand";
import {
  CalendarViewWeekSelector,
  getInitialSelectedWeeksBitMask,
} from "../calendar-view-week-selector";

export const useVacantClassroomViewWeekSelector =
  create<CalendarViewWeekSelector>((set) => ({
    selectedWeeksBitMask: getInitialSelectedWeeksBitMask(),
    setSelectedBitMask: (selectedBitMask) => {
      return set({
        selectedWeeksBitMask: selectedBitMask,
      });
    },
  }));
