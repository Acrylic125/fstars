import { create } from "zustand";
import {
  PlanId,
  TimetableId,
  TimetablePlanRef,
  useTimetableStore,
} from "./timetable-store";
import { GeneratedTimetable } from "@/generator/genetic-generator";

export type TimetableGeneratorUndoStore = {
  undoStates: Map<TimetableId, Map<PlanId, GeneratedTimetable[]>>;
  push: (ref: TimetablePlanRef, timetable: GeneratedTimetable) => void;
  pop: (ref: TimetablePlanRef) => GeneratedTimetable | null;
  pushByRef: (ref: TimetablePlanRef) => void;
};

export const useTimetableGeneratorUndoStore =
  create<TimetableGeneratorUndoStore>()((set) => ({
    undoStates: new Map(),
    push: (ref, timetable) => {
      set((state) => {
        const timetableUndoStates = state.undoStates.get(ref.timetableId);
        if (!timetableUndoStates) {
          state.undoStates.set(
            ref.timetableId,
            new Map([[ref.planId, [timetable]]])
          );
        } else {
          const planUndoStates = timetableUndoStates.get(ref.planId);
          if (!planUndoStates) {
            timetableUndoStates.set(ref.planId, [timetable]);
          } else {
            timetableUndoStates.set(ref.planId, [...planUndoStates, timetable]);
          }
        }
        return { undoStates: state.undoStates };
      });
    },
    pushByRef: (ref) => {
      set((state) => {
        const currentPlan = useTimetableStore
          .getState()
          .timetables.get(ref.timetableId)
          ?.plans.get(ref.planId);
        if (!currentPlan) {
          return {};
        }

        const planAsTimetable: GeneratedTimetable = {
          courseIndexSelection: Object.fromEntries(
            currentPlan.courses
              .entries()
              .map(([courseCode, course]) => [courseCode, course.index])
          ),
        };

        const timetableUndoStates = state.undoStates.get(ref.timetableId);
        if (!timetableUndoStates) {
          state.undoStates.set(
            ref.timetableId,
            new Map([[ref.planId, [planAsTimetable]]])
          );
        } else {
          const planUndoStates = timetableUndoStates.get(ref.planId);
          if (!planUndoStates) {
            timetableUndoStates.set(ref.planId, [planAsTimetable]);
          } else {
            timetableUndoStates.set(ref.planId, [
              ...planUndoStates,
              planAsTimetable,
            ]);
          }
        }
        return { undoStates: state.undoStates };
      });
    },
    pop: (ref) => {
      let lastTimetable: GeneratedTimetable | null = null;
      set((state) => {
        const timetableUndoStates = state.undoStates.get(ref.timetableId);
        if (!timetableUndoStates) {
          return {};
        }
        const planUndoStates = timetableUndoStates.get(ref.planId);
        if (!planUndoStates) {
          return {};
        }

        lastTimetable = planUndoStates.pop() ?? null;
        if (lastTimetable) {
          timetableUndoStates.set(ref.planId, [...planUndoStates]);
        } else {
          timetableUndoStates.delete(ref.planId);
        }

        return {
          undoStates: state.undoStates,
        };
      });
      return lastTimetable;
    },
  }));
