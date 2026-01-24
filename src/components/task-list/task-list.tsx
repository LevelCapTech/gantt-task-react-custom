import React, { useEffect, useMemo, useRef, useState } from "react";
import { BarTask } from "../../types/bar-task";
import {
  ColumnState,
  ColumnsState,
  EffortUnit,
  Task,
  VisibleField,
} from "../../types/public-types";

export type TaskListProps = {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  rowHeight: number;
  ganttHeight: number;
  scrollY: number;
  visibleFields: VisibleField[];
  effortDisplayUnit: EffortUnit;
  tasks: Task[];
  taskListRef: React.RefObject<HTMLDivElement>;
  horizontalContainerClass?: string;
  selectedTask: BarTask | undefined;
  setSelectedTask: (task: string) => void;
  onExpanderClick: (task: Task) => void;
  onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
  TaskListHeader: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    visibleFields: VisibleField[];
    columnsState?: ColumnsState;
    setColumnsState?: React.Dispatch<React.SetStateAction<ColumnsState>>;
    enableColumnDrag?: boolean;
  }>;
  TaskListTable: React.FC<{
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    locale?: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: Task) => void;
    visibleFields: VisibleField[];
    onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
    effortDisplayUnit: EffortUnit;
    columnsState?: ColumnsState;
  }>;
  enableColumnDrag?: boolean;
};

export const DEFAULT_MIN_WIDTH = 32;
export const getDefaultWidth = (field: VisibleField, rowWidth: string): number =>
  field === "name" ? 140 : Number.parseInt(rowWidth, 10) || 155;

export const TaskList: React.FC<TaskListProps> = ({
  headerHeight,
  fontFamily,
  fontSize,
  rowWidth,
  rowHeight,
  scrollY,
  tasks,
  selectedTask,
  setSelectedTask,
  onExpanderClick,
  ganttHeight,
  taskListRef,
  horizontalContainerClass,
  TaskListHeader,
  TaskListTable,
  visibleFields,
  onUpdateTask,
  effortDisplayUnit,
  enableColumnDrag = true,
}) => {
  const horizontalContainerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  const initialColumns = useMemo<ColumnsState>(
    () =>
      visibleFields.map(
        (field): ColumnState => ({
          id: field,
          label: field,
          width: getDefaultWidth(field, rowWidth),
          minWidth: DEFAULT_MIN_WIDTH,
          visible: true,
        })
      ),
    [visibleFields, rowWidth]
  );

  const [columnsState, setColumnsState] = useState<ColumnsState>(initialColumns);

  useEffect(() => {
    setColumnsState(prev => {
      const existingMap = new Map(prev.map(column => [column.id, column]));
      const nextColumns: ColumnsState = visibleFields.map(field => {
        const existing = existingMap.get(field);
        if (existing) {
          return existing;
        }
        return {
          id: field,
          label: field,
          width: getDefaultWidth(field, rowWidth),
          minWidth: DEFAULT_MIN_WIDTH,
          visible: true,
        };
      });
      return nextColumns;
    });
  }, [visibleFields, rowWidth]);
  const visibleColumns = useMemo(
    () => columnsState.filter(column => column.visible),
    [columnsState]
  );

  const headerProps = {
    headerHeight,
    fontFamily,
    fontSize,
    rowWidth,
    visibleFields,
    columnsState,
    setColumnsState,
    enableColumnDrag,
  };
  const selectedTaskId = selectedTask ? selectedTask.id : "";
  const tableProps = {
    rowHeight,
    rowWidth,
    fontFamily,
    fontSize,
    tasks,
    selectedTaskId: selectedTaskId,
    setSelectedTask,
    onExpanderClick,
    visibleFields,
    onUpdateTask,
    effortDisplayUnit,
    columnsState: visibleColumns,
  };

  return (
    <div ref={taskListRef}>
      <TaskListHeader {...headerProps} />
      <div
        ref={horizontalContainerRef}
        className={horizontalContainerClass}
        style={ganttHeight ? { height: ganttHeight } : {}}
      >
        <TaskListTable {...tableProps} />
      </div>
    </div>
  );
};
