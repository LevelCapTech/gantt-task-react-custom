import {
  applyIndentSteps,
  findDescendantIds,
  getTaskLevel,
  indentTask,
  moveTaskWithChildren,
  outdentTask,
} from "./task-hierarchy";
import { Task } from "../types/public-types";

const baseTask = (overrides: Partial<Task>): Task => ({
  id: "t",
  name: "task",
  type: "task",
  start: new Date("2023-01-01"),
  end: new Date("2023-01-02"),
  progress: 0,
  ...overrides,
});

describe("task-hierarchy utilities", () => {
  it("moves a task together with its descendants", () => {
    const tasks = [
      baseTask({ id: "A", type: "project" }),
      baseTask({ id: "A-1", project: "A" }),
      baseTask({ id: "B" }),
    ];

    const result = moveTaskWithChildren(tasks, "A", "B");

    expect(result.map(t => t.id)).toEqual(["B", "A", "A-1"]);
    expect(result.find(t => t.id === "A-1")?.project).toBe("A");
  });

  it("keeps descendant lookup recursive", () => {
    const tasks = [
      baseTask({ id: "root", type: "project" }),
      baseTask({ id: "child", project: "root" }),
      baseTask({ id: "grandchild", project: "child" }),
    ];
    expect(findDescendantIds(tasks, "root")).toEqual(["child", "grandchild"]);
  });

  it("indents a task under its previous sibling", () => {
    const tasks = [baseTask({ id: "A" }), baseTask({ id: "B" })];
    const result = indentTask(tasks, "B");
    expect(result.find(t => t.id === "B")?.project).toBe("A");
  });

  it("outdents a task to its grandparent", () => {
    const tasks = [
      baseTask({ id: "A", type: "project" }),
      baseTask({ id: "B", project: "A" }),
    ];
    const result = outdentTask(tasks, "B");
    expect(result.find(t => t.id === "B")?.project).toBeUndefined();
  });

  it("applies multiple indent steps sequentially", () => {
    const tasks = [
      baseTask({ id: "A" }),
      baseTask({ id: "B" }),
      baseTask({ id: "C" }),
    ];
    const result = applyIndentSteps(tasks, "C", 2);
    expect(result.find(t => t.id === "C")?.project).toBe("B");
  });

  it("calculates task level from parent chain", () => {
    const tasks = [
      baseTask({ id: "A", type: "project" }),
      baseTask({ id: "B", project: "A" }),
      baseTask({ id: "C", project: "B" }),
    ];
    expect(getTaskLevel(tasks, "C")).toBe(2);
  });
});
