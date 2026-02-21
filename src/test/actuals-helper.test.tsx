import { normalizeActuals, roundEffortToQuarterHour } from "../helpers/actuals-helper";
import { Task } from "../types/public-types";

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  name: "Task 1",
  start: new Date(2026, 0, 6, 9, 0),
  end: new Date(2026, 0, 6, 17, 0),
  progress: 0,
  type: "task",
  ...overrides,
});

describe("normalizeActuals", () => {
  it("recalculates effort from start/end when inconsistent", () => {
    const task = createTask({
      start: new Date(2026, 0, 6, 9, 0),
      end: new Date(2026, 0, 6, 11, 0),
      actualEffort: 1,
    });
    const normalized = normalizeActuals(task);
    expect(normalized.actualEffort).toBe(2);
  });

  it("derives end from start and effort with rounding", () => {
    const task = createTask({
      end: new Date("invalid"),
      actualEffort: 3.13,
    });
    const normalized = normalizeActuals(task);
    expect(normalized.actualEffort).toBe(3.25);
    expect(normalized.end.getHours()).toBe(12);
    expect(normalized.end.getMinutes()).toBe(15);
  });

  it("derives start from end and effort", () => {
    const task = createTask({
      start: new Date("invalid"),
      end: new Date(2026, 0, 6, 18, 0),
      actualEffort: 2,
    });
    const normalized = normalizeActuals(task);
    expect(normalized.start.getHours()).toBe(16);
    expect(normalized.start.getMinutes()).toBe(0);
  });

  it("is idempotent when applied multiple times", () => {
    const task = createTask({
      end: new Date("invalid"),
      actualEffort: 1.13,
    });
    const normalized = normalizeActuals(task);
    const normalizedAgain = normalizeActuals(normalized);
    expect(normalizedAgain.end.getTime()).toBe(normalized.end.getTime());
    expect(normalizedAgain.actualEffort).toBe(normalized.actualEffort);
  });

  it("reflects workHoursPerDay differences when deriving end", () => {
    const base = {
      start: new Date(2026, 0, 5, 9, 0),
      end: new Date("invalid"),
      actualEffort: 7,
    };
    const endFor6 = normalizeActuals(createTask(base), { workHoursPerDay: 6 }).end;
    const endFor8 = normalizeActuals(createTask(base), { workHoursPerDay: 8 }).end;
    const endFor10 = normalizeActuals(createTask(base), { workHoursPerDay: 10 }).end;
    expect(endFor6.getDate()).toBe(6);
    expect(endFor6.getHours()).toBe(10);
    expect(endFor8.getDate()).toBe(5);
    expect(endFor8.getHours()).toBe(17);
    expect(endFor10.getDate()).toBe(5);
    expect(endFor10.getHours()).toBe(16);
  });

  it("keeps derived end within custom workday window", () => {
    const task = createTask({
      start: new Date(2026, 0, 6, 18, 30),
      end: new Date("invalid"),
      actualEffort: 1,
    });
    const normalized = normalizeActuals(task, {
      workdayStartTime: "10:00",
      workdayEndTime: "19:00",
    });
    expect(normalized.end.getDate()).toBe(7);
    expect(normalized.end.getHours()).toBe(10);
    expect(normalized.end.getMinutes()).toBe(30);
  });
});

describe("roundEffortToQuarterHour", () => {
  it("rounds to 0.25h with round-half-up", () => {
    expect(roundEffortToQuarterHour(1.12)).toBe(1);
    expect(roundEffortToQuarterHour(1.13)).toBe(1.25);
    expect(roundEffortToQuarterHour(1.37)).toBe(1.25);
    expect(roundEffortToQuarterHour(1.38)).toBe(1.5);
    expect(roundEffortToQuarterHour(1.124)).toBe(1);
    expect(roundEffortToQuarterHour(1.125)).toBe(1.25);
    expect(roundEffortToQuarterHour(1.126)).toBe(1.25);
  });
});

describe("normalizeActuals warnings", () => {
  it("warns once when workHoursPerDay exceeds window", () => {
    jest.isolateModules(() => {
      const { normalizeActuals: normalize } =
        require("../helpers/actuals-helper") as typeof import("../helpers/actuals-helper");
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      try {
        const task: Task = {
          id: "task-2",
          name: "Task 2",
          start: new Date(2026, 0, 6, 9, 0),
          end: new Date(2026, 0, 6, 18, 0),
          progress: 0,
          type: "task",
          actualEffort: 4,
        };
        normalize(task, { workHoursPerDay: 12 });
        normalize(task, { workHoursPerDay: 12 });
        expect(warnSpy).toHaveBeenCalledTimes(1);
      } finally {
        warnSpy.mockRestore();
      }
    });
  });
});
