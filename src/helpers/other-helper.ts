import { BarTask } from "../types/bar-task";
import { Task } from "../types/public-types";
import { normalizeTaskDependencies } from "./bar-helper";

export function isKeyboardEvent(
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent
): event is React.KeyboardEvent {
  return (event as React.KeyboardEvent).key !== undefined;
}

export function isMouseEvent(
  event: React.MouseEvent | React.KeyboardEvent | React.FocusEvent
): event is React.MouseEvent {
  return (event as React.MouseEvent).clientX !== undefined;
}

export function isBarTask(task: Task | BarTask): task is BarTask {
  return (task as BarTask).x1 !== undefined;
}

export function removeHiddenTasks(tasks: Task[]) {
  const dependencyChildrenMap = buildDependencyChildrenMap(tasks);
  const groupedTasks = tasks.filter(
    t => t.hideChildren && t.type === "project"
  );
  if (groupedTasks.length > 0) {
    for (let i = 0; groupedTasks.length > i; i++) {
      const groupedTask = groupedTasks[i];
      const children = getChildren(tasks, groupedTask, dependencyChildrenMap);
      tasks = tasks.filter(t => children.indexOf(t) === -1);
    }
  }
  return tasks;
}

const buildDependencyChildrenMap = (tasks: Task[]) => {
  const taskMap = new Map(tasks.map(task => [task.id, task]));
  const childrenMap = new Map<string, Task[]>();
  normalizeTaskDependencies(tasks).forEach(dependency => {
    const parent = taskMap.get(dependency.fromId);
    const child = taskMap.get(dependency.toId);
    if (!parent || !child) {
      return;
    }
    const children = childrenMap.get(parent.id) ?? [];
    if (!children.some(task => task.id === child.id)) {
      children.push(child);
      childrenMap.set(parent.id, children);
    }
  });
  return childrenMap;
};

function getChildren(
  taskList: Task[],
  task: Task,
  dependencyChildrenMap: Map<string, Task[]>,
  visited = new Set<string>(),
  inStack = new Set<string>()
) {
  if (inStack.has(task.id)) {
    return [] as Task[];
  }

  const nextInStack = new Set(inStack);
  nextInStack.add(task.id);

  let directChildren: Task[] = [];
  if (task.type !== "project") {
    directChildren = dependencyChildrenMap.get(task.id) || [];
  } else {
    directChildren = taskList.filter(t => t.project && t.project === task.id);
  }

  const taskChildren: Task[] = [];
  const nextVisited = new Set(visited);
  directChildren.forEach(childTask => {
    if (nextVisited.has(childTask.id)) {
      return;
    }
    nextVisited.add(childTask.id);
    taskChildren.push(childTask);
    taskChildren.push(
      ...getChildren(taskList, childTask, dependencyChildrenMap, nextVisited, nextInStack)
    );
  });
  return taskChildren;
}

export const sortTasks = (taskA: Task, taskB: Task) => {
  const orderA = taskA.displayOrder || Number.MAX_VALUE;
  const orderB = taskB.displayOrder || Number.MAX_VALUE;
  if (orderA > orderB) {
    return 1;
  } else if (orderA < orderB) {
    return -1;
  } else {
    return 0;
  }
};
