export const TASK_PROCESS_OPTIONS = [
  "設計",
  "開発",
  "テスト",
  "レビュー",
  "リリース",
  "その他",
] as const;

export const TASK_STATUS_OPTIONS = ["未着手", "進行中", "完了", "保留"] as const;

export type TaskProcessOption = (typeof TASK_PROCESS_OPTIONS)[number];
export type TaskStatusOption = (typeof TASK_STATUS_OPTIONS)[number];

export const TASK_STATUS_COLORS: Record<TaskStatusOption, string> = {
  未着手: "#9e9e9e",
  進行中: "#2196f3",
  完了: "#4caf50",
  保留: "#ff9800",
};

export const TASK_STATUS_BADGE_TEXT: Record<TaskStatusOption, string> = {
  未着手: "未",
  進行中: "進",
  完了: "完",
  保留: "保",
};
