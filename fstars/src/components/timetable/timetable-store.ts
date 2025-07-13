import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";

export type TimetableId = string;

export type Program = {
  name: string;
  code: string;
  subCode?: string;
  year: number;
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
      viewIndex: string;
    }
  >;
  selectedGeneratorId: string;
};

type TimetableStore = {
  timetables: Map<TimetableId, Timetable>;
  createTimetable: (timetable: Timetable) => void;
};

const storage: PersistStorage<TimetableStore> = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    return superjson.parse(str);
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
          state.timetables.set(timetable.id, timetable);
          return state;
        }),
    }),
    { name: "timetables", storage }
  )
);
