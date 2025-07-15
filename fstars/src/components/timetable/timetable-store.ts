import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { AcadYear, Program } from "@/lib/types";

export type TimetableId = string;
export type PlanId = string;
export type CourseCode = string;
export type CourseIndex = string;

export type Plan = {
  id: PlanId;
  name: string;
  courses: Map<
    CourseCode,
    {
      index: CourseIndex;
      ignoreIndexes: Set<string>;
    }
  >;
};

export type Timetable = {
  id: TimetableId;
  name: string;
  program: Program;
  acadYear: AcadYear;
  plans: Map<PlanId, Plan>;
  selectedGeneratorId: string;
  selectedPlanId: PlanId;
};

export type TimetableRef = {
  timetableId: TimetableId;
};

export type TimetablePlanRef = {
  timetableId: TimetableId;
  planId: PlanId;
};

export type TimetablePlanCourseRef = {
  timetableId: TimetableId;
  planId: PlanId;
  courseCode: CourseCode;
};

type TimetableStore = {
  timetables: Map<TimetableId, Timetable>;
  createTimetable: (timetable: Timetable) => void;
  changeTimetablePlan: (timetableId: TimetableId, planId: PlanId) => void;
  addCourseToPlan: (
    ref: TimetablePlanRef,
    course: {
      code: string;
      index: CourseIndex;
      ignoreIndexes: string[];
    }
  ) => void;
  removeCourseFromPlan: (ref: TimetablePlanCourseRef) => void;
  toggleIgnoreIndexes: (
    ref: TimetablePlanCourseRef,
    indexes: string[],
    ignored: boolean
  ) => void;
  selectCourseIndex: (ref: TimetablePlanCourseRef, index: CourseIndex) => void;
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
        ref: TimetablePlanRef,
        course: {
          code: string;
          index: CourseIndex;
          ignoreIndexes: string[];
        }
      ) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};

          // Create new plan object with updated courses
          const updatedPlan = {
            ...plan,
            courses: new Map(plan.courses).set(course.code, {
              index: course.index,
              ignoreIndexes: new Set(course.ignoreIndexes),
            }),
          };

          // Create new timetable object with updated plans
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(ref.planId, updatedPlan),
          };

          return {
            timetables: new Map(state.timetables).set(
              ref.timetableId,
              updatedTimetable
            ),
          };
        });
      },
      removeCourseFromPlan: (ref: TimetablePlanCourseRef) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};

          // Create new plan object with updated courses
          const courses = new Map(plan.courses);
          courses.delete(ref.courseCode);
          const updatedPlan = {
            ...plan,
            courses,
          };

          // Create new timetable object with updated plans
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(ref.planId, updatedPlan),
          };

          return {
            timetables: new Map(state.timetables).set(
              ref.timetableId,
              updatedTimetable
            ),
          };
        });
      },
      toggleIgnoreIndexes: (
        ref: TimetablePlanCourseRef,
        indexes: string[],
        ignored: boolean
      ) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};

          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};

          const course = plan.courses.get(ref.courseCode);
          if (!course) return {};

          const ignoreIndexes = new Set(course.ignoreIndexes);
          console.log("ignoreIndexes", ignoreIndexes);
          console.log("indexes", indexes);
          console.log("ignored", ignored);
          if (ignored) {
            for (const index of indexes) {
              ignoreIndexes.add(index);
            }
          } else {
            for (const index of indexes) {
              ignoreIndexes.delete(index);
            }
          }

          const updatedCourse = {
            ...course,
            ignoreIndexes,
          };
          const updatedPlan = {
            ...plan,
            courses: new Map(plan.courses).set(ref.courseCode, updatedCourse),
          };
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(ref.planId, updatedPlan),
          };

          return {
            timetables: new Map(state.timetables).set(
              ref.timetableId,
              updatedTimetable
            ),
          };
        });
      },
      selectCourseIndex: (ref: TimetablePlanCourseRef, index: CourseIndex) => {
        set((state) => {
          console.log("selectCourseIndex", ref, index);
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};
          console.log("selectCourseIndex", ref, index);

          const course = plan.courses.get(ref.courseCode);
          if (!course) return {};
          console.log("selectCourseIndex", ref, index);

          const updatedCourse = {
            ...course,
            index,
          };
          const updatedPlan = {
            ...plan,
            courses: new Map(plan.courses).set(ref.courseCode, updatedCourse),
          };
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(ref.planId, updatedPlan),
          };
          return {
            timetables: new Map(state.timetables).set(
              ref.timetableId,
              updatedTimetable
            ),
          };
        });
      },
    }),
    { name: "timetables", storage }
  )
);
