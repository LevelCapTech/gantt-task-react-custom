/**
 * 大規模タスクのベンチマーク用データ生成ユーティリティ
 *
 * plan §4.2:
 * - 固定 seed=42、基準日 2024-01-01
 * - 1k / 10k / 50k 件
 * - Day 表示、columnWidth=60、rowHeight=32、ganttHeight=600
 * - 約 10% を project、階層最大 3
 * - 各タスクに確率 50% で直前 50 件内の FS 依存 1 本
 * - 1% で長距離先行依存 1 本
 *
 * このファイルは Jest の通常テスト対象から除外する（testPathIgnorePatterns）。
 * 実行: `npm run benchmark:large-gantt`
 */

import { Task } from "../../types/public-types";

/** xorshift32 による決定的擬似乱数生成器 */
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0 || 1;
  }
  next(): number {
    let x = this.state;
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    this.state = x >>> 0;
    return (this.state >>> 0) / 0x100000000;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

export type BenchmarkDataset = {
  tasks: Task[];
  taskCount: number;
  edgeCount: number;
  seed: number;
};

/**
 * ベンチマーク用タスクデータを生成する
 *
 * @param count タスク数（1000 / 10000 / 50000）
 * @param seed  乱数シード（既定 42）
 */
export const generateBenchmarkData = (
  count: number,
  seed = 42
): BenchmarkDataset => {
  const rng = new SeededRandom(seed);
  const baseDate = new Date("2024-01-01");
  const tasks: Task[] = [];
  let edgeCount = 0;

  for (let i = 0; i < count; i++) {
    const isProject = rng.next() < 0.1;
    const startOffsetDays = rng.nextInt(0, 364);
    const isLong = rng.next() < 0.01;
    const durationDays = isLong ? rng.nextInt(180, 365) : rng.nextInt(1, 30);

    const start = new Date(baseDate);
    start.setDate(start.getDate() + startOffsetDays);
    const end = new Date(start);
    end.setDate(end.getDate() + durationDays);

    // 階層構造（最大3階層）
    let projectId: string | undefined;
    if (isProject) {
      projectId = undefined; // root project
    } else if (i > 0) {
      // 直前の project タスクを親とする（最大3階層に収まるよう簡略化）
      const potentialParent = tasks
        .slice(Math.max(0, i - 20), i)
        .find(t => t.type === "project");
      if (potentialParent) {
        projectId = potentialParent.id;
      }
    }

    const dependencies: string[] = [];

    // 50%確率で直前50件内のFS依存1本
    if (i > 0 && rng.next() < 0.5) {
      const maxLookback = Math.min(50, i);
      const depIndex = i - 1 - rng.nextInt(0, maxLookback - 1);
      if (depIndex >= 0 && depIndex < i) {
        dependencies.push(`task-${depIndex}`);
        edgeCount++;
      }
    }

    // 1%確率で長距離先行依存1本
    if (i > 100 && rng.next() < 0.01) {
      const farDepIndex = rng.nextInt(0, i - 51); // 50件以上前
      const depId = `task-${farDepIndex}`;
      // 循環を避ける（単純に depIndex < i なので常に成立）
      if (!dependencies.includes(depId)) {
        dependencies.push(depId);
        edgeCount++;
      }
    }

    const task: Task = {
      id: `task-${i}`,
      name: `Task ${i}`,
      type: isProject ? "project" : "task",
      start,
      end,
      progress: 0,
      displayOrder: i,
      dependencies: dependencies.length > 0 ? dependencies : undefined,
      project: projectId,
      hideChildren: false,
    };

    tasks.push(task);
  }

  return { tasks, taskCount: count, edgeCount, seed };
};

/**
 * データセットのメタ情報を文字列で返す
 */
export const describeDataset = (dataset: BenchmarkDataset): string => {
  return [
    `taskCount=${dataset.taskCount}`,
    `edgeCount=${dataset.edgeCount}`,
    `seed=${dataset.seed}`,
  ].join(", ");
};
