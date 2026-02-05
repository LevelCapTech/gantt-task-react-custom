export declare const TASK_PROCESS_OPTIONS: readonly ["設計", "開発", "テスト", "レビュー", "リリース", "その他"];
export declare const TASK_STATUS_OPTIONS: readonly ["未着手", "進行中", "完了", "保留"];
export declare type TaskProcessOption = (typeof TASK_PROCESS_OPTIONS)[number];
export declare type TaskStatusOption = (typeof TASK_STATUS_OPTIONS)[number];
export declare const TASK_STATUS_COLORS: Record<TaskStatusOption, string>;
export declare const TASK_STATUS_BADGE_TEXT: Record<TaskStatusOption, string>;
