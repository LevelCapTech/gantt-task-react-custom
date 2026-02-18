import { initTasks } from "./helper";

describe("initTasks", () => {
  const baseYear = new Date().getFullYear();

  it("sets the sample project start date to March 1", () => {
    const projectTask = initTasks().find(
      (t) => t.type === "project" || t.id === "ProjectSample",
    );
    expect(projectTask).toBeDefined();
    const plannedStart = projectTask!.plannedStart;
    expect(plannedStart).toBeDefined();

    expect(projectTask!.start.getFullYear()).toBe(baseYear);
    expect(projectTask!.start.getMonth()).toBe(2);
    expect(projectTask!.start.getDate()).toBe(1);
    expect(plannedStart!.getFullYear()).toBe(baseYear);
    expect(plannedStart!.getMonth()).toBe(2);
    expect(plannedStart!.getDate()).toBe(1);
  });

  it("sets all sample tasks to March based on project start", () => {
    const tasks = initTasks();

    expect(tasks.length).toBeGreaterThan(1);

    tasks.slice(1).forEach((task) => {
      expect(task.start.getFullYear()).toBe(baseYear);
      expect(task.start.getMonth()).toBe(2);

      if (task.plannedStart) {
        expect(task.plannedStart.getFullYear()).toBe(baseYear);
        expect(task.plannedStart.getMonth()).toBe(2);
      }
    });
  });
});
