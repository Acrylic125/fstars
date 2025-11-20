import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { AcadYear, AcadYearSchema, Program, ProgramSchema } from "@/lib/types";
import { nanoid } from "nanoid";
import z from "zod";
import { fallback, injectDefaults } from "@/lib/zod";
import { Config } from "@/lib/config";

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
  name: z.string().default("New Plan").or(fallback("New Plan")),
  courses: z.map(
    CourseCodeSchema,
    injectDefaults(
      z.object({
        index: CourseIndexSchema,
        ignoreIndexes: z.set(CourseIndexSchema),
      }),
      {
        index: "",
        ignoreIndexes: new Set<string>(),
      }
    )
  ),
});

export type Plan = z.infer<typeof PlanSchema>;

export const TimetableSchema = z.object({
  id: TimetableIdSchema,
  name: z.string().default("New Timetable").or(fallback("New Timetable")),
  programs: z.array(ProgramSchema).or(fallback([])),
  acadYear: AcadYearSchema,
  plans: z
    .map(PlanIdSchema, PlanSchema)
    .default(new Map<PlanId, Plan>())
    .or(fallback(new Map<PlanId, Plan>())),
  selectedGeneratorId: z.string().default("").or(fallback("")),
  selectedPlanId: PlanIdSchema.default("").or(fallback("")),
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

export const TimetableStoreStateSchema = z.object({
  timetables: z.map(TimetableIdSchema, TimetableSchema),
});

type TimetableStoreState = z.infer<typeof TimetableStoreStateSchema>;

type TimetableStore = {
  createTimetable: (timetable: Timetable) =>
    | {
        type: "success";
        timetableId: TimetableId;
      }
    | {
        type: "error";
        error: string;
      };
  updateTimetable: (
    timetableId: TimetableId,
    timetable: {
      name: string;
      programs: Program[];
    }
  ) =>
    | {
        type: "success";
      }
    | {
        type: "error";
        error: string;
      };
  deleteTimetable: (timetableId: TimetableId) =>
    | {
        type: "success";
      }
    | {
        type: "error";
        error: string;
      };
  importTimetables: (timetables: Timetable[]) =>
    | {
        type: "success";
      }
    | {
        type: "error";
        error: string;
      };
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
  ) =>
    | {
        type: "success";
      }
    | {
        type: "error";
        error: string;
      };
  removeCourseFromPlan: (ref: TimetablePlanCourseRef) => void;
  // Course index selection.
  toggleIgnoreIndexes: (
    ref: TimetablePlanCourseRef,
    indexes: string[],
    ignored: boolean
  ) => void;
  selectCourseIndex: (ref: TimetablePlanCourseRef, index: CourseIndex) => void;
  selectCourseIndexes: (
    ref: TimetablePlanRef,
    courseIndexSelections: {
      courseCode: CourseCode;
      index: CourseIndex;
    }[],
    options?: {
      overrideAll?: boolean;
      defaultIgnoreMappings: { [courseCode: CourseCode]: CourseIndex[] };
    }
  ) =>
    | {
        type: "success";
      }
    | {
        type: "error";
        error: string;
      };
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
  createPlan: (
    ref: TimetableRef,
    name: string,
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
      createTimetable: (timetable: Timetable) => {
        let res: ReturnType<TimetableStore["createTimetable"]> = {
          type: "error",
          error: "Failed to create timetable",
        };
        set((state) => {
          if (state.timetables.size >= Config.limits.timetables) {
            res = {
              type: "error",
              error: `Timetable limit reached (${state.timetables.size} / ${Config.limits.timetables})`,
            };
            return {};
          }
          if (timetable.plans.size >= Config.limits.plans) {
            res = {
              type: "error",
              error: `Plan limit reached (${timetable.plans.size} / ${Config.limits.plans})`,
            };
            return {};
          }
          res = {
            type: "success",
            timetableId: timetable.id,
          };
          return {
            timetables: new Map(state.timetables).set(timetable.id, timetable),
          };
        });
        return res;
      },
      updateTimetable: (
        timetableId: TimetableId,
        newTimetable: {
          name: string;
          programs: Program[];
        }
      ) => {
        let res: ReturnType<TimetableStore["updateTimetable"]> = {
          type: "error",
          error: "Failed to update timetable",
        };
        set((state) => {
          const timetable = state.timetables.get(timetableId);
          if (!timetable) {
            res = {
              type: "error",
              error: "Timetable not found",
            };
            return {};
          }
          const updatedTimetable = {
            ...timetable,
            name: newTimetable.name,
            programs: newTimetable.programs,
          };
          res = {
            type: "success",
          };
          return {
            timetables: new Map(state.timetables).set(
              timetableId,
              updatedTimetable
            ),
          };
        });

        return res;
      },
      deleteTimetable: (timetableId: TimetableId) => {
        let res: ReturnType<TimetableStore["deleteTimetable"]> = {
          type: "error",
          error: "Failed to delete timetable",
        };
        set((state) => {
          const timetable = state.timetables.get(timetableId);
          if (!timetable) {
            res = {
              type: "error",
              error: "Timetable not found",
            };
            return {};
          }
          res = {
            type: "success",
          };
          const newTimetables = new Map(state.timetables);
          newTimetables.delete(timetableId);
          return {
            timetables: newTimetables,
          };
        });
        return res;
      },
      importTimetables: (timetables: Timetable[]) => {
        let res: ReturnType<TimetableStore["importTimetables"]> = {
          type: "error",
          error: "Failed to import timetables",
        };
        set((state) => {
          const newTimetables = new Map(state.timetables);
          timetables.forEach((timetable) => {
            newTimetables.set(timetable.id, timetable);
          });
          if (newTimetables.size > Config.limits.timetables) {
            res = {
              type: "error",
              error: `Timetable limit reached (${newTimetables.size} / ${Config.limits.timetables})`,
            };
            return {};
          }
          res = {
            type: "success",
          };
          return { timetables: newTimetables };
        });
        return res;
      },
      changeTimetablePlan: (timetableId: TimetableId, planId: PlanId) => {
        set((state) => {
          const timetable = state.timetables.get(timetableId);
          if (!timetable) return {};
          timetable.selectedPlanId = planId;

          return {
            timetables: state.timetables.set(timetable.id, timetable),
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
        let res: ReturnType<TimetableStore["addCourseToPlan"]> = {
          type: "error",
          error: "Failed to add course to plan",
        };
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
          if (updatedPlan.courses.size > Config.limits.coursesInPlan) {
            res = {
              type: "error",
              error: `Course limit reached (${updatedPlan.courses.size} / ${Config.limits.coursesInPlan})`,
            };
            return {};
          }

          res = {
            type: "success",
          };

          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });

        return res;
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
        }[],
        options
      ) => {
        let res: ReturnType<TimetableStore["selectCourseIndexes"]> = {
          type: "error",
          error: "Failed to select course indexes",
        };

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

          const updatedCourses = options?.overrideAll
            ? new Map()
            : new Map(plan.courses);
          courseIndexSelections.forEach(({ courseCode, index }) => {
            const course = plan.courses.get(courseCode);
            if (!course) {
              const defaultIgnoreIndexes =
                options?.defaultIgnoreMappings?.[courseCode] ?? [];
              updatedCourses.set(courseCode, {
                index,
                ignoreIndexes: new Set(defaultIgnoreIndexes),
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

          if (updatedPlan.courses.size > Config.limits.coursesInPlan) {
            res = {
              type: "error",
              error: `Importing courses would exceed the course limit (${updatedPlan.courses.size} / ${Config.limits.coursesInPlan})`,
            };
            return {};
          }

          res = {
            type: "success",
          };
          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });

        return res;
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
        let res: ReturnType<TimetableStore["createPlanCopy"]> = {
          type: "error",
          error: "Failed to create plan copy",
        };

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

          if (timetable.plans.size >= Config.limits.plans) {
            res = {
              type: "error",
              error: `Plan limit reached (${timetable.plans.size} / ${Config.limits.plans})`,
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

        return res;
      },
      createPlan: (
        ref: TimetableRef,
        name: string,
        autoSelect: boolean = true
      ) => {
        let res: ReturnType<TimetableStore["createPlan"]> = {
          type: "error",
          error: "Failed to create plan",
        };
        set((state) => {
          const timetableId = ref.timetableId;
          const timetable = state.timetables.get(timetableId);
          if (!timetable) {
            res = {
              type: "error",
              error: "Timetable not found",
            };
            return {};
          }

          if (timetable.plans.size >= Config.limits.plans) {
            res = {
              type: "error",
              error: `Plan limit reached (${timetable.plans.size} / ${Config.limits.plans})`,
            };
            return {};
          }

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

          res = {
            type: "success",
            planId: updatedPlan.id,
          };

          return {
            timetables: state.timetables.set(ref.timetableId, updatedTimetable),
          };
        });

        return res;
      },
    }),
    { name: "timetables", storage }
  )
);
