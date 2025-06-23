import { evaluateTimetable } from "./planner-2";

describe("evaluateTimetable", () => {
  it("should return 0 if the timetable is empty", () => {
    expect(
      evaluateTimetable({
        courses: {},
      })
    ).toBe(0);
  });

  it("should return -1 if the timetable has collisions", () => {
    expect(
      evaluateTimetable({
        courses: {
          SC2001: {
            index: "1",
            timeslots: [
              {
                day: "MON",
                from: { hour: 10, minute: 0 },
                to: { hour: 11, minute: 0 },
                type: "LEC",
              },
            ],
          },
          SC2005: {
            index: "1",
            timeslots: [
              {
                day: "MON",
                from: { hour: 10, minute: 0 },
                to: { hour: 12, minute: 0 },
                type: "LEC",
              },
            ],
          },
        },
      })
    ).toBe(-1);

    expect(
      evaluateTimetable({
        courses: {
          SC2001: {
            index: "1",
            timeslots: [
              {
                day: "MON",
                from: { hour: 10, minute: 0 },
                to: { hour: 11, minute: 0 },
                type: "LEC",
              },
            ],
          },
          SC2005: {
            index: "1",
            timeslots: [
              {
                day: "MON",
                from: { hour: 10, minute: 0 },
                to: { hour: 11, minute: 0 },
                type: "LEC",
              },
            ],
          },
        },
      })
    ).toBe(-1);
  });
});
