/**
 * 純関数ベンチマーク: computeVisibleRange / buildDependencyMaps / normalizeTaskDependencies
 *
 * plan §4.2: Jest の通常テスト対象から除外する。手動実行専用。
 * 実行: cd src/test/perf && node -r ts-node/register pure-function-bench.ts
 *
 * このファイルは testPathIgnorePatterns で除外すること。
 */

import {
  computeVisibleRange,
  isVirtualizationEnabled,
} from "../../helpers/virtualization-helper";
import {
  buildDependencyMaps,
  convertToBarTasks,
  normalizeTaskDependencies,
} from "../../helpers/bar-helper";
import { generateBenchmarkData } from "./benchmark-data";
import { sortTasks, removeHiddenTasks } from "../../helpers/other-helper";
import { ViewMode } from "../../types/public-types";
import { ganttDateRange, seedDates } from "../../helpers/date-helper";

const SIZES = [1000, 10000, 50000];
const SEED = 42;
const ROW_HEIGHT = 32;
const GANTT_HEIGHT = 600;
const COLUMN_WIDTH = 60;

const bench = (name: string, fn: () => void, iterations = 30) => {
  // warmup
  for (let i = 0; i < 5; i++) fn();
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    fn();
    times.push(performance.now() - t0);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const p95 = times[Math.floor(times.length * 0.95)];
  console.log(
    `[bench] ${name}: median=${median.toFixed(2)}ms p95=${p95.toFixed(2)}ms (${iterations} runs)`
  );
};

const main = () => {
  console.log("=== pure-function-bench (baseline) ===");
  console.log(`seed=${SEED} rowHeight=${ROW_HEIGHT} ganttHeight=${GANTT_HEIGHT}`);

  for (const size of SIZES) {
    const dataset = generateBenchmarkData(size, SEED);
    const tasks = dataset.tasks;

    bench(`normalizeTaskDependencies N=${size}`, () => {
      normalizeTaskDependencies(tasks);
    });

    // convertToBarTasks には日付配列が必要なため先に計算
    const sortedTasks = removeHiddenTasks(tasks.sort(sortTasks));
    const [startDate, endDate] = ganttDateRange(
      sortedTasks,
      ViewMode.Day,
      1
    );
    const dates = seedDates(startDate, endDate, ViewMode.Day);
    const taskHeight = (ROW_HEIGHT * 60) / 100;

    bench(`convertToBarTasks N=${size}`, () => {
      convertToBarTasks(
        sortedTasks,
        dates,
        COLUMN_WIDTH,
        ROW_HEIGHT,
        taskHeight,
        3,
        8,
        false,
        "#a3a3ff",
        "#8282f5",
        "#b8c2cc",
        "#aeb8c2",
        "#7db59a",
        "#59a985",
        "#fac465",
        "#f7bb53",
        "#f1c453",
        "#f29e4c"
      );
    });

    const barTasks = convertToBarTasks(
      sortedTasks,
      dates,
      COLUMN_WIDTH,
      ROW_HEIGHT,
      taskHeight,
      3,
      8,
      false,
      "#a3a3ff",
      "#8282f5",
      "#b8c2cc",
      "#aeb8c2",
      "#7db59a",
      "#59a985",
      "#fac465",
      "#f7bb53",
      "#f1c453",
      "#f29e4c"
    );

    bench(`buildDependencyMaps N=${size}`, () => {
      buildDependencyMaps(barTasks);
    });

    const dependencyMaps = buildDependencyMaps(barTasks);

    bench(`computeVisibleRange N=${size}`, () => {
      computeVisibleRange(
        barTasks.length,
        0,
        GANTT_HEIGHT,
        ROW_HEIGHT,
        isVirtualizationEnabled(true, GANTT_HEIGHT, ROW_HEIGHT)
      );
    });

    // 可視候補抽出（viewport 中央付近）
    const midScroll = Math.max(
      0,
      barTasks.length * ROW_HEIGHT - GANTT_HEIGHT
    ) / 2;
    const range = computeVisibleRange(
      barTasks.length,
      midScroll,
      GANTT_HEIGHT,
      ROW_HEIGHT,
      true
    );

    // 可視候補抽出を別区間として計測（plan §4.2）
    const { extractVisibleArrowsFromTasks } = require("../../helpers/bar-helper");
    bench(`extractVisibleArrows N=${size} viewRows=${range.viewEnd - range.viewStart}`, () => {
      extractVisibleArrowsFromTasks(
        range.viewStart,
        range.viewEnd,
        barTasks,
        dependencyMaps
      );
    });

    console.log(`  dataset: ${size} tasks, ${dataset.edgeCount} edges`);
  }

  console.log("\n=== 注意 ===");
  console.log(
    "このファイルは baseline 取得専用です。ブラウザ実測は npm run benchmark:large-gantt で実行してください。"
  );
  console.log("実測値は docs/perf/large-scale-virtualization/benchmark-results.csv に保存してください。");
};

main();
