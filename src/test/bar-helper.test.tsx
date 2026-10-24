import { convertToBarTasks, normalizeTaskDependencies } from "../helpers/bar-helper";
import { Task } from "../types/public-types";

const dates = [
  new Date("2025-12-31T00:00:00.000Z"),
  new Date("2026-01-01T00:00:00.000Z"),
  new Date("2026-01-02T00:00:00.000Z"),
  new Date("2026-01-03T00:00:00.000Z"),
  new Date("2026-01-04T00:00:00.000Z"),
];

const defaultTask = (id: string): Task => ({
  id,
  name: id,
  type: "task",
  start: new Date("2026-01-01T00:00:00.000Z"),
  end: new Date("2026-01-02T00:00:00.000Z"),
  progress: 0,
});

const toBarTasks = (tasks: Task[]) =>
  convertToBarTasks(
    tasks,
    dates,
    40,
    40,
    20,
    3,
    8,
    false,
    "#1",
    "#2",
    "#3",
    "#4",
    "#5",
    "#6",
    "#7",
    "#8",
    "#9",
    "#10"
  );

describe("bar-helper dependency normalization", () => {
  it("dependencyLinks を優先し、重複/不正/missing id を除外する", () => {
    const tasks: Task[] = [
      defaultTask("A"),
      {
        ...defaultTask("B"),
        dependencies: ["A", "A", "MISSING"],
        dependencyLinks: [
          { taskId: "A", type: "SS", lag: 60 },
          { taskId: "A", type: "SS", lag: 60 },
          { taskId: "A", type: "FF", lag: -30 },
          { taskId: "MISSING", type: "FS", lag: 0 },
          { taskId: "A", type: "INVALID" as any, lag: 0 },
        ],
      },
    ];

    const normalized = normalizeTaskDependencies(tasks);

    expect(normalized).toEqual([
      {
        fromId: "A",
        toId: "B",
        type: "SS",
        lagMinutes: 60,
        source: "dependencyLinks",
      },
      {
        fromId: "A",
        toId: "B",
        type: "FF",
        lagMinutes: -30,
        source: "dependencyLinks",
      },
    ]);
  });

  it("legacy dependencies を FS/lag0 として barChildren と barDependencyChildren に反映する", () => {
    const tasks: Task[] = [
      defaultTask("A"),
      { ...defaultTask("B"), dependencies: ["A"] },
    ];
    const barTasks = toBarTasks(tasks);
    const taskA = barTasks.find(task => task.id === "A");

    expect(taskA?.barChildren.map(task => task.id)).toEqual(["B"]);
    expect(taskA?.barDependencyChildren).toHaveLength(1);
    expect(taskA?.barDependencyChildren[0]).toMatchObject({
      type: "FS",
      lagMinutes: 0,
      source: "dependencies",
      task: { id: "B" },
    });
  });

  it("循環入力でも依存エッジを保持し、クラッシュしない", () => {
    const tasks: Task[] = [
      { ...defaultTask("A"), dependencyLinks: [{ taskId: "A", type: "SF", lag: 15 }] },
      { ...defaultTask("B"), dependencyLinks: [{ taskId: "A", type: "FS", lag: 0 }] },
    ];
    const barTasks = toBarTasks(tasks);
    const taskA = barTasks.find(task => task.id === "A");

    expect(taskA?.barDependencyChildren).toHaveLength(2);
    expect(taskA?.barChildren.map(task => task.id).sort()).toEqual(["A", "B"]);
  });
});
