"use client";
import { useShallow } from "zustand/react/shallow";
import { useTimetableGeneratorStore } from "./timetable-generator-store";
import { SelectGeneratorCombobox } from "./select-generator-combobox";
import { useEffect, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  RotateCcwIcon,
  Undo2Icon,
  UndoIcon,
} from "lucide-react";
import { Button } from "../ui/button";
import { formatDuration } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { trpc } from "@/server/client";
import { useMutation } from "@tanstack/react-query";
import {
  PlanId,
  TimetableId,
  TimetablePlanRef,
  useTimetableStore,
} from "./timetable-store";
import {
  GeneratedTimetable,
  GeneratedTimetableWithScore,
} from "@/generator/genetic-generator";
import { nanoid } from "nanoid";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTimetableGeneratorUndoStore } from "./timetable-generator-undo-store";
import {
  ClassDistributionView,
  ConsecutiveClassesFactorView,
  DayDurationFactorView,
  GapsBetweenClassesFactorView,
  SkippableClassTypesView,
  StartAfterTimeView,
} from "./timetable-generator-factors";

function LastGeneratedView({ lastGenerated }: { lastGenerated: Date }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-sm text-neutral-500">
      Last Generated{" "}
      {formatDuration(
        Math.round((now.getTime() - lastGenerated.getTime()) / 1000)
      )}{" "}
      Ago
    </p>
  );
}

function GeneratorUndoButton({
  timetableId,
  selectedPlanId,
}: {
  timetableId: TimetableId;
  selectedPlanId: PlanId;
}) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      return {
        selectCourseIndexes: state.selectCourseIndexes,
      };
    })
  );
  const timetableGeneratorUndoStore = useTimetableGeneratorUndoStore(
    useShallow((state) => {
      const timetableUndoStates = state.undoStates.get(timetableId);
      if (!timetableUndoStates) return null;
      const planUndoStates = timetableUndoStates.get(selectedPlanId);
      if (!planUndoStates) return null;
      return {
        pop: state.pop,
        hasUndoStates: planUndoStates.length > 0,
      };
    })
  );
  return (
    <Button
      variant="secondary"
      size="icon"
      disabled={!timetableGeneratorUndoStore?.hasUndoStates}
      onClick={() => {
        const planUndoStates = timetableGeneratorUndoStore?.pop({
          timetableId,
          planId: selectedPlanId,
        });
        if (!planUndoStates) return;
        timetableStore?.selectCourseIndexes(
          {
            timetableId,
            planId: selectedPlanId,
          },
          Object.entries(planUndoStates.courseIndexSelection).map(
            ([courseCode, index]) => ({
              courseCode,
              index,
            })
          )
        );
      }}
    >
      <Undo2Icon className="w-4 h-4" />
    </Button>
  );
}

function GeneratorApplyToPlan({
  generatedTimetables,
  lastGenerated,
  timetableId,
}: {
  generatedTimetables: GeneratedTimetableWithScore[];
  lastGenerated?: Date;
  timetableId: TimetableId;
}) {
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(timetableId);
      if (!timetable) return null;
      return {
        selectedPlanId: timetable.selectedPlanId,
        selectedPlan: timetable.plans.get(timetable.selectedPlanId),
        selectCourseIndexes: state.selectCourseIndexes,
      };
    })
  );
  const timetableGeneratorUndoStore = useTimetableGeneratorUndoStore(
    useShallow((state) => {
      return {
        pushByRef: state.pushByRef,
      };
    })
  );

  const [page, setPage] = useState(0);
  const numberOfPages = generatedTimetables.length;
  const selectedPage = Math.min(page + 1, numberOfPages);

  const nextPage = () => {
    if (!timetableStore) return;
    const plan = timetableStore.selectedPlan;
    if (!plan) return;

    const newPage = Math.min(page + 1, numberOfPages - 1);
    timetableGeneratorUndoStore.pushByRef({
      timetableId,
      planId: plan.id,
    });
    timetableStore.selectCourseIndexes(
      {
        timetableId,
        planId: plan.id,
      },
      Object.entries(
        generatedTimetables[newPage].timetable.courseIndexSelection
      ).map(([courseCode, index]) => ({
        courseCode,
        index,
      }))
    );
    setPage(newPage);
  };
  const prevPage = () => {
    if (!timetableStore) return;
    const plan = timetableStore.selectedPlan;
    if (!plan) return;

    const newPage = Math.max(page - 1, 0);
    timetableGeneratorUndoStore.pushByRef({
      timetableId,
      planId: plan.id,
    });
    timetableStore.selectCourseIndexes(
      {
        timetableId,
        planId: plan.id,
      },
      Object.entries(
        generatedTimetables[newPage].timetable.courseIndexSelection
      ).map(([courseCode, index]) => ({
        courseCode,
        index,
      }))
    );
    setPage(newPage);
  };

  return (
    <div className="flex flex-col gap-4">
      {!timetableStore?.selectedPlan && (
        <Alert variant="info">
          <AlertTitle>No Plan Selected!</AlertTitle>
          <AlertDescription>
            Please select a plan to apply the generated timetable to.
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-row gap-2 w-full items-center">
        <h3 className="text-sm w-full text-muted-foreground">Apply Plan</h3>
        <Button
          variant="outline"
          size="icon"
          disabled={page <= 0 || !timetableStore?.selectedPlan}
          onClick={prevPage}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Button>

        {generatedTimetables.length > 0 ? (
          <Button
            variant="outline"
            className="w-28"
            disabled={!timetableStore?.selectedPlan}
            onClick={() => {
              if (!timetableStore) return;
              const plan = timetableStore.selectedPlan;
              if (!plan) return;
              timetableGeneratorUndoStore.pushByRef({
                timetableId,
                planId: plan.id,
              });
              timetableStore.selectCourseIndexes(
                {
                  timetableId,
                  planId: plan.id,
                },
                Object.entries(
                  generatedTimetables[page].timetable.courseIndexSelection
                ).map(([courseCode, index]) => ({
                  courseCode,
                  index,
                }))
              );
            }}
          >
            Generated {selectedPage}
          </Button>
        ) : (
          <Button variant="outline" className="w-28" disabled>
            -
          </Button>
        )}

        <Button
          variant="outline"
          size="icon"
          disabled={
            page >= generatedTimetables.length - 1 ||
            !timetableStore?.selectedPlan
          }
          onClick={nextPage}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </Button>
        <GeneratorUndoButton
          timetableId={timetableId}
          selectedPlanId={timetableStore?.selectedPlanId ?? ""}
        />
      </div>
      {lastGenerated && (
        <div className="flex flex-row gap-2 w-full items-center justify-between">
          <LastGeneratedView lastGenerated={lastGenerated} />
          <p className="text-sm text-neutral-500">{numberOfPages} Plans</p>
        </div>
      )}
    </div>
  );
}

function GenerateTimetableSection({
  timetableId,
}: {
  timetableId: TimetableId;
}) {
  const timetableGeneratorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        factors: state.generators.get(state.selectedGeneratorId)?.factors,
        seed: state.seed,
      };
    })
  );
  const timetableStore = useTimetableStore(
    useShallow((state) => {
      const timetable = state.timetables.get(timetableId);
      if (!timetable) return null;

      return {
        selectedPlanId: timetable.selectedPlanId,
        selectedPlan: timetable.plans.get(timetable.selectedPlanId),
        acadYear: timetable.acadYear,
        createPlanCopy: state.createPlanCopy,
        selectCourseIndexes: state.selectCourseIndexes,
      };
    })
  );
  const timetableGeneratorUndoStore = useTimetableGeneratorUndoStore(
    useShallow((state) => {
      return {
        pushByRef: state.pushByRef,
        push: state.push,
      };
    })
  );

  const trpcUtils = trpc.useUtils();

  const generateTimetableRes = useMutation({
    mutationFn: async (options?: {
      ref: TimetablePlanRef;
      type: "copy" | "use";
    }) => {
      if (!timetableStore) return;
      const plan = useTimetableStore
        .getState()
        .timetables.get(timetableId)
        ?.plans.get(timetableStore.selectedPlanId); // timetableStore.selectedPlan;
      if (!plan) return;
      if (!timetableGeneratorStore.factors) return;

      if (plan.courses.size <= 0) {
        return;
      }

      let applyToPlanRef: TimetablePlanRef | null = null;
      if (options) {
        if (options.type === "copy") {
          const copied = timetableStore.createPlanCopy(options.ref);
          if (copied.type === "error") {
            throw new Error(copied.error);
          }

          applyToPlanRef = {
            timetableId: options.ref.timetableId,
            planId: copied.planId,
          };
        } else {
          applyToPlanRef = options.ref;
        }
      }

      const courseCodes = Array.from(plan.courses.keys());
      const response = await trpcUtils.client.getCourseClasses.query({
        courseCodes,
        acadYear: timetableStore.acadYear,
      });
      console.log(response);

      // Filter down ignore indexes.
      for (const courseClasses of Object.values(response)) {
        const ignoreIndexes = plan.courses.get(
          courseClasses.courseCode
        )?.ignoreIndexes;
        if (!ignoreIndexes)
          throw new Error(
            `Course ${courseClasses.courseCode} does not exist in the plan! Please report this!`
          );
        if (courseClasses.indexes.length > 0) {
          courseClasses.indexes = courseClasses.indexes.filter(
            (index) => !ignoreIndexes.has(index.index)
          );
        }
      }

      const now = new Date();
      const result = await new Promise<GeneratedTimetableWithScore[]>(
        (resolve, reject) => {
          try {
            const worker = new Worker(
              new URL("./generate-timetable-worker.ts", import.meta.url)
            );
            worker.onmessage = (
              event: MessageEvent<GeneratedTimetableWithScore[]>
            ) => {
              resolve(event.data);
            };
            worker.onerror = (event: ErrorEvent) => {
              if (event.error instanceof Error) {
                reject(event.error);
              } else {
                reject(
                  new Error(
                    "An unknown error occurred when generating the timetable."
                  )
                );
              }
            };
            worker.postMessage({
              factors: timetableGeneratorStore.factors,
              courses: response,
              seed: timetableGeneratorStore.seed,
            });
          } catch (error) {
            reject(error);
          }
        }
      );
      return {
        key: nanoid(16),
        result,
        now,
        applyToPlanRef,
      };
    },
    onSuccess(data, variables, context) {
      if (data?.applyToPlanRef) {
        const result = data.result;
        if (result.length <= 0) return;
        const topTimetable = result[0];
        // Get currently selected plan as timetable.
        if (variables?.type === "copy") {
          // Empty
          timetableGeneratorUndoStore.push(data.applyToPlanRef, {
            courseIndexSelection: {},
          });
        }
        if (variables?.type === "use") {
          timetableGeneratorUndoStore.pushByRef(variables.ref);
        }
        timetableStore?.selectCourseIndexes(
          data.applyToPlanRef,
          Object.entries(topTimetable.timetable.courseIndexSelection).map(
            ([courseCode, index]) => ({
              courseCode,
              index,
            })
          )
        );
      }
    },
  });

  return (
    <div className="w-full flex flex-col gap-4 px-4 pt-4 pb-2 border-t border-border">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            className="w-full"
            disabled={
              generateTimetableRes.isPending ||
              !timetableStore?.selectedPlan ||
              timetableStore.selectedPlan.courses.size <= 0
            }
          >
            <p>Generate Timetable</p>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {/* <DropdownMenuItem
            onClick={() => {
              generateTimetableRes.mutate(undefined);
            }}
          >
            <div className="flex flex-col justify-center pr-8">
              <p>Generate</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Requires you to manually apply.
              </p>
            </div>
          </DropdownMenuItem> */}
          <DropdownMenuItem
            disabled={!timetableStore?.selectedPlan}
            onClick={() => {
              if (!timetableStore?.selectedPlan) return;
              generateTimetableRes.mutate({
                ref: {
                  timetableId,
                  planId: timetableStore.selectedPlanId,
                },
                type: "use",
              });
            }}
          >
            <div className="flex flex-col justify-center">
              <p>Generate to Current Plan</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Applies top plan to the current plan.
              </p>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!timetableStore?.selectedPlan}
            onClick={() => {
              if (!timetableStore?.selectedPlan) return;
              generateTimetableRes.mutate({
                ref: {
                  timetableId,
                  planId: timetableStore.selectedPlanId,
                },
                type: "copy",
              });
            }}
          >
            <div className="flex flex-col justify-center">
              <p>Generate to Copy of Current Plan</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                Applies top plan to a copy of the current plan.
              </p>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {generateTimetableRes.isError && (
        <Alert variant="error">
          <AlertTitle>
            <p>Error generating timetable</p>
          </AlertTitle>
          <AlertDescription>
            <p>{generateTimetableRes.error.message}</p>
          </AlertDescription>
        </Alert>
      )}
      {generateTimetableRes.isSuccess &&
        (generateTimetableRes.data?.result.length ?? 0) <= 0 && (
          <Alert variant="info">
            <AlertTitle>No Timetables Generated!</AlertTitle>
            <AlertDescription>
              It is unlikely the current selected courses can create a valid
              timetable. Please try:
              <ul className="list-disc list-inside">
                <li>Selecting more indexes for your courses.</li>
                <li>Removing some courses.</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}
      <GeneratorApplyToPlan
        key={generateTimetableRes.data?.key ?? ""}
        generatedTimetables={generateTimetableRes.data?.result ?? []}
        lastGenerated={generateTimetableRes.data?.now}
        timetableId={timetableId}
      />
    </div>
  );
}

export function TimetableGeneratorPanel({
  timetableId,
}: {
  timetableId: TimetableId;
}) {
  const generatorStore = useTimetableGeneratorStore(
    useShallow((state) => {
      return {
        selectedGeneratorId: state.selectedGeneratorId,
        selectedGenerator: state.generators.get(state.selectedGeneratorId),
      };
    })
  );

  return (
    <div className="w-full border border-border bg-card rounded-lg pt-4 pb-0 flex flex-col">
      <h2 className="text-base font-semibold px-4 pb-2">
        2. Configure and Generate
      </h2>
      <div className="flex flex-row gap-2 px-4">
        <SelectGeneratorCombobox />
      </div>
      <div className="flex flex-col w-full py-2 items-center">
        {generatorStore?.selectedGenerator ? (
          <>
            <DayDurationFactorView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <ConsecutiveClassesFactorView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <GapsBetweenClassesFactorView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <StartAfterTimeView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <ClassDistributionView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <SkippableClassTypesView
              generatorId={generatorStore.selectedGeneratorId}
            />
            <GenerateTimetableSection timetableId={timetableId} />
          </>
        ) : (
          <div className="text-base w-full flex flex-col min-h-36 gap-2 items-center justify-center text-muted-foreground text-center max-w-48">
            <p>
              No generator selected. Click{" "}
              <span className="text-primary">Select Generator</span> to select
              one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
