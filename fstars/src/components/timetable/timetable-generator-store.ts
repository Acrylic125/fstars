import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { nanoid } from "nanoid";
import z from "zod";
import { asPriorityNumber } from "./utils";
import "@/lib/zod";
import { fallback, injectDefaults } from "@/lib/zod";
import { Config } from "@/lib/config";

export const TimetableGeneratorIdSchema = z.string();

export type TimetableGeneratorId = z.infer<typeof TimetableGeneratorIdSchema>;

export const TimetableGeneratorSchema = z.object({
  id: TimetableGeneratorIdSchema,
  name: z.string().default("New Generator").or(fallback("New Generator")),
  factors: injectDefaults(
    z.object({
      // noClassDays: z.object({
      //   priority: z.number().min(0).max(3),
      // }),
      dayDuration: z.object({
        noClass: z.object({
          priority: z.number().min(0).max(3),
        }),
        below2h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between2hAnd4h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between4hAnd6h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between6hAnd8h: z.object({
          priority: z.number().min(0).max(3),
        }),
        above8h: z.object({
          priority: z.number().min(0).max(3),
        }),
      }),
      consecutiveClasses: z.object({
        before1h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between1hAnd2h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between2hAnd3h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between3hAnd4h: z.object({
          priority: z.number().min(0).max(3),
        }),
        after4h: z.object({
          priority: z.number().min(0).max(3),
        }),
      }),
      gapsBetweenClasses: z.object({
        before1h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between1hAnd2h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between2hAnd3h: z.object({
          priority: z.number().min(0).max(3),
        }),
        between3hAnd4h: z.object({
          priority: z.number().min(0).max(3),
        }),
        after4h: z.object({
          priority: z.number().min(0).max(3),
        }),
      }),
      startAfterAndEndBefore: z.object({
        startAfter: z.object({
          hour: z.number().min(0).max(23),
          minute: z.number().min(0).max(59),
          priority: z.number().min(0).max(3),
        }),
        endBefore: z.object({
          hour: z.number().min(0).max(23),
          minute: z.number().min(0).max(59),
          priority: z.number().min(0).max(3),
        }),
      }),
      classDistribution: z.object({
        distribution: z.enum(["Even", "Skewed"]),
        priority: z.number().min(0).max(3),
      }),
      skippableClassTypes: z.object({
        types: z.array(z.string()),
      }),
      matchWithPlan: z.object({
        matchWith: z.array(
          z.object({
            name: z.string().default("Imported Plan"),
            selections: z.array(
              z.object({
                courseCode: z.string().default(""),
                index: z.string().default(""),
              })
            ),
            priority: z.number().min(0).max(3),
          })
        ),
      }),
    }),
    {
      dayDuration: {
        noClass: { priority: asPriorityNumber("Important") },
        below2h: { priority: asPriorityNumber("Not Preferred") },
        between2hAnd4h: { priority: asPriorityNumber("Preferred") },
        between4hAnd6h: { priority: asPriorityNumber("Preferred") },
        between6hAnd8h: { priority: asPriorityNumber("Preferred") },
        above8h: { priority: asPriorityNumber("Not Preferred") },
      },
      consecutiveClasses: {
        before1h: { priority: asPriorityNumber("Not Preferred") },
        between1hAnd2h: { priority: asPriorityNumber("Not Preferred") },
        between2hAnd3h: { priority: asPriorityNumber("Preferred") },
        between3hAnd4h: { priority: asPriorityNumber("Preferred") },
        after4h: { priority: asPriorityNumber("Not Preferred") },
      },
      gapsBetweenClasses: {
        before1h: { priority: asPriorityNumber("Important") },
        between1hAnd2h: { priority: asPriorityNumber("Preferred") },
        between2hAnd3h: { priority: asPriorityNumber("Not Preferred") },
        between3hAnd4h: { priority: asPriorityNumber("Not Preferred") },
        after4h: { priority: asPriorityNumber("Not Preferred") },
      },
      startAfterAndEndBefore: {
        startAfter: {
          hour: 8,
          minute: 0,
          priority: asPriorityNumber("Preferred"),
        },
        endBefore: {
          hour: 17,
          minute: 0,
          priority: asPriorityNumber("Preferred"),
        },
      },
      classDistribution: {
        distribution: "Even",
        priority: asPriorityNumber("None"),
      },
      skippableClassTypes: {
        types: [],
      },
      matchWithPlan: {
        matchWith: [],
      },
    }
  ),
});

export type TimetableGenerator = z.infer<typeof TimetableGeneratorSchema>;

export const TimetableGeneratorStateSchema = z.object({
  generators: z.map(TimetableGeneratorIdSchema, TimetableGeneratorSchema),
  selectedGeneratorId: TimetableGeneratorIdSchema.default(""),
  seed: z.string().default(nanoid(12)),
});

type TimetableGeneratorState = z.infer<typeof TimetableGeneratorStateSchema>;

export const GeneratorTemplateTypes = ["default", "empty"] as const;

export type GeneratorTemplateType = (typeof GeneratorTemplateTypes)[number];

export const GeneratorTemplateTypeSchema = z.enum(GeneratorTemplateTypes);

type TimetableGeneratorStore = {
  // CRUD for generators.
  deleteGenerator: (id: TimetableGeneratorId, autoSelect?: boolean) => void;
  changeGeneratorName: (id: TimetableGeneratorId, name: string) => void;
  createGeneratorCopy: (
    id: TimetableGeneratorId,
    autoSelect?: boolean
  ) =>
    | {
        type: "success";
        id: TimetableGeneratorId;
      }
    | {
        type: "error";
        error: string;
      };
  createGenerator: (
    name: string,
    templateType: GeneratorTemplateType,
    autoSelect?: boolean
  ) =>
    | {
        type: "success";
        id: TimetableGeneratorId;
      }
    | {
        type: "error";
        error: string;
      };
  importGenerators: (generators: TimetableGenerator[]) =>
    | {
        type: "success";
      }
    | {
        type: "error";
        error: string;
      };
  // Update generator field.
  changeGeneratorField: <T extends keyof TimetableGenerator["factors"]>(
    id: TimetableGeneratorId,
    field: T,
    value: TimetableGenerator["factors"][T]
  ) => void;
  changeSelectedGeneratorId: (id: TimetableGeneratorId) => void;
} & TimetableGeneratorState;

const RawSchema = z.object({
  version: z.number(),
  state: TimetableGeneratorStateSchema,
});

const storage: PersistStorage<TimetableGeneratorStore> = {
  getItem: (name) => {
    console.log(localStorage);
    if (localStorage === undefined) return null;
    const str = localStorage.getItem(name);
    if (!str) return null;
    const raw = superjson.parse(str);
    const res = RawSchema.safeParse(raw);
    if (!res.success) {
      console.error(res.error);
      return null;
    }
    return { state: res.data.state } as { state: TimetableGeneratorStore };
  },
  setItem: (name, value) => {
    localStorage.setItem(name, superjson.stringify(value));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

function defaultGenerator(
  id: TimetableGeneratorId,
  name: string,
  templateType: GeneratorTemplateType = "default"
): TimetableGenerator {
  if (templateType === "default") {
    const generator = TimetableGeneratorSchema.parse({
      id: id,
      name,
      factors: {}, // We will rely on zod to generate the default values.
    });
    return generator;
  }

  const nonePriority = asPriorityNumber("None");
  const generator: TimetableGenerator = {
    id,
    name,
    factors: {
      // noClassDays: { priority: nonePriority },
      dayDuration: {
        noClass: { priority: nonePriority },
        below2h: { priority: nonePriority },
        between2hAnd4h: { priority: nonePriority },
        between4hAnd6h: { priority: nonePriority },
        between6hAnd8h: { priority: nonePriority },
        above8h: { priority: nonePriority },
      },
      consecutiveClasses: {
        before1h: { priority: nonePriority },
        between1hAnd2h: { priority: nonePriority },
        between2hAnd3h: { priority: nonePriority },
        between3hAnd4h: { priority: nonePriority },
        after4h: { priority: nonePriority },
      },
      gapsBetweenClasses: {
        before1h: { priority: nonePriority },
        between1hAnd2h: { priority: nonePriority },
        between2hAnd3h: { priority: nonePriority },
        between3hAnd4h: { priority: nonePriority },
        after4h: { priority: nonePriority },
      },
      startAfterAndEndBefore: {
        startAfter: { hour: 8, minute: 0, priority: nonePriority },
        endBefore: { hour: 17, minute: 0, priority: nonePriority },
      },
      classDistribution: {
        distribution: "Even",
        priority: asPriorityNumber("None"),
      },
      skippableClassTypes: {
        types: [],
      },
      matchWithPlan: {
        matchWith: [],
      },
    },
  };
  return generator;
}

export const useTimetableGeneratorStore = create<TimetableGeneratorStore>()(
  persist(
    (set) => ({
      generators: new Map<TimetableGeneratorId, TimetableGenerator>().set(
        "default",
        defaultGenerator("default", "Default Generator")
      ),
      selectedGeneratorId: "default",
      seed: nanoid(12),
      deleteGenerator: (id, autoSelect = true) => {
        set((state) => {
          const newGenerators = new Map(state.generators);
          newGenerators.delete(id);
          let newSelectedGeneratorId = "";
          if (autoSelect) {
            const newGeneratorIds = Array.from(newGenerators.keys());
            if (newGeneratorIds.length > 0) {
              newSelectedGeneratorId =
                newGeneratorIds[newGeneratorIds.length - 1];
            }
          }
          return {
            generators: newGenerators,
            selectedGeneratorId: newSelectedGeneratorId,
          };
        });
      },
      changeGeneratorName: (id, name) => {
        set((state) => {
          const newGenerators = new Map(state.generators);
          newGenerators.set(id, {
            ...state.generators.get(id)!,
            name,
          });
          return { generators: newGenerators };
        });
      },
      createGeneratorCopy: (id, autoSelect = true) => {
        let res: ReturnType<TimetableGeneratorStore["createGeneratorCopy"]> = {
          type: "error",
          error: "Failed to create generator",
        };
        set((state) => {
          const newGenerators = new Map(state.generators);
          const generator = state.generators.get(id);
          if (!generator) {
            res = {
              type: "error",
              error: "Generator not found",
            };
            return {};
          }

          if (newGenerators.size >= Config.limits.generators) {
            res = {
              type: "error",
              error: `Generator limit reached (${newGenerators.size} / ${Config.limits.generators})`,
            };
            return {};
          }

          // Deep copy generator.
          const copy = superjson.parse(
            superjson.stringify(generator)
          ) as TimetableGenerator;
          copy.id = nanoid();
          copy.name = `${copy.name} Copy`;
          newGenerators.set(copy.id, copy);

          res = {
            type: "success",
            id: copy.id,
          };
          return {
            generators: newGenerators,
            selectedGeneratorId: autoSelect
              ? copy.id
              : state.selectedGeneratorId,
          };
        });

        return res;
      },
      createGenerator: (name, templateType, autoSelect = true) => {
        let res: ReturnType<TimetableGeneratorStore["createGenerator"]> = {
          type: "error",
          error: "Failed to create generator",
        };

        set((state) => {
          if (state.generators.size >= Config.limits.generators) {
            res = {
              type: "error",
              error: `Generator limit reached (${state.generators.size} / ${Config.limits.generators})`,
            };
            return {};
          }

          const generator = defaultGenerator(nanoid(), name, templateType);

          res = {
            type: "success",
            id: generator.id,
          };
          return {
            generators: new Map(state.generators).set(generator.id, generator),
            selectedGeneratorId: autoSelect
              ? generator.id
              : state.selectedGeneratorId,
          };
        });

        return res;
      },
      importGenerators: (generators: TimetableGenerator[]) => {
        let res: ReturnType<TimetableGeneratorStore["importGenerators"]> = {
          type: "error",
          error: "Failed to import generators",
        };
        set((state) => {
          const newGenerators = new Map(state.generators);
          generators.forEach((generator) => {
            newGenerators.set(generator.id, generator);
          });
          if (newGenerators.size > Config.limits.generators) {
            res = {
              type: "error",
              error: `Generator limit reached (${newGenerators.size} / ${Config.limits.generators})`,
            };
            return {};
          }
          res = {
            type: "success",
          };
          return { generators: newGenerators };
        });
        return res;
      },
      changeGeneratorField: <T extends keyof TimetableGenerator["factors"]>(
        id: TimetableGeneratorId,
        field: T,
        value: TimetableGenerator["factors"][T]
      ) => {
        set((state) => {
          const newGenerators = state.generators;
          const generator = newGenerators.get(id);
          if (!generator) return state;
          generator.factors[field] = { ...value };
          return { generators: newGenerators };
        });
      },
      changeSelectedGeneratorId: (id) => {
        set(() => {
          return { selectedGeneratorId: id };
        });
      },
    }),
    { name: "timetable-generators", storage }
  )
);
