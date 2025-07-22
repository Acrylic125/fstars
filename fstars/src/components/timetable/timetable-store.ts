import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { AcadYear, AcadYearSchema, Program, ProgramSchema } from "@/lib/types";
import { nanoid } from "nanoid";
import z from "zod";

export const TimetableIdSchema = z.string();
export const PlanIdSchema = z.string();
export const CourseCodeSchema = z.string();
export const CourseIndexSchema = z.string();

export type TimetableId = z.infer<typeof TimetableIdSchema>;
export type PlanId = z.infer<typeof PlanIdSchema>;
export type CourseCode = z.infer<typeof CourseCodeSchema>;
export type CourseIndex = z.infer<typeof CourseIndexSchema>;

export const PlanSchema = z.object({
  id: PlanIdSchema,
  name: z.string(),
  courses: z.map(
    CourseCodeSchema,
    z.object({
      index: CourseIndexSchema,
      ignoreIndexes: z.set(CourseIndexSchema),
    })
  ),
});

export type Plan = z.infer<typeof PlanSchema>;

export const TimetableSchema = z.object({
  id: TimetableIdSchema,
  name: z.string(),
  program: ProgramSchema,
  acadYear: AcadYearSchema,
  plans: z.map(PlanIdSchema, PlanSchema).default(new Map()),
  selectedGeneratorId: z.string().default(""),
  selectedPlanId: PlanIdSchema.default(""),
});

export type Timetable = z.infer<typeof TimetableSchema>;

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

const TimetableStoreStateSchema = z.object({
  timetables: z.map(TimetableIdSchema, TimetableSchema),
});

type TimetableStoreState = z.infer<typeof TimetableStoreStateSchema>;

type TimetableStore = {
  createTimetable: (timetable: Timetable) => void;
  // Plan selection.
  changeTimetablePlan: (timetableId: TimetableId, planId: PlanId) => void;
  // Course CRUD.
  addCourseToPlan: (
    ref: TimetablePlanRef,
    course: {
      code: string;
      index: CourseIndex;
      ignoreIndexes: string[];
    }
  ) => void;
  removeCourseFromPlan: (ref: TimetablePlanCourseRef) => void;
  selectCourseIndexes: (
    ref: TimetablePlanRef,
    courseIndexSelections: {
      courseCode: CourseCode;
      index: CourseIndex;
    }[]
  ) => void;
  // Course index selection.
  toggleIgnoreIndexes: (
    ref: TimetablePlanCourseRef,
    indexes: string[],
    ignored: boolean
  ) => void;
  selectCourseIndex: (ref: TimetablePlanCourseRef, index: CourseIndex) => void;
  // Plan CRUD.
  deletePlan: (ref: TimetablePlanRef, autoSelect?: boolean) => void;
  changePlanName: (ref: TimetablePlanRef, name: string) => void;
  createPlanCopy: (
    ref: TimetablePlanRef,
    autoSelect?: boolean
  ) =>
    | {
        type: "success";
        planId: PlanId;
      }
    | {
        type: "error";
        error: string;
      };
  createPlan: (ref: TimetableRef, name: string, autoSelect?: boolean) => void;
} & TimetableStoreState;

const RawSchema = z.object({
  version: z.number(),
  state: TimetableStoreStateSchema,
});

const storage: PersistStorage<TimetableStore> = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    const raw = superjson.parse(str);
    const res = RawSchema.safeParse(raw);
    if (!res.success) {
      console.error(res.error);
      return null;
    }
    return { state: res.data.state } as { state: TimetableStore };
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
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
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
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });
      },
      selectCourseIndexes: (
        ref: TimetablePlanRef,
        courseIndexSelections: {
          courseCode: CourseCode;
          index: CourseIndex;
        }[]
      ) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) {
            return {};
          }
          const plan = timetable.plans.get(ref.planId);
          if (!plan) {
            return {};
          }

          const updatedCourses = new Map();
          courseIndexSelections.forEach(({ courseCode, index }) => {
            const course = plan.courses.get(courseCode);
            if (!course) {
              updatedCourses.set(courseCode, {
                index,
                ignoreIndexes: new Set(),
              });
              return;
            }
            course.index = index;
            updatedCourses.set(courseCode, course);
          });

          const updatedPlan = {
            ...plan,
            courses: updatedCourses,
          };
          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(ref.planId, updatedPlan),
          };
          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
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
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });
      },
      selectCourseIndex: (ref: TimetablePlanCourseRef, index: CourseIndex) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};

          const course = plan.courses.get(ref.courseCode);
          if (!course) return {};

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
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });
      },
      deletePlan: (ref: TimetablePlanRef, autoSelect: boolean = true) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};

          const newPlans = new Map(timetable.plans);
          newPlans.delete(ref.planId);
          const updatedTimetable = {
            ...timetable,
            plans: newPlans,
          };

          if (autoSelect) {
            const newPlanIds = Array.from(newPlans.keys());
            if (newPlanIds.length > 0) {
              updatedTimetable.selectedPlanId =
                newPlanIds[newPlanIds.length - 1];
            } else {
              updatedTimetable.selectedPlanId = "";
            }
          }

          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
          // return {
          //   timetables: new Map(state.timetables).set(
          //     ref.timetableId,
          //     updatedTimetable
          //   ),
          // };
        });
      },
      changePlanName: (ref: TimetablePlanRef, name: string) => {
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) return {};
          const plan = timetable.plans.get(ref.planId);
          if (!plan) return {};

          const updatedPlan = {
            ...plan,
            name,
          };

          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(ref.planId, updatedPlan),
          };

          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
          // return {
          //   timetables: new Map(state.timetables).set(
          //     ref.timetableId,
          //     updatedTimetable
          //   ),
          // };
        });
      },
      createPlanCopy: (ref: TimetablePlanRef, autoSelect: boolean = true) => {
        let res:
          | {
              type: "success";
              planId: PlanId;
            }
          | {
              type: "error";
              error: string;
            }
          | null = null;
        set((state) => {
          const timetable = state.timetables.get(ref.timetableId);
          if (!timetable) {
            res = {
              type: "error",
              error: "Timetable not found",
            };
            return {};
          }
          const plan = timetable.plans.get(ref.planId);
          if (!plan) {
            res = {
              type: "error",
              error: "Plan not found",
            };
            return {};
          }

          // Deep copy plan.
          const newPlan = superjson.parse(superjson.stringify(plan)) as Plan;
          newPlan.id = nanoid(16);
          newPlan.name = `${plan.name} Copy`;

          res = {
            type: "success",
            planId: newPlan.id,
          };

          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(newPlan.id, newPlan),
            selectedPlanId: autoSelect ? newPlan.id : timetable.selectedPlanId,
          };

          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });

        if (res) {
          return {
            type: "success",
            planId: res,
          };
        }

        return {
          type: "error",
          error: "Failed to create plan copy",
        };
      },
      createPlan: (
        ref: TimetableRef,
        name: string,
        autoSelect: boolean = true
      ) => {
        set((state) => {
          const timetableId = ref.timetableId;
          const timetable = state.timetables.get(timetableId);
          if (!timetable) return {};

          const updatedPlan = {
            id: nanoid(16),
            name,
            courses: new Map(),
          };

          const updatedTimetable = {
            ...timetable,
            plans: new Map(timetable.plans).set(updatedPlan.id, updatedPlan),
            selectedPlanId: autoSelect
              ? updatedPlan.id
              : timetable.selectedPlanId,
          };

          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });
      },
    }),
    { name: "timetables", storage }
  )
);
