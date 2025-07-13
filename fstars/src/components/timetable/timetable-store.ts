import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";

export type TimetableId = string;
export type PlanId = string;
export type CourseId = string;

export type Program = {
  name: string;
  code: string;
  subCode?: string;
  year: number;
};

export type Plan = {
  id: PlanId;
  name: string;
  courses: Map<
    CourseId,
    {
      index: string;
    }
  >;
};

export type Timetable = {
  id: TimetableId;
  name: string;
  program: Program;
  acadYear: {
    yearCode: string;
    semesterCode: string;
  };
  courses: Map<
    string,
    {
      isEnabled: boolean;
      code: string;
      ignoreIndexes: Set<string>;
    }
  >;
  plans: Map<PlanId, Plan>;
  selectedGeneratorId: string;
  selectedPlanId: PlanId;
};

type TimetableStore = {
  timetables: Map<TimetableId, Timetable>;
  createTimetable: (timetable: Timetable) => void;
  changeTimetablePlan: (timetableId: TimetableId, planId: PlanId) => void;
};

const storage: PersistStorage<TimetableStore> = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return superjson.parse(str) as { state: TimetableStore };
  },
  setItem: (name, value) => {
    localStorage.setItem(name, superjson.stringify(value));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

export const useTimetableStore = create<TimetableStore>()(
  persist(
    (set) => ({
      timetables: new Map(),
      createTimetable: (timetable: Timetable) =>
        set((state) => {
          return {
            timetables: new Map(state.timetables).set(timetable.id, timetable),
          };
        }),
      changeTimetablePlan: (timetableId: TimetableId, planId: PlanId) => {
        set((state) => {
          const timetable = state.timetables.get(timetableId);
          if (!timetable) return {};
          timetable.selectedPlanId = planId;

          return {
            timetables: new Map(state.timetables).set(timetable.id, timetable),
          };
        });
      },
    }),
    { name: "timetables", storage }
  )
);
