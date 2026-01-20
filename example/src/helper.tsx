import { Task } from "../../dist/types/public-types";

export function initTasks() {
  const currentDate = new Date();
  const tasks: Task[] = [
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      name: "サンプルプロジェクト",
      id: "ProjectSample",
      progress: 25,
      type: "project",
      hideChildren: false,
      displayOrder: 1,
      process: "その他",
      assignee: "チームA",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ),
      plannedEnd: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      plannedEffort: 240,
      actualEffort: 48,
      status: "進行中",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1),
      end: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        2,
        12,
        28
      ),
      name: "アイデア整理",
      id: "Task 0",
      progress: 45,
      type: "task",
      project: "ProjectSample",
      displayOrder: 2,
      process: "設計",
      assignee: "田中",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        2
      ),
      plannedEffort: 12,
      actualEffort: 8,
      status: "進行中",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 2),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4, 0, 0),
      name: "調査",
      id: "Task 1",
      progress: 25,
      dependencies: ["Task 0"],
      type: "task",
      project: "ProjectSample",
      displayOrder: 3,
      process: "設計",
      assignee: "佐藤",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        2
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        4
      ),
      plannedEffort: 16,
      status: "未着手",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 4),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8, 0, 0),
      name: "チームディスカッション",
      id: "Task 2",
      progress: 10,
      dependencies: ["Task 1"],
      type: "task",
      project: "ProjectSample",
      displayOrder: 4,
      process: "開発",
      assignee: "鈴木",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        4
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        8
      ),
      plannedEffort: 32,
      actualEffort: 6,
      status: "進行中",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 9, 0, 0),
      name: "開発",
      id: "Task 3",
      progress: 2,
      dependencies: ["Task 2"],
      type: "task",
      project: "ProjectSample",
      displayOrder: 5,
      process: "開発",
      assignee: "山田",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        8
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        9
      ),
      plannedEffort: 20,
      actualEffort: 1,
      status: "進行中",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 8),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 10),
      name: "レビュー",
      id: "Task 4",
      type: "task",
      progress: 70,
      dependencies: ["Task 2"],
      project: "ProjectSample",
      displayOrder: 6,
      process: "レビュー",
      assignee: "伊藤",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        8
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        10
      ),
      plannedEffort: 10,
      actualEffort: 5,
      status: "進行中",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 15),
      name: "リリース",
      id: "Task 6",
      progress: currentDate.getMonth(),
      type: "milestone",
      dependencies: ["Task 4"],
      project: "ProjectSample",
      displayOrder: 7,
      process: "リリース",
      assignee: "PM",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        15
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        15
      ),
      plannedEffort: 4,
      actualEffort: 0,
      status: "未着手",
    },
    {
      start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 18),
      end: new Date(currentDate.getFullYear(), currentDate.getMonth(), 19),
      name: "打ち上げ",
      id: "Task 9",
      progress: 0,
      isDisabled: true,
      type: "task",
      process: "その他",
      assignee: "全員",
      plannedStart: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        18
      ),
      plannedEnd: new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        19
      ),
      plannedEffort: 6,
      status: "保留",
    },
  ];
  return tasks;
}

export function getStartEndDateForProject(tasks: Task[], projectId: string) {
  const projectTasks = tasks.filter(t => t.project === projectId);
  let start = projectTasks[0].start;
  let end = projectTasks[0].end;

  for (let i = 0; i < projectTasks.length; i++) {
    const task = projectTasks[i];
    if (start.getTime() > task.start.getTime()) {
      start = task.start;
    }
    if (end.getTime() < task.end.getTime()) {
      end = task.end;
    }
  }
  return [start, end];
}
