import { Task } from "../types/public-types";

const today = new Date();
const addDays = (days: number) => {
  const next = new Date(today);
  next.setDate(next.getDate() + days);
  return next;
};

export const buildSampleTasks = (): Task[] => [
  {
    id: "project-1",
    type: "project",
    name: "プロジェクト 1",
    start: addDays(-1),
    end: addDays(14),
    progress: 35,
  },
  {
    id: "task-1-1",
    type: "task",
    name: "要件定義",
    start: addDays(0),
    end: addDays(3),
    progress: 40,
    project: "project-1",
  },
  {
    id: "task-1-2",
    type: "task",
    name: "デザイン",
    start: addDays(3),
    end: addDays(7),
    progress: 20,
    project: "project-1",
  },
  {
    id: "task-1-3",
    type: "task",
    name: "実装",
    start: addDays(7),
    end: addDays(14),
    progress: 10,
    project: "project-1",
  },
  {
    id: "project-2",
    type: "project",
    name: "プロジェクト 2",
    start: addDays(2),
    end: addDays(10),
    progress: 55,
  },
  {
    id: "task-2-1",
    type: "task",
    name: "テスト計画",
    start: addDays(2),
    end: addDays(5),
    progress: 25,
    project: "project-2",
  },
  {
    id: "milestone-1",
    type: "milestone",
    name: "マイルストーン",
    start: addDays(9),
    end: addDays(9),
    progress: 0,
    project: "project-2",
  },
];
