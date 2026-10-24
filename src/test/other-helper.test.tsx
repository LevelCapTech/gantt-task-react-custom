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

  it("再帰で経路が重複展開しても stack overflow にならず、親プロジェクトは残す", () => {
    const project: Task = {
      ...createTask("P"),
      type: "project",
      hideChildren: true,
      dependencies: ["A"],
    };
    const taskA: Task = {
      ...createTask("A"),
      project: "P",
      dependencies: ["B", "C"],
    };
    const taskB: Task = {
      ...createTask("B"),
      project: "P",
      dependencies: ["D"],
    };
    const taskC: Task = {
      ...createTask("C"),
      project: "P",
      dependencies: ["D"],
    };
    const taskD: Task = {
      ...createTask("D"),
      project: "P",
      dependencies: ["E"],
    };
    const taskE: Task = {
      ...createTask("E"),
      project: "P",
      dependencies: ["B", "C"],
    };

    const visible = removeHiddenTasks([project, taskA, taskB, taskC, taskD, taskE]);

    expect(visible.map(task => task.id).sort()).toEqual(["P"]);
  });

  it("折りたたみ対象の project がない場合は依存マップ生成を行わない", () => {
    const taskA: Task = {
      ...createTask("A"),
      dependencies: ["B"],
    };
    const taskB: Task = {
      ...createTask("B"),
      dependencies: ["A"],
    };

    expect(removeHiddenTasks([taskA, taskB])).toEqual([taskA, taskB]);
  });
});
