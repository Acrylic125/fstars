import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { nanoid } from "nanoid";
import z from "zod";
import { asPriorityNumber } from "./utils";
import "@/lib/zod";
import { fallback, injectDefaults } from "@/lib/zod";

export const TimetableGeneratorIdSchema = z.string();

export type TimetableGeneratorId = z.infer<typeof TimetableGeneratorIdSchema>;

export const TimetableGeneratorSchema = z.object({
  id: TimetableGeneratorIdSchema,
  name: z.string().default("New Generator").or(fallback("New Generator")),
  factors: injectDefaults(
    z.object({
      noClassDays: z.object({
        priority: z.number().min(0).max(3),
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
      noClassDays: { priority: asPriorityNumber("Important") },
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
});

type TimetableGeneratorState = z.infer<typeof TimetableGeneratorStateSchema>;

export const GeneratorTemplateTypes = ["default", "empty"] as const;

export type GeneratorTemplateType = (typeof GeneratorTemplateTypes)[number];

export const GeneratorTemplateTypeSchema = z.enum(GeneratorTemplateTypes);

type TimetableGeneratorStore = {
  // CRUD for generators.
  deleteGenerator: (id: TimetableGeneratorId, autoSelect?: boolean) => void;
  changeGeneratorName: (id: TimetableGeneratorId, name: string) => void;
  createGeneratorCopy: (id: TimetableGeneratorId, autoSelect?: boolean) => void;
  createGenerator: (
    name: string,
    templateType: GeneratorTemplateType,
    autoSelect?: boolean
  ) => void;
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
      noClassDays: { priority: nonePriority },
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
        set((state) => {
          const newGenerators = new Map(state.generators);
          const generator = state.generators.get(id);
          if (!generator) return state;

          // Deep copy generator.
          const copy = superjson.parse(
            superjson.stringify(generator)
          ) as TimetableGenerator;
          copy.id = nanoid();
          copy.name = `${copy.name} Copy`;
          newGenerators.set(copy.id, copy);
          return {
            generators: newGenerators,
            selectedGeneratorId: autoSelect
              ? copy.id
              : state.selectedGeneratorId,
          };
        });
      },
      createGenerator: (name, templateType, autoSelect = true) => {
        set((state) => {
          const generator = defaultGenerator(nanoid(), name, templateType);
          return {
            generators: new Map(state.generators).set(generator.id, generator),
            selectedGeneratorId: autoSelect
              ? generator.id
              : state.selectedGeneratorId,
          };
        });
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
