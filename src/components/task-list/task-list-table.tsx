import React from "react";
import styles from "./task-list-table.module.css";
import {
  ColumnsState,
  EffortUnit,
  Task,
  TaskProcess,
  TaskStatus,
  VisibleField,
} from "../../types/public-types";
import {
  TASK_PROCESS_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "../../constants/taskOptions";
import {
  formatDate,
  formatEffort,
  getStatusBadgeText,
  getStatusColor,
  normalizeProcess,
  normalizeStatus,
  parseDateFromInput,
  resolveVisibleFields,
  sanitizeEffortInput,
} from "../../helpers/task-helper";

export const TaskListTableDefault: React.FC<{
  rowHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  tasks: Task[];
  selectedTaskId: string;
  setSelectedTask: (taskId: string) => void;
  onExpanderClick: (task: Task) => void;
  visibleFields: VisibleField[];
  onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
  effortDisplayUnit: EffortUnit;
  columnsState?: ColumnsState;
}> = ({
  rowHeight,
  rowWidth,
  tasks,
  fontFamily,
  fontSize,
  onExpanderClick,
  visibleFields,
  onUpdateTask,
  effortDisplayUnit,
  columnsState,
}) => {
  const columns =
    columnsState?.filter(column => column.visible !== false) ??
    resolveVisibleFields(visibleFields).map(field => ({
      id: field,
      width: field === "name" ? 140 : Number.parseInt(rowWidth, 10) || 155,
    }));
  const isEditable = !!onUpdateTask;

  return (
    <div
      className={styles.taskListWrapper}
      style={{
        fontFamily: fontFamily,
        fontSize: fontSize,
      }}
    >
      {tasks.map(t => {
        let expanderSymbol = "";
        if (t.hideChildren === false) {
          expanderSymbol = "▼";
        } else if (t.hideChildren === true) {
          expanderSymbol = "▶";
        }

        const processValue = normalizeProcess(t.process);
        const statusValue = normalizeStatus(t.status);
        const handleStatusChange = (value: string) => {
          const nextStatus = normalizeStatus(value as TaskStatus);
          onUpdateTask?.(t.id, { status: nextStatus });
        };

        const handleProcessChange = (value: string) => {
          const nextProcess = normalizeProcess(value as TaskProcess);
          onUpdateTask?.(t.id, { process: nextProcess });
        };

        const handleAssigneeChange = (value: string) => {
          onUpdateTask?.(t.id, { assignee: value || undefined });
        };

        const handlePlannedDateChange = (
          field: "plannedStart" | "plannedEnd",
          value: string
        ) => {
          const parsed = parseDateFromInput(value);
          onUpdateTask?.(t.id, { [field]: parsed });
        };

        const handleEffortChange = (
          field: "plannedEffort" | "actualEffort",
          value: string
        ) => {
          const parsed = sanitizeEffortInput(value);
          onUpdateTask?.(t.id, { [field]: parsed });
        };

        const renderCell = (field: VisibleField) => {
          switch (field) {
            case "name":
              return (
                <div className={styles.taskListNameWrapper}>
                  <div
                    className={
                      expanderSymbol
                        ? styles.taskListExpander
                        : styles.taskListEmptyExpander
                    }
                    onClick={() => onExpanderClick(t)}
                  >
                    {expanderSymbol}
                  </div>
                  <div>{t.name}</div>
                </div>
              );
            case "start":
              return <span>{formatDate(t.start)}</span>;
            case "end":
              return <span>{formatDate(t.end)}</span>;
            case "process":
              return isEditable ? (
                <select
                  className={styles.taskListSelect}
                  aria-label="工程"
                  value={processValue}
                  onChange={event => handleProcessChange(event.target.value)}
                >
                  {TASK_PROCESS_OPTIONS.map(option => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <span>{processValue}</span>
              );
            case "assignee":
              return isEditable ? (
                <input
                  className={styles.taskListInput}
                  type="text"
                  aria-label="担当者"
                  value={t.assignee || ""}
                  onChange={event => handleAssigneeChange(event.target.value)}
                  placeholder="担当者"
                />
              ) : (
                <span>{t.assignee || ""}</span>
              );
            case "plannedStart":
              return isEditable ? (
                <input
                  className={styles.taskListInput}
                  type="date"
                  aria-label="予定開始"
                  value={formatDate(t.plannedStart)}
                  onChange={event =>
                    handlePlannedDateChange("plannedStart", event.target.value)
                  }
                />
              ) : (
                <span>{formatDate(t.plannedStart)}</span>
              );
            case "plannedEnd":
              return isEditable ? (
                <input
                  className={styles.taskListInput}
                  type="date"
                  aria-label="予定終了"
                  value={formatDate(t.plannedEnd)}
                  onChange={event =>
                    handlePlannedDateChange("plannedEnd", event.target.value)
                  }
                />
              ) : (
                <span>{formatDate(t.plannedEnd)}</span>
              );
            case "plannedEffort":
              return isEditable ? (
                <input
                  className={styles.taskListInput}
                  type="number"
                  min={0}
                  step="0.5"
                  aria-label="予定工数（入力単位:時間）"
                  value={t.plannedEffort ?? ""}
                  onChange={event =>
                    handleEffortChange("plannedEffort", event.target.value)
                  }
                  placeholder="時間(MH)"
                  title="入力単位: 時間(MH)"
                />
              ) : (
                <span>{formatEffort(t.plannedEffort, effortDisplayUnit)}</span>
              );
            case "actualEffort":
              return isEditable ? (
                <input
                  className={styles.taskListInput}
                  type="number"
                  min={0}
                  step="0.5"
                  aria-label="実績工数（入力単位:時間）"
                  value={t.actualEffort ?? ""}
                  onChange={event =>
                    handleEffortChange("actualEffort", event.target.value)
                  }
                  placeholder="時間(MH)"
                  title="入力単位: 時間(MH)"
                />
              ) : (
                <span>{formatEffort(t.actualEffort, effortDisplayUnit)}</span>
              );
            case "status":
              return (
                <div className={styles.statusWrapper}>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(statusValue) }}
                  >
                    {getStatusBadgeText(statusValue)}
                  </span>
                  {isEditable ? (
                    <select
                      className={styles.taskListSelect}
                      aria-label="ステータス"
                      value={statusValue}
                      onChange={event => handleStatusChange(event.target.value)}
                    >
                      {TASK_STATUS_OPTIONS.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className={styles.statusText}>{statusValue}</span>
                  )}
                </div>
              );
            default:
              return null;
          }
        };
        return (
          <div
            className={styles.taskListTableRow}
            style={{ height: rowHeight }}
            key={`${t.id}row`}
          >
            {columns.map(column => (
              <div
                key={`${t.id}-${typeof column === "string" ? column : column.id}`}
                className={styles.taskListCell}
                style={{
                  minWidth:
                    typeof column === "string" ? rowWidth : `${column.width}px`,
                  maxWidth:
                    typeof column === "string" ? rowWidth : `${column.width}px`,
                }}
                title={
                  (typeof column === "string" ? column : column.id) === "name"
                    ? t.name
                    : undefined
                }
              >
                {renderCell(typeof column === "string" ? column : column.id)}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};
