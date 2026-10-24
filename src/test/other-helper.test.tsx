import { removeHiddenTasks } from "../helpers/other-helper";
import { Task } from "../types/public-types";

const createTask = (id: string): Task => ({
  id,
  name: id,
  type: "task",
  start: new Date("2026-01-01T00:00:00.000Z"),
  end: new Date("2026-01-02T00:00:00.000Z"),
  progress: 0,
});

describe("other-helper removeHiddenTasks", () => {
  it("循環依存があっても折りたたみが停止し、後続を非表示化できる", () => {
    const project: Task = {
      ...createTask("P"),
      type: "project",
      hideChildren: true,
    };
    const taskA: Task = {
      ...createTask("A"),
      project: "P",
      dependencyLinks: [{ taskId: "C", type: "FS", lag: 0 }],
    };
    const taskB: Task = {
      ...createTask("B"),
      project: "P",
      dependencyLinks: [{ taskId: "A", type: "SS", lag: 0 }],
    };
    const taskC: Task = {
      ...createTask("C"),
      project: "P",
      dependencyLinks: [{ taskId: "B", type: "FF", lag: 0 }],
    };
    const outside: Task = createTask("OUT");

    const visible = removeHiddenTasks([project, taskA, taskB, taskC, outside]);

    expect(visible.map(task => task.id).sort()).toEqual(["OUT", "P"]);
  });
});
