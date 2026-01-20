import { Task } from "../types/public-types";

export const INDENT_WIDTH_PX = 24;

export const deriveIndentSteps = (deltaX: number, indentWidth: number = INDENT_WIDTH_PX) =>
  Math.trunc(deltaX / indentWidth);

export const findTaskById = (tasks: Task[], taskId: string): Task | undefined =>
  tasks.find(task => task.id === taskId);

const buildChildrenMap = (tasks: Task[]): Map<string, string[]> =>
  tasks.reduce<Map<string, string[]>>((map, task) => {
    if (!task.project) return map;
    const siblings = map.get(task.project) ?? [];
    siblings.push(task.id);
    map.set(task.project, siblings);
    return map;
  }, new Map());

export const findDescendantIds = (tasks: Task[], rootId: string): string[] => {
  const childrenMap = buildChildrenMap(tasks);
  const result: string[] = [];
  const stack = [...(childrenMap.get(rootId) ?? [])];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;
    result.push(current);
    const nested = childrenMap.get(current);
    if (nested) {
      stack.push(...nested);
    }
  }
  return result;
};

export const isDescendant = (tasks: Task[], ancestorId: string, maybeChildId?: string): boolean => {
  if (!maybeChildId) return false;
  let cursor = findTaskById(tasks, maybeChildId);
  while (cursor?.project) {
    if (cursor.project === ancestorId) {
      return true;
    }
    cursor = findTaskById(tasks, cursor.project);
  }
  return false;
};

export const normalizeDisplayOrder = (tasks: Task[]): Task[] =>
  tasks.map((task, index) => ({ ...task, displayOrder: index }));

const updateTaskParent = (tasks: Task[], taskId: string, nextParentId?: string): Task[] =>
  tasks.map(task => (task.id === taskId ? { ...task, project: nextParentId } : task));

export const moveTaskWithChildren = (
  tasks: Task[],
  activeId: string,
  overId?: string | null
): Task[] => {
  if (!overId || activeId === overId) return tasks;

  const idsToMove = [activeId, ...findDescendantIds(tasks, activeId)];
  const movingTasks = tasks.filter(task => idsToMove.includes(task.id));
  const remaining = tasks.filter(task => !idsToMove.includes(task.id));
  const indexById = new Map<string, number>(tasks.map((task, index) => [task.id, index]));
  const activeIndex = indexById.get(activeId) ?? -1;
  const overIndex = indexById.get(overId) ?? -1;
  const targetIndex = remaining.findIndex(task => task.id === overId);
  const baseIndex = targetIndex === -1 ? remaining.length : targetIndex;
  const insertAt =
    overIndex > activeIndex && targetIndex !== -1 ? baseIndex + 1 : baseIndex;

  const reordered = [
    ...remaining.slice(0, insertAt),
    ...movingTasks,
    ...remaining.slice(insertAt),
  ];
  return normalizeDisplayOrder(reordered);
};

export const indentTask = (tasks: Task[], taskId: string): Task[] => {
  const index = tasks.findIndex(task => task.id === taskId);
  if (index <= 0) return tasks;
  const previous = tasks[index - 1];
  if (!previous || isDescendant(tasks, taskId, previous.id)) return tasks;
  return updateTaskParent(tasks, taskId, previous.id);
};

export const outdentTask = (tasks: Task[], taskId: string): Task[] => {
  const task = findTaskById(tasks, taskId);
  if (!task?.project) return tasks;
  const parent = findTaskById(tasks, task.project);
  return updateTaskParent(tasks, taskId, parent?.project);
};

export const applyIndentSteps = (tasks: Task[], taskId: string, steps: number): Task[] => {
  if (steps === 0) return tasks;
  const direction = Math.sign(steps);
  const abs = Math.abs(steps);
  let next = tasks;
  for (let i = 0; i < abs; i += 1) {
    next = direction > 0 ? indentTask(next, taskId) : outdentTask(next, taskId);
  }
  return next;
};

export const getTaskLevel = (tasks: Task[], taskId: string): number => {
  let level = 0;
  let cursor = findTaskById(tasks, taskId);
  while (cursor?.project) {
    level += 1;
    cursor = findTaskById(tasks, cursor.project);
  }
  return level;
};
