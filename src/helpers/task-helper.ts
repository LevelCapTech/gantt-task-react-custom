import {
  TASK_PROCESS_OPTIONS,
  TASK_STATUS_BADGE_TEXT,
  TASK_STATUS_COLORS,
  TASK_STATUS_OPTIONS,
} from "../constants/taskOptions";
import { EffortUnit, TaskProcess, TaskStatus, VisibleField } from "../types/public-types";

export const DEFAULT_VISIBLE_FIELDS: VisibleField[] = [
  "name",
  "start",
  "end",
  "process",
  "assignee",
  "plannedStart",
  "plannedEnd",
  "plannedEffort",
  "actualEffort",
  "status",
];

const padTwo = (value: number) => value.toString().padStart(2, "0");

export const formatDate = (date?: Date) => {
  if (!date) return "";
  return `${date.getFullYear()}-${padTwo(date.getMonth() + 1)}-${padTwo(
    date.getDate()
  )}`;
};

export const parseDateFromInput = (value: string) => {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(v => parseInt(v, 10));
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 /* 31日超を除外し、月ごとの上限（例: 2月30日）はDateコンストラクタの正規化＋ラウンドトリップ比較で検証 */
  ) {
    return undefined;
  }
  const date = new Date(year, month - 1, day);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return date;
};

export const formatEffort = (
  effort?: number,
  unit: EffortUnit = "MH"
): string => {
  if (effort === undefined || effort === null || !Number.isFinite(effort) || effort < 0) {
    return "";
  }
  const base =
    unit === "MD" ? 8 : unit === "MM" ? 160 : 1; /* MD:8h, MM:160h */
  const converted = effort / base;
  const rounded =
    unit === "MH" ? effort : Math.round(converted * 10) / 10;
  return `${rounded}${unit}`;
};

export const sanitizeEffortInput = (value: string) => {
  if (value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
};

const DEFAULT_TASK_PROCESS: TaskProcess = (
  TASK_PROCESS_OPTIONS.includes("その他")
    ? "その他"
    : TASK_PROCESS_OPTIONS[0]
) as TaskProcess;

export const normalizeProcess = (process?: TaskProcess) =>
  TASK_PROCESS_OPTIONS.includes(process as TaskProcess)
    ? (process as TaskProcess)
    : DEFAULT_TASK_PROCESS;

export const normalizeStatus = (status?: TaskStatus) =>
  TASK_STATUS_OPTIONS.includes(status as TaskStatus)
    ? (status as TaskStatus)
    : TASK_STATUS_OPTIONS[0];

export const getStatusColor = (status?: TaskStatus) =>
  TASK_STATUS_COLORS[normalizeStatus(status)];

export const getStatusBadgeText = (status?: TaskStatus) =>
  TASK_STATUS_BADGE_TEXT[normalizeStatus(status)];

export const resolveVisibleFields = (visibleFields?: VisibleField[]) =>
  visibleFields && visibleFields.length > 0
    ? visibleFields
    : DEFAULT_VISIBLE_FIELDS;
