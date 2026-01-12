import { create } from "zustand";
import { getInitialSelectedWeeksBitMask } from "../calendar-view-week-selector";
import { CalendarViewWeekSelector } from "../timetable/timetable-view-week-selector";

export const useVacantClassroomViewWeekSelector =
  create<CalendarViewWeekSelector>((set) => ({
    selectedWeeksBitMask: getInitialSelectedWeeksBitMask(),
    setSelectedBitMask: (selectedBitMask) => {
      return set({
        selectedWeeksBitMask: selectedBitMask,
      });
    },
  }));
