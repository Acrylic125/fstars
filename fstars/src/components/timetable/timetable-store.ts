import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { AcadYear, Program } from "@/lib/types";

export type TimetableId = string;
export type PlanId = string;
export type CourseId = string;

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
  acadYear: AcadYear;
  courses: Map<
    string,
    {
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
  addCourseToPlan: (
    timetableId: TimetableId,
    planId: PlanId,
    course: {
      code: string;
      index: string;
    }
  ) => void;
  removeCourseFromPlan: (
    timetableId: TimetableId,
    planId: PlanId,
    courseCode: string
  ) => void;
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
      addCourseToPlan: (
        timetableId: TimetableId,
        planId: PlanId,
        course: {
          code: string;
          index: string;
        }
      ) => {
        set((state) => {
          const timetable = state.timetables.get(timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(planId);
          if (!plan) return {};

          // Create new plan object with updated courses
          const updatedPlan = {
            ...plan,
            courses: new Map(plan.courses).set(course.code, {
              index: course.index,
            }),
          };

          // Create new timetable object with updated plans
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(planId, updatedPlan),
          };

          return {
            timetables: new Map(state.timetables).set(
              timetableId,
              updatedTimetable
            ),
          };
        });
      },
      removeCourseFromPlan: (
        timetableId: TimetableId,
        planId: PlanId,
        courseCode: string
      ) => {
        set((state) => {
          const timetable = state.timetables.get(timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(planId);
          if (!plan) return {};

          // Create new plan object with updated courses
          const courses = new Map(plan.courses);
          courses.delete(courseCode);
          const updatedPlan = {
            ...plan,
            courses,
          };

          // Create new timetable object with updated plans
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(planId, updatedPlan),
          };

          return {
            timetables: new Map(state.timetables).set(
              timetableId,
              updatedTimetable
            ),
          };
        });
      },
    }),
    { name: "timetables", storage }
  )
);
