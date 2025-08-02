import { useEffect, useState } from "react";
import { Timetable, TimetableId, useTimetableStore } from "./timetable-store";

export function useTimetableInitialise(
  timetableId: TimetableId,
  onSuccess: (timetable: Timetable) => void
) {
  const [initialLoadInState, setInitialLoadInState] = useState<
    | {
        type: "loading" | "success";
      }
    | {
        type: "error";
        error: string;
      }
  >({
    type: "loading",
  });

  useEffect(() => {
    const currentTimetable = useTimetableStore
      .getState()
      .timetables.get(timetableId);
    if (!currentTimetable) {
      setInitialLoadInState({
        type: "error",
        error: "Timetable not found",
      });
      return;
    }
    onSuccess(currentTimetable);
    // form.reset({
    //   programs: currentTimetable.programs,
    //   name: currentTimetable.name,
    // });
    setInitialLoadInState({
      type: "success",
    });
  }, [timetableId, setInitialLoadInState]);

  return {
    initialLoadInState,
  };
}
