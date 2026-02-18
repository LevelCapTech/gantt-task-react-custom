import { initTasks } from "./helper";

describe("initTasks", () => {
  const fixedNow = new Date("2026-02-15T00:00:00.000Z");

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(fixedNow);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("sets the sample project start date to March 1", () => {
    const projectTask = initTasks().find(
      (t) => t.type === "project" || t.id === "ProjectSample",
    );
    expect(projectTask).toBeDefined();
    const plannedStart = projectTask!.plannedStart!;

    expect(projectTask!.start.getFullYear()).toBe(2026);
    expect(projectTask!.start.getMonth()).toBe(2);
    expect(projectTask!.start.getDate()).toBe(1);
    expect(plannedStart.getMonth()).toBe(2);
    expect(plannedStart.getDate()).toBe(1);
  });
});
