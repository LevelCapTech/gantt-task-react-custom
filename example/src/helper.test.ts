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

  it("sets all sample tasks to March 2026 based on project start", () => {
    const tasks = initTasks();

    expect(tasks.length).toBeGreaterThan(1);

    tasks.slice(1).forEach((task) => {
      expect(task.start.getFullYear()).toBe(2026);
      expect(task.start.getMonth()).toBe(2);

      if (task.plannedStart) {
        expect(task.plannedStart.getFullYear()).toBe(2026);
        expect(task.plannedStart.getMonth()).toBe(2);
      }
    });
  });
});
