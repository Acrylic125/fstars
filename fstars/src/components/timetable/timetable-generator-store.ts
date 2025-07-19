import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import superjson from "superjson";
import { AcadYear, AcadYearSchema, Program, ProgramSchema } from "@/lib/types";
import { nanoid } from "nanoid";
import z from "zod";

export const TimetableGeneratorIdSchema = z.string();

export type TimetableGeneratorId = z.infer<typeof TimetableGeneratorIdSchema>;

export function asPriority(index: number | undefined) {
  if (index === undefined) return "None" as const;
  switch (index) {
    case 0:
      return "None" as const;
    case 1:
      return "Not Preferred" as const;
    case 2:
      return "Preferred" as const;
    case 3:
      return "Important" as const;
    default:
      return "None" as const;
  }
}

export type Priority = ReturnType<typeof asPriority>;

export function asPriorityNumber(priority: Priority) {
  switch (priority) {
    case "None":
      return 0 as const;
    case "Not Preferred":
      return 1 as const;
    case "Preferred":
      return 2 as const;
    case "Important":
      return 3 as const;
    default:
      return 0 as const;
  }
}

export const TimetableGeneratorSchema = z.object({
  id: TimetableGeneratorIdSchema,
  name: z.string(),
  factors: z.object({
    noClassDays: z
      .object({
        priority: z
          .number()
          .min(0)
          .max(3)
          .default(asPriorityNumber("Important")),
      })
      .default({ priority: asPriorityNumber("Important") }),
    consecutiveClasses: z
      .object({
        before1: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Not Preferred")),
        }),
        between1hAnd2h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Not Preferred")),
        }),
        between2hAnd3h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Preferred")),
        }),
        between3hAnd4h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Preferred")),
        }),
        after4h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Not Preferred")),
        }),
      })
      .default({
        before1: { priority: asPriorityNumber("Important") },
        between1hAnd2h: { priority: asPriorityNumber("Preferred") },
        between2hAnd3h: { priority: asPriorityNumber("Not Preferred") },
        between3hAnd4h: { priority: asPriorityNumber("Not Preferred") },
        after4h: { priority: asPriorityNumber("Not Preferred") },
      }),
    gapsBetweenClasses: z
      .object({
        before1: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Important")),
        }),
        between1hAnd2h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Preferred")),
        }),
        between2hAnd3h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Not Preferred")),
        }),
        between3hAnd4h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Not Preferred")),
        }),
        after4h: z.object({
          priority: z
            .number()
            .min(0)
            .max(3)
            .default(asPriorityNumber("Not Preferred")),
        }),
      })
      .default({
        before1: { priority: asPriorityNumber("Important") },
        between1hAnd2h: { priority: asPriorityNumber("Preferred") },
        between2hAnd3h: { priority: asPriorityNumber("Not Preferred") },
        between3hAnd4h: { priority: asPriorityNumber("Not Preferred") },
        after4h: { priority: asPriorityNumber("Not Preferred") },
      }),
    startAfterTime: z
      .object({
        time: z.object({
          hour: z.number().min(0).max(23).default(0),
          minute: z.number().min(0).max(59).default(0),
        }),
        priority: z
          .number()
          .min(0)
          .max(3)
          .default(asPriorityNumber("Preferred")),
      })
      .default({
        time: {
          hour: 8,
          minute: 0,
        },
        priority: asPriorityNumber("Preferred"),
      }),
    endBeforeTime: z
      .object({
        time: z.object({
          hour: z.number().min(0).max(23).default(0),
          minute: z.number().min(0).max(59).default(0),
        }),
        priority: z
          .number()
          .min(0)
          .max(3)
          .default(asPriorityNumber("Preferred")),
      })
      .default({
        time: {
          hour: 17,
          minute: 0,
        },
        priority: asPriorityNumber("Preferred"),
      }),
    matchWithPlan: z
      .object({
        matchWith: z.array(
          z.object({
            name: z.string().default("Imported Plan"),
            selections: z
              .array(
                z
                  .object({
                    courseCode: z.string().default(""),
                    index: z.string().default(""),
                  })
                  .default({
                    courseCode: "",
                    index: "",
                  })
              )
              .default([]),
            priority: z
              .number()
              .min(0)
              .max(3)
              .default(asPriorityNumber("Preferred")),
          })
        ),
      })
      .default({
        matchWith: [],
      }),
  }),
});

export type TimetableGenerator = z.infer<typeof TimetableGeneratorSchema>;

const TimetableGeneratorStateSchema = z.object({
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
        before1: { priority: nonePriority },
        between1hAnd2h: { priority: nonePriority },
        between2hAnd3h: { priority: nonePriority },
        between3hAnd4h: { priority: nonePriority },
        after4h: { priority: nonePriority },
      },
      gapsBetweenClasses: {
        before1: { priority: nonePriority },
        between1hAnd2h: { priority: nonePriority },
        between2hAnd3h: { priority: nonePriority },
        between3hAnd4h: { priority: nonePriority },
        after4h: { priority: nonePriority },
      },
      startAfterTime: {
        time: { hour: 8, minute: 0 },
        priority: nonePriority,
      },
      endBeforeTime: {
        time: { hour: 17, minute: 0 },
        priority: nonePriority,
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
