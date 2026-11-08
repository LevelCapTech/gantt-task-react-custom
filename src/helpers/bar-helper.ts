import {
  DependencyType,
  Task,
  TaskDependencyLink,
} from "../types/public-types";
import {
  BarTask,
  BarTaskDependencyEdge,
  TaskTypeInternal,
} from "../types/bar-task";
import { BarMoveAction } from "../types/gantt-task-actions";

/**
 * 可視候補の依存線を一意に識別するキー
 */
export type VisibleArrowKey = string;

/**
 * 可視候補の依存線情報
 */
export type VisibleArrow = {
  sourceId: string;
  toId: string;
  type: DependencyType;
  lagMinutes: number;
};

const makeArrowKey = (a: VisibleArrow): VisibleArrowKey =>
  `${a.sourceId}::${a.toId}::${a.type}::${a.lagMinutes}`;

/**
 * barTasks から出辺索引・入辺索引・行番号索引を構築する
 *
 * plan §3.3: 依存正規化/BarTask 変換時に一度構築し、スクロールごとに再走査しない。
 */
export type DependencyMaps = {
  /** fromId -> エッジリスト（出辺） */
  outgoingEdgeMap: Map<string, BarTaskDependencyEdge[]>;
  /** toId -> fromId のエッジリスト（入辺） */
  incomingEdgeMap: Map<string, { fromId: string; edge: BarTaskDependencyEdge }[]>;
  /** task.id -> 表示行番号 */
  rowIndexMap: Map<string, number>;
};

/**
 * BarTask 配列から依存Mapを構築する
 */
export const buildDependencyMaps = (barTasks: BarTask[]): DependencyMaps => {
  const outgoingEdgeMap = new Map<string, BarTaskDependencyEdge[]>();
  const incomingEdgeMap = new Map<
    string,
    { fromId: string; edge: BarTaskDependencyEdge }[]
  >();
  const rowIndexMap = new Map<string, number>();

  barTasks.forEach((task, index) => {
    rowIndexMap.set(task.id, index);
    task.barDependencyChildren.forEach(edge => {
      // 出辺
      const out = outgoingEdgeMap.get(task.id) ?? [];
      out.push(edge);
      outgoingEdgeMap.set(task.id, out);
      // 入辺
      const inc = incomingEdgeMap.get(edge.task.id) ?? [];
      inc.push({ fromId: task.id, edge });
      incomingEdgeMap.set(edge.task.id, inc);
    });
  });

  return { outgoingEdgeMap, incomingEdgeMap, rowIndexMap };
};

/**
 * barTasks 配列と viewStart/viewEnd から可視候補の依存線を抽出する
 */
export const extractVisibleArrowsFromTasks = (
  viewStart: number,
  viewEnd: number,
  barTasks: BarTask[],
  dependencyMaps: DependencyMaps
): VisibleArrow[] => {
  const { outgoingEdgeMap, incomingEdgeMap } = dependencyMaps;
  const seen = new Set<VisibleArrowKey>();
  const result: VisibleArrow[] = [];

  const addArrow = (a: VisibleArrow) => {
    const key = makeArrowKey(a);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(a);
    }
  };

  for (let row = viewStart; row < viewEnd; row++) {
    const task = barTasks[row];
    if (!task) {
      continue;
    }
    const id = task.id;

    // 出辺
    (outgoingEdgeMap.get(id) ?? []).forEach(edge => {
      addArrow({
        sourceId: id,
        toId: edge.task.id,
        type: edge.type,
        lagMinutes: edge.lagMinutes,
      });
    });

    // 入辺
    (incomingEdgeMap.get(id) ?? []).forEach(({ fromId, edge }) => {
      addArrow({
        sourceId: fromId,
        toId: id,
        type: edge.type,
        lagMinutes: edge.lagMinutes,
      });
    });
  }

  return result;
};

const DEPENDENCY_TYPE_SET: Record<DependencyType, true> = {
  FS: true,
  SS: true,
  FF: true,
  SF: true,
};

export type NormalizedDependency = {
  fromId: string;
  toId: string;
  type: DependencyType;
  lagMinutes: number;
  source: "dependencies" | "dependencyLinks";
};

const isValidDependencyType = (
  type: TaskDependencyLink["type"]
): type is DependencyType => {
  return !!type && !!DEPENDENCY_TYPE_SET[type];
};

const normalizeDependencyLink = (
  link: TaskDependencyLink,
  fromId: string,
  toId: string,
  source: "dependencyLinks"
): NormalizedDependency | null => {
  if (!isValidDependencyType(link.type) && link.type !== undefined) {
    return null;
  }
  if (link.lag !== undefined && !Number.isFinite(link.lag)) {
    return null;
  }
  return {
    fromId,
    toId,
    type: link.type ?? "FS",
    lagMinutes: link.lag ?? 0,
    source,
  };
};

const dependencyKey = (dependency: NormalizedDependency) => {
  return `${dependency.fromId}::${dependency.toId}::${dependency.type}::${dependency.lagMinutes}`;
};

export const normalizeTaskDependencies = (tasks: Task[]) => {
  const taskIds = new Set(tasks.map(task => task.id));
  const normalizedDependencies: NormalizedDependency[] = [];
  const dedupe = new Set<string>();

  tasks.forEach(task => {
    const toId = task.id;
    const dependencyLinks = task.dependencyLinks || [];
    const prioritizedFromIds = new Set(
      dependencyLinks
        .map(link => link.taskId)
        .filter((id): id is string => !!id && typeof id === "string")
    );

    dependencyLinks.forEach(link => {
      if (!link.taskId || !taskIds.has(link.taskId)) {
        return;
      }
      const normalized = normalizeDependencyLink(
        link,
        link.taskId,
        toId,
        "dependencyLinks"
      );
      if (!normalized) {
        return;
      }
      const key = dependencyKey(normalized);
      if (dedupe.has(key)) {
        return;
      }
      dedupe.add(key);
      normalizedDependencies.push(normalized);
    });

    (task.dependencies || []).forEach(dependencyId => {
      if (!dependencyId || prioritizedFromIds.has(dependencyId)) {
        return;
      }
      if (!taskIds.has(dependencyId)) {
        return;
      }
      const normalized: NormalizedDependency = {
        fromId: dependencyId,
        toId,
        type: "FS",
        lagMinutes: 0,
        source: "dependencies",
      };
      const key = dependencyKey(normalized);
      if (dedupe.has(key)) {
        return;
      }
      dedupe.add(key);
      normalizedDependencies.push(normalized);
    });
  });

  return normalizedDependencies;
};

export const convertToBarTasks = (
  tasks: Task[],
  dates: Date[],
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  rtl: boolean,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  projectProgressColor: string,
  projectProgressSelectedColor: string,
  projectBackgroundColor: string,
  projectBackgroundSelectedColor: string,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
) => {
  let barTasks = tasks.map((t, i) => {
    return convertToBarTask(
      t,
      i,
      dates,
      columnWidth,
      rowHeight,
      taskHeight,
      barCornerRadius,
      handleWidth,
      rtl,
      barProgressColor,
      barProgressSelectedColor,
      barBackgroundColor,
      barBackgroundSelectedColor,
      projectProgressColor,
      projectProgressSelectedColor,
      projectBackgroundColor,
      projectBackgroundSelectedColor,
      milestoneBackgroundColor,
      milestoneBackgroundSelectedColor
    );
  });

  const barTaskMap = new Map(barTasks.map(task => [task.id, task]));
  const normalizedDependencies = normalizeTaskDependencies(tasks);
  const childrenMap = new Map<string, Map<string, BarTask>>();
  const edgeMap = new Map<string, BarTaskDependencyEdge[]>();

  normalizedDependencies.forEach(dependency => {
    const fromTask = barTaskMap.get(dependency.fromId);
    const toTask = barTaskMap.get(dependency.toId);
    if (!fromTask || !toTask) {
      return;
    }
    const childTaskMap = childrenMap.get(fromTask.id) ?? new Map();
    childTaskMap.set(toTask.id, toTask);
    childrenMap.set(fromTask.id, childTaskMap);

    const edges = edgeMap.get(fromTask.id) ?? [];
    edges.push({
      task: toTask,
      type: dependency.type,
      lagMinutes: dependency.lagMinutes,
      source: dependency.source,
    });
    edgeMap.set(fromTask.id, edges);
  });

  barTasks = barTasks.map(task => ({
    ...task,
    barChildren: Array.from(childrenMap.get(task.id)?.values() ?? []),
    barDependencyChildren: edgeMap.get(task.id) ?? [],
  }));

  return barTasks;
};

const convertToBarTask = (
  task: Task,
  index: number,
  dates: Date[],
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  rtl: boolean,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string,
  projectProgressColor: string,
  projectProgressSelectedColor: string,
  projectBackgroundColor: string,
  projectBackgroundSelectedColor: string,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
): BarTask => {
  let barTask: BarTask;
  switch (task.type) {
    case "milestone":
      barTask = convertToMilestone(
        task,
        index,
        dates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        milestoneBackgroundColor,
        milestoneBackgroundSelectedColor
      );
      break;
    case "project":
      barTask = convertToBar(
        task,
        index,
        dates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        rtl,
        projectProgressColor,
        projectProgressSelectedColor,
        projectBackgroundColor,
        projectBackgroundSelectedColor
      );
      break;
    default:
      barTask = convertToBar(
        task,
        index,
        dates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        rtl,
        barProgressColor,
        barProgressSelectedColor,
        barBackgroundColor,
        barBackgroundSelectedColor
      );
      break;
  }
  return barTask;
};

const convertToBar = (
  task: Task,
  index: number,
  dates: Date[],
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  rtl: boolean,
  barProgressColor: string,
  barProgressSelectedColor: string,
  barBackgroundColor: string,
  barBackgroundSelectedColor: string
): BarTask => {
  let x1: number;
  let x2: number;
  if (rtl) {
    x2 = taskXCoordinateRTL(task.start, dates, columnWidth);
    x1 = taskXCoordinateRTL(task.end, dates, columnWidth);
  } else {
    x1 = taskXCoordinate(task.start, dates, columnWidth);
    x2 = taskXCoordinate(task.end, dates, columnWidth);
  }
  let typeInternal: TaskTypeInternal = task.type;
  if (typeInternal === "task" && x2 - x1 < handleWidth * 2) {
    typeInternal = "smalltask";
    x2 = x1 + handleWidth * 2;
  }

  const [progressWidth, progressX] = progressWithByParams(
    x1,
    x2,
    task.progress,
    rtl
  );
  const y = taskYCoordinate(index, rowHeight, taskHeight);
  const hideChildren = task.type === "project" ? task.hideChildren : undefined;

  const styles = {
    backgroundColor: barBackgroundColor,
    backgroundSelectedColor: barBackgroundSelectedColor,
    progressColor: barProgressColor,
    progressSelectedColor: barProgressSelectedColor,
    ...task.styles,
  };
  return {
    ...task,
    typeInternal,
    x1,
    x2,
    y,
    index,
    progressX,
    progressWidth,
    barCornerRadius,
    handleWidth,
    hideChildren,
    height: taskHeight,
    barChildren: [],
    barDependencyChildren: [],
    styles,
  };
};

const convertToMilestone = (
  task: Task,
  index: number,
  dates: Date[],
  columnWidth: number,
  rowHeight: number,
  taskHeight: number,
  barCornerRadius: number,
  handleWidth: number,
  milestoneBackgroundColor: string,
  milestoneBackgroundSelectedColor: string
): BarTask => {
  const x = taskXCoordinate(task.start, dates, columnWidth);
  const y = taskYCoordinate(index, rowHeight, taskHeight);

  const x1 = x - taskHeight * 0.5;
  const x2 = x + taskHeight * 0.5;

  const rotatedHeight = taskHeight / 1.414;
  const styles = {
    backgroundColor: milestoneBackgroundColor,
    backgroundSelectedColor: milestoneBackgroundSelectedColor,
    progressColor: "",
    progressSelectedColor: "",
    ...task.styles,
  };
  return {
    ...task,
    end: task.start,
    x1,
    x2,
    y,
    index,
    progressX: 0,
    progressWidth: 0,
    barCornerRadius,
    handleWidth,
    typeInternal: task.type,
    progress: 0,
    height: rotatedHeight,
    hideChildren: undefined,
    barChildren: [],
    barDependencyChildren: [],
    styles,
  };
};

const taskXCoordinate = (xDate: Date, dates: Date[], columnWidth: number) => {
  const index = dates.findIndex(d => d.getTime() >= xDate.getTime()) - 1;

  const remainderMillis = xDate.getTime() - dates[index].getTime();
  const percentOfInterval =
    remainderMillis / (dates[index + 1].getTime() - dates[index].getTime());
  const x = index * columnWidth + percentOfInterval * columnWidth;
  return x;
};
const taskXCoordinateRTL = (
  xDate: Date,
  dates: Date[],
  columnWidth: number
) => {
  let x = taskXCoordinate(xDate, dates, columnWidth);
  x += columnWidth;
  return x;
};
const taskYCoordinate = (
  index: number,
  rowHeight: number,
  taskHeight: number
) => {
  const y = index * rowHeight + (rowHeight - taskHeight) / 2;
  return y;
};

export const progressWithByParams = (
  taskX1: number,
  taskX2: number,
  progress: number,
  rtl: boolean
) => {
  const progressWidth = (taskX2 - taskX1) * progress * 0.01;
  let progressX: number;
  if (rtl) {
    progressX = taskX2 - progressWidth;
  } else {
    progressX = taskX1;
  }
  return [progressWidth, progressX];
};

export const progressByProgressWidth = (
  progressWidth: number,
  barTask: BarTask
) => {
  const barWidth = barTask.x2 - barTask.x1;
  const progressPercent = Math.round((progressWidth * 100) / barWidth);
  if (progressPercent >= 100) return 100;
  else if (progressPercent <= 0) return 0;
  else return progressPercent;
};

const progressByX = (x: number, task: BarTask) => {
  if (x >= task.x2) return 100;
  else if (x <= task.x1) return 0;
  else {
    const barWidth = task.x2 - task.x1;
    const progressPercent = Math.round(((x - task.x1) * 100) / barWidth);
    return progressPercent;
  }
};
const progressByXRTL = (x: number, task: BarTask) => {
  if (x >= task.x2) return 0;
  else if (x <= task.x1) return 100;
  else {
    const barWidth = task.x2 - task.x1;
    const progressPercent = Math.round(((task.x2 - x) * 100) / barWidth);
    return progressPercent;
  }
};

export const getProgressPoint = (
  progressX: number,
  taskY: number,
  taskHeight: number
) => {
  const point = [
    progressX - 5,
    taskY + taskHeight,
    progressX + 5,
    taskY + taskHeight,
    progressX,
    taskY + taskHeight - 8.66,
  ];
  return point.join(",");
};

const startByX = (x: number, xStep: number, task: BarTask) => {
  if (x >= task.x2 - task.handleWidth * 2) {
    x = task.x2 - task.handleWidth * 2;
  }
  const steps = Math.round((x - task.x1) / xStep);
  const additionalXValue = steps * xStep;
  const newX = task.x1 + additionalXValue;
  return newX;
};

const endByX = (x: number, xStep: number, task: BarTask) => {
  if (x <= task.x1 + task.handleWidth * 2) {
    x = task.x1 + task.handleWidth * 2;
  }
  const steps = Math.round((x - task.x2) / xStep);
  const additionalXValue = steps * xStep;
  const newX = task.x2 + additionalXValue;
  return newX;
};

const moveByX = (x: number, xStep: number, task: BarTask) => {
  const steps = Math.round((x - task.x1) / xStep);
  const additionalXValue = steps * xStep;
  const newX1 = task.x1 + additionalXValue;
  const newX2 = newX1 + task.x2 - task.x1;
  return [newX1, newX2];
};

const dateByX = (
  x: number,
  taskX: number,
  taskDate: Date,
  xStep: number,
  timeStep: number
) => {
  let newDate = new Date(((x - taskX) / xStep) * timeStep + taskDate.getTime());
  newDate = new Date(
    newDate.getTime() +
      (newDate.getTimezoneOffset() - taskDate.getTimezoneOffset()) * 60000
  );
  return newDate;
};

/**
 * Method handles event in real time(mousemove) and on finish(mouseup)
 */
export const handleTaskBySVGMouseEvent = (
  svgX: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  timeStep: number,
  initEventX1Delta: number,
  rtl: boolean
): { isChanged: boolean; changedTask: BarTask } => {
  let result: { isChanged: boolean; changedTask: BarTask };
  switch (selectedTask.type) {
    case "milestone":
      result = handleTaskBySVGMouseEventForMilestone(
        svgX,
        action,
        selectedTask,
        xStep,
        timeStep,
        initEventX1Delta
      );
      break;
    default:
      result = handleTaskBySVGMouseEventForBar(
        svgX,
        action,
        selectedTask,
        xStep,
        timeStep,
        initEventX1Delta,
        rtl
      );
      break;
  }
  return result;
};

const handleTaskBySVGMouseEventForBar = (
  svgX: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  timeStep: number,
  initEventX1Delta: number,
  rtl: boolean
): { isChanged: boolean; changedTask: BarTask } => {
  const changedTask: BarTask = { ...selectedTask };
  let isChanged = false;
  switch (action) {
    case "progress":
      if (rtl) {
        changedTask.progress = progressByXRTL(svgX, selectedTask);
      } else {
        changedTask.progress = progressByX(svgX, selectedTask);
      }
      isChanged = changedTask.progress !== selectedTask.progress;
      if (isChanged) {
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    case "start": {
      const newX1 = startByX(svgX, xStep, selectedTask);
      changedTask.x1 = newX1;
      isChanged = changedTask.x1 !== selectedTask.x1;
      if (isChanged) {
        if (rtl) {
          changedTask.end = dateByX(
            newX1,
            selectedTask.x1,
            selectedTask.end,
            xStep,
            timeStep
          );
        } else {
          changedTask.start = dateByX(
            newX1,
            selectedTask.x1,
            selectedTask.start,
            xStep,
            timeStep
          );
        }
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    }
    case "end": {
      const newX2 = endByX(svgX, xStep, selectedTask);
      changedTask.x2 = newX2;
      isChanged = changedTask.x2 !== selectedTask.x2;
      if (isChanged) {
        if (rtl) {
          changedTask.start = dateByX(
            newX2,
            selectedTask.x2,
            selectedTask.start,
            xStep,
            timeStep
          );
        } else {
          changedTask.end = dateByX(
            newX2,
            selectedTask.x2,
            selectedTask.end,
            xStep,
            timeStep
          );
        }
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    }
    case "move": {
      const [newMoveX1, newMoveX2] = moveByX(
        svgX - initEventX1Delta,
        xStep,
        selectedTask
      );
      isChanged = newMoveX1 !== selectedTask.x1;
      if (isChanged) {
        changedTask.start = dateByX(
          newMoveX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
        changedTask.end = dateByX(
          newMoveX2,
          selectedTask.x2,
          selectedTask.end,
          xStep,
          timeStep
        );
        changedTask.x1 = newMoveX1;
        changedTask.x2 = newMoveX2;
        const [progressWidth, progressX] = progressWithByParams(
          changedTask.x1,
          changedTask.x2,
          changedTask.progress,
          rtl
        );
        changedTask.progressWidth = progressWidth;
        changedTask.progressX = progressX;
      }
      break;
    }
  }
  return { isChanged, changedTask };
};

const handleTaskBySVGMouseEventForMilestone = (
  svgX: number,
  action: BarMoveAction,
  selectedTask: BarTask,
  xStep: number,
  timeStep: number,
  initEventX1Delta: number
): { isChanged: boolean; changedTask: BarTask } => {
  const changedTask: BarTask = { ...selectedTask };
  let isChanged = false;
  switch (action) {
    case "move": {
      const [newMoveX1, newMoveX2] = moveByX(
        svgX - initEventX1Delta,
        xStep,
        selectedTask
      );
      isChanged = newMoveX1 !== selectedTask.x1;
      if (isChanged) {
        changedTask.start = dateByX(
          newMoveX1,
          selectedTask.x1,
          selectedTask.start,
          xStep,
          timeStep
        );
        changedTask.end = changedTask.start;
        changedTask.x1 = newMoveX1;
        changedTask.x2 = newMoveX2;
      }
      break;
    }
  }
  return { isChanged, changedTask };
};
