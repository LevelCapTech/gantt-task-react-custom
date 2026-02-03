import React from "react";
import styles from "./task-list-table.module.css";
import { ColumnsState, EffortUnit, Task, VisibleField } from "../../types/public-types";
import { getDefaultWidth, TaskListEditingStateContext } from "./task-list";
import {
  formatDate,
  formatEffort,
  getStatusBadgeText,
  getStatusColor,
  normalizeProcess,
  normalizeStatus,
  resolveVisibleFields,
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
  onCellCommit?: (payload: {
    rowId: string;
    columnId: VisibleField;
    value: string;
    trigger: "enter";
  }) => Promise<void>;
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
  onCellCommit,
  effortDisplayUnit,
  columnsState,
}) => {
  const columns =
    columnsState?.filter(column => column.visible !== false) ??
    resolveVisibleFields(visibleFields).map(field => ({
      id: field,
      width: getDefaultWidth(field, rowWidth),
    }));
  const isCommitEnabled = !!onCellCommit;
  const allowEditing = isCommitEnabled;
  const editingContext = React.useContext(TaskListEditingStateContext);
  const editingState = editingContext?.editingState;
  const editableFields = new Set<VisibleField>([
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
  ]);
  const columnIds = columns.map(column =>
    typeof column === "string" ? column : column.id
  );

  const resolveColumnId = (column: (typeof columns)[number]) =>
    (typeof column === "string" ? column : column.id) as VisibleField;

  const isCellEditable = (task: Task, columnId: VisibleField) => {
    const tableEditable = allowEditing;
    const columnEditable = editableFields.has(columnId);
    const rowEditable = task.isDisabled !== true;
    const cellEditableByRule = true;
    return tableEditable && columnEditable && rowEditable && cellEditableByRule;
  };

  const selectCell = editingContext?.selectCell;
  const startEditing = editingContext?.startEditing;

  const findCellPosition = () => {
    if (!editingState || editingState.mode === "viewing") {
      return null;
    }
    const rowIndex = tasks.findIndex(task => task.id === editingState.rowId);
    const columnIndex = columnIds.indexOf(editingState.columnId as VisibleField);
    if (rowIndex < 0 || columnIndex < 0) {
      return null;
    }
    return { rowIndex, columnIndex };
  };

  const resolveSelectedCell = () => {
    if (!editingState || editingState.mode !== "selected") {
      return null;
    }
    const columnId = editingState.columnId as VisibleField | null;
    if (!columnId || !columnIds.includes(columnId)) {
      return null;
    }
    const task = tasks.find(row => row.id === editingState.rowId);
    if (!task) {
      return null;
    }
    return { task, columnId };
  };

  const moveSelection = (direction: "up" | "down" | "left" | "right") => {
    if (!selectCell || tasks.length === 0 || columnIds.length === 0) {
      return;
    }
    const position = findCellPosition();
    if (!position) {
      const firstColumn = columnIds[0];
      selectCell(tasks[0].id, firstColumn);
      return;
    }
    let { rowIndex, columnIndex } = position;
    switch (direction) {
      case "up":
        rowIndex = Math.max(0, rowIndex - 1);
        break;
      case "down":
        rowIndex = Math.min(tasks.length - 1, rowIndex + 1);
        break;
      case "left":
        columnIndex = Math.max(0, columnIndex - 1);
        break;
      case "right":
        columnIndex = Math.min(columnIds.length - 1, columnIndex + 1);
        break;
      default:
        break;
    }
    selectCell(tasks[rowIndex].id, columnIds[columnIndex]);
  };

  const shouldIgnoreKeyEvent = (target: EventTarget) => {
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    if (target.isContentEditable) {
      return true;
    }
    const tagName = target.tagName;
    return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
  };

  const handleWrapperKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) {
      return;
    }
    if (shouldIgnoreKeyEvent(event.target)) {
      return;
    }
    if (editingState?.mode === "editing") {
      return;
    }
    switch (event.key) {
      case "ArrowUp":
        event.preventDefault();
        moveSelection("up");
        return;
      case "ArrowDown":
        event.preventDefault();
        moveSelection("down");
        return;
      case "ArrowLeft":
        event.preventDefault();
        moveSelection("left");
        return;
      case "ArrowRight":
        event.preventDefault();
        moveSelection("right");
        return;
      default:
        break;
    }
    if (editingState?.mode !== "selected") {
      return;
    }
    const selectedCell = resolveSelectedCell();
    if (!selectedCell || !startEditing) {
      return;
    }
    if (event.key === "Enter") {
      if (!isCellEditable(selectedCell.task, selectedCell.columnId)) {
        console.debug("[TaskList] ignore enter editing", {
          reason: "not-editable",
          rowId: selectedCell.task.id,
          columnId: selectedCell.columnId,
        });
        return;
      }
      event.preventDefault();
      startEditing(
        selectedCell.task.id,
        selectedCell.columnId,
        "enter"
      );
      return;
    }
    if (event.key === "Escape") {
      return;
    }
    const isPrintableKey =
      event.key.length === 1 &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey;
    if (isPrintableKey) {
      if (!isCellEditable(selectedCell.task, selectedCell.columnId)) {
        console.debug("[TaskList] ignore enter editing", {
          reason: "not-editable",
          rowId: selectedCell.task.id,
          columnId: selectedCell.columnId,
        });
        return;
      }
      event.preventDefault();
      startEditing(selectedCell.task.id, selectedCell.columnId, "key");
    }
  };

  return (
    <div
      className={styles.taskListWrapper}
      tabIndex={0}
      onKeyDown={handleWrapperKeyDown}
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
              return <span>{normalizeProcess(t.process)}</span>;
            case "assignee":
              return <span>{t.assignee || ""}</span>;
            case "plannedStart":
              return <span>{formatDate(t.plannedStart)}</span>;
            case "plannedEnd":
              return <span>{formatDate(t.plannedEnd)}</span>;
            case "plannedEffort":
              return (
                <span>{formatEffort(t.plannedEffort, effortDisplayUnit)}</span>
              );
            case "actualEffort":
              return (
                <span>{formatEffort(t.actualEffort, effortDisplayUnit)}</span>
              );
            case "status":
              {
                const statusValue = normalizeStatus(t.status);
              return (
                <div className={styles.statusWrapper}>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(statusValue) }}
                  >
                    {getStatusBadgeText(statusValue)}
                  </span>
                  <span className={styles.statusText}>{statusValue}</span>
                </div>
              );
              }
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
            {columns.map(column => {
              const columnId = resolveColumnId(column);
              const isSelected =
                editingState?.mode !== "viewing" &&
                editingState?.rowId === t.id &&
                editingState?.columnId === columnId;
              const handleCellClick = (
                event: React.MouseEvent<HTMLDivElement>
              ) => {
                if (editingState?.mode === "editing") {
                  const pending = editingState.pending;
                  console.log("[edit:select]", { rowId: t.id, columnId, pending });
                  if (pending) {
                    return;
                  }
                }
                if (selectCell) {
                  selectCell(t.id, columnId);
                }
                event.currentTarget.focus();
              };

              const handleCellDoubleClick = () => {
                if (!startEditing) {
                  return;
                }
                if (!isCellEditable(t, columnId)) {
                  console.debug("[TaskList] ignore enter editing", {
                    reason: "not-editable",
                    rowId: t.id,
                    columnId,
                  });
                  return;
                }
                startEditing(t.id, columnId, "dblclick");
              };

              const handleCellKeyDown = (
                event: React.KeyboardEvent<HTMLDivElement>
              ) => {
                if (shouldIgnoreKeyEvent(event.target)) {
                  return;
                }
                if (!isSelected || editingState?.mode !== "selected") {
                  return;
                }
                if (event.key === "Enter") {
                  if (!startEditing) {
                    return;
                  }
                  if (!isCellEditable(t, columnId)) {
                    console.debug("[TaskList] ignore enter editing", {
                      reason: "not-editable",
                      rowId: t.id,
                      columnId,
                    });
                    return;
                  }
                  event.preventDefault();
                  startEditing(t.id, columnId, "enter");
                  return;
                }
                if (event.key === "Escape") {
                  return;
                }
                const isPrintableKey =
                  event.key.length === 1 &&
                  !event.metaKey &&
                  !event.ctrlKey &&
                  !event.altKey;
                if (isPrintableKey) {
                  if (!startEditing) {
                    return;
                  }
                  if (!isCellEditable(t, columnId)) {
                    console.debug("[TaskList] ignore enter editing", {
                      reason: "not-editable",
                      rowId: t.id,
                      columnId,
                    });
                    return;
                  }
                  event.preventDefault();
                  startEditing(t.id, columnId, "key");
                }
              };

              return (
                <div
                  key={`${t.id}-${columnId}`}
                  className={styles.taskListCell}
                  data-row-id={t.id}
                  data-column-id={columnId}
                  aria-selected={isSelected || undefined}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={handleCellClick}
                  onDoubleClick={handleCellDoubleClick}
                  onKeyDown={handleCellKeyDown}
                  style={{
                    minWidth:
                      typeof column === "string"
                        ? rowWidth
                        : `${column.width}px`,
                    maxWidth:
                      typeof column === "string"
                        ? rowWidth
                        : `${column.width}px`,
                  }}
                  title={columnId === "name" ? t.name : undefined}
                >
                  {renderCell(columnId)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};
