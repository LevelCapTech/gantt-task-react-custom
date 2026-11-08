/**
 * bar-helper の依存線可視候補抽出テスト
 *
 * plan §4.1 / §3.3 の仕様を網羅する
 */
import {
  buildDependencyMaps,
  extractVisibleArrowsFromTasks,
  normalizeTaskDependencies,
} from "../helpers/bar-helper";
import { BarTask } from "../types/bar-task";
import { Task } from "../types/public-types";

/** テスト用 BarTask の最小実装 */
const makeBarTask = (
  id: string,
  index: number,
  outgoing: Array<{ toId: string; type?: string }> = []
): BarTask =>
  ({
    id,
    index,
    type: "task",
    typeInternal: "task",
    name: id,
    start: new Date("2024-01-01"),
    end: new Date("2024-01-10"),
    progress: 0,
    x1: index * 60,
    x2: index * 60 + 60,
    y: index * 32,
    height: 20,
    progressX: 0,
    progressWidth: 0,
    barCornerRadius: 3,
    handleWidth: 8,
    hideChildren: undefined,
    isDisabled: false,
    barChildren: [],
    barDependencyChildren: outgoing.map(({ toId, type }) => ({
      task: { id: toId } as BarTask,
      type: (type ?? "FS") as "FS",
      lagMinutes: 0,
      source: "dependencies" as const,
    })),
    styles: {
      backgroundColor: "",
      backgroundSelectedColor: "",
      progressColor: "",
      progressSelectedColor: "",
    },
  } as BarTask);

describe("buildDependencyMaps", () => {
  it("outgoingEdgeMap が正しく構築される", () => {
    const tasks = [
      makeBarTask("A", 0, [{ toId: "B" }]),
      makeBarTask("B", 1),
    ];
    const maps = buildDependencyMaps(tasks);
    expect(maps.outgoingEdgeMap.get("A")).toHaveLength(1);
    expect(maps.outgoingEdgeMap.get("B")).toBeUndefined();
  });

  it("incomingEdgeMap が正しく構築される", () => {
    const tasks = [
      makeBarTask("A", 0, [{ toId: "B" }]),
      makeBarTask("B", 1),
    ];
    const maps = buildDependencyMaps(tasks);
    expect(maps.incomingEdgeMap.get("B")).toHaveLength(1);
    expect(maps.incomingEdgeMap.get("B")![0].fromId).toBe("A");
    expect(maps.incomingEdgeMap.get("A")).toBeUndefined();
  });

  it("rowIndexMap が正しく構築される", () => {
    const tasks = [makeBarTask("X", 0), makeBarTask("Y", 1)];
    const maps = buildDependencyMaps(tasks);
    expect(maps.rowIndexMap.get("X")).toBe(0);
    expect(maps.rowIndexMap.get("Y")).toBe(1);
  });
});

describe("extractVisibleArrowsFromTasks", () => {
  const tasks = [
    makeBarTask("A", 0, [{ toId: "B" }, { toId: "C" }]),
    makeBarTask("B", 1, [{ toId: "C" }]),
    makeBarTask("C", 2),
    makeBarTask("D", 3, [{ toId: "E" }]),
    makeBarTask("E", 4),
  ];

  it("両端 viewport 内: 1本", () => {
    // A(0) と B(1) が viewport [0,2) 内 → A→B の辺が含まれる
    const maps = buildDependencyMaps(tasks);
    const arrows = extractVisibleArrowsFromTasks(0, 2, tasks, maps);
    const ab = arrows.find(a => a.sourceId === "A" && a.toId === "B");
    expect(ab).toBeDefined();
  });

  it("元のみ可視 (A→C): A が viewport に入り C が外: 1本", () => {
    // viewport [0,1) → A のみ
    const maps = buildDependencyMaps(tasks);
    const arrows = extractVisibleArrowsFromTasks(0, 1, tasks, maps);
    const ac = arrows.find(a => a.sourceId === "A" && a.toId === "C");
    expect(ac).toBeDefined();
  });

  it("先のみ可視 (A→C): C が viewport に入り A が外: 1本", () => {
    // viewport [2,3) → C のみ
    const maps = buildDependencyMaps(tasks);
    const arrows = extractVisibleArrowsFromTasks(2, 3, tasks, maps);
    const ac = arrows.find(a => a.sourceId === "A" && a.toId === "C");
    expect(ac).toBeDefined();
  });

  it("両端不可視: 0本", () => {
    // D(3)→E(4)、viewport [0,2) → D も E も外
    const maps = buildDependencyMaps(tasks);
    const arrows = extractVisibleArrowsFromTasks(0, 2, tasks, maps);
    const de = arrows.find(a => a.sourceId === "D" && a.toId === "E");
    expect(de).toBeUndefined();
  });

  it("重複排除: 同じ辺が出辺・入辺の両方から取れても 1本", () => {
    // A→B は viewStart=0, viewEnd=2 で A の出辺かつ B の入辺
    const maps = buildDependencyMaps(tasks);
    const arrows = extractVisibleArrowsFromTasks(0, 2, tasks, maps);
    const ab = arrows.filter(a => a.sourceId === "A" && a.toId === "B");
    expect(ab).toHaveLength(1);
  });

  it("空配列 → 0本", () => {
    const maps = buildDependencyMaps([]);
    const arrows = extractVisibleArrowsFromTasks(0, 0, [], maps);
    expect(arrows).toHaveLength(0);
  });
});

describe("normalizeTaskDependencies", () => {
  it("type=undefined → FS になる", () => {
    const tasks: Task[] = [
      {
        id: "A",
        name: "A",
        type: "task",
        start: new Date(),
        end: new Date(),
        progress: 0,
        dependencyLinks: [{ taskId: "B" }],
      },
      { id: "B", name: "B", type: "task", start: new Date(), end: new Date(), progress: 0 },
    ];
    const deps = normalizeTaskDependencies(tasks);
    expect(deps[0].type).toBe("FS");
  });

  it("無効な非undefined型は除外される", () => {
    const tasks: Task[] = [
      {
        id: "A",
        name: "A",
        type: "task",
        start: new Date(),
        end: new Date(),
        progress: 0,
        dependencyLinks: [{ taskId: "B", type: "INVALID" as any }],
      },
      { id: "B", name: "B", type: "task", start: new Date(), end: new Date(), progress: 0 },
    ];
    const deps = normalizeTaskDependencies(tasks);
    expect(deps).toHaveLength(0);
  });

  it("存在しない ID は除外される", () => {
    const tasks: Task[] = [
      {
        id: "A",
        name: "A",
        type: "task",
        start: new Date(),
        end: new Date(),
        progress: 0,
        dependencies: ["NONEXISTENT"],
      },
    ];
    const deps = normalizeTaskDependencies(tasks);
    expect(deps).toHaveLength(0);
  });

  it("dependencyLinks が dependencies より優先される（同じ fromId の場合）", () => {
    // A に dependencyLinks=[{taskId:"B", type:"SS"}] と dependencies=["B"] がある場合
    // dependencyLinks が優先されるため dependencies の FS は除外
    const tasks: Task[] = [
      {
        id: "A",
        name: "A",
        type: "task",
        start: new Date(),
        end: new Date(),
        progress: 0,
        dependencyLinks: [{ taskId: "B", type: "SS" }],
        dependencies: ["B"],
      },
      { id: "B", name: "B", type: "task", start: new Date(), end: new Date(), progress: 0 },
    ];
    const deps = normalizeTaskDependencies(tasks);
    // dependencyLinks の SS のみ
    expect(deps).toHaveLength(1);
    expect(deps[0].type).toBe("SS");
    expect(deps[0].source).toBe("dependencyLinks");
  });
});
