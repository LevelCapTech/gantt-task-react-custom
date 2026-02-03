import React, {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { BarTask } from "../../types/bar-task";
import {
  CellCommitPayload,
  ColumnState,
  ColumnsState,
  EffortUnit,
  Task,
  VisibleField,
} from "../../types/public-types";
import { OverlayEditor } from "./overlay-editor";

export type EditingTrigger = "dblclick" | "enter" | "key";
type CommitTrigger = CellCommitPayload["trigger"];
type EditingMode = "viewing" | "selected" | "editing";
type EditingState = {
  mode: EditingMode;
  rowId: string | null;
  columnId: VisibleField | null;
  trigger: EditingTrigger | null;
  pending: boolean;
  errorMessage: string | null;
};

type EditingStateContextValue = {
  editingState: EditingState;
  selectCell: (rowId: string, columnId: VisibleField) => void;
  startEditing: (rowId: string, columnId: VisibleField, trigger: EditingTrigger) => void;
};

export const TaskListEditingStateContext =
  React.createContext<EditingStateContextValue | null>(null);

export type TaskListProps = {
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  rowHeight: number;
  ganttHeight: number;
  scrollY: number;
  horizontalScroll?: number;
  visibleFields: VisibleField[];
  effortDisplayUnit: EffortUnit;
  tasks: Task[];
  taskListRef: React.RefObject<HTMLDivElement>;
  headerContainerRef?: React.RefObject<HTMLDivElement>;
  bodyContainerRef?: React.RefObject<HTMLDivElement>;
  horizontalContainerClass?: string;
  selectedTask: BarTask | undefined;
  setSelectedTask: (task: string) => void;
  onExpanderClick: (task: Task) => void;
  onHorizontalScroll?: (event: SyntheticEvent<HTMLDivElement>) => void;
  onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
  onCellCommit?: (payload: CellCommitPayload) => Promise<void>;
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
    onCellCommit?: (payload: CellCommitPayload) => Promise<void>;
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
  horizontalScroll = 0,
  tasks,
  selectedTask,
  setSelectedTask,
  onExpanderClick,
  ganttHeight,
  taskListRef,
  headerContainerRef,
  bodyContainerRef,
  horizontalContainerClass,
  TaskListHeader,
  TaskListTable,
  visibleFields,
  onUpdateTask,
  onCellCommit,
  effortDisplayUnit,
  enableColumnDrag = true,
  onHorizontalScroll,
}) => {
  const internalHorizontalRef = useRef<HTMLDivElement>(null);
  const internalHeaderRef = useRef<HTMLDivElement>(null);
  const horizontalContainerRef = bodyContainerRef ?? internalHorizontalRef;
  const headerRef = headerContainerRef ?? internalHeaderRef;
  useEffect(() => {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY, horizontalContainerRef]);

  useEffect(() => {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollLeft = horizontalScroll;
    }
    if (headerRef.current) {
      headerRef.current.scrollLeft = horizontalScroll;
    }
  }, [horizontalScroll, horizontalContainerRef, headerRef]);

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
    onCellCommit,
    effortDisplayUnit,
    columnsState: visibleColumns,
  };

  const [editingState, setEditingState] = useState<EditingState>({
    mode: "viewing",
    rowId: null,
    columnId: null,
    trigger: null,
    pending: false,
    errorMessage: null,
  });
  const previousEditingStateRef = useRef<EditingState | null>(null);

  const closeEditing = useCallback(() => {
    setEditingState(prev => {
      if (prev.mode === "viewing") {
        return prev;
      }
      return {
        mode: "viewing",
        rowId: null,
        columnId: null,
        trigger: null,
        pending: false,
        errorMessage: null,
      };
    });
  }, []);
  const mountedRef = useRef(true);
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const cancelEditing = useCallback(
    (reason: "escape" | "nochange-blur" | "unmounted") => {
      if (editingState.mode !== "editing") {
        return;
      }
      console.debug("[edit:cancel]", {
        rowId: editingState.rowId,
        columnId: editingState.columnId,
        reason,
      });
      closeEditing();
    },
    [closeEditing, editingState.columnId, editingState.mode, editingState.rowId]
  );

  const commitEditing = useCallback(
    async (value: string, trigger: CommitTrigger) => {
      if (!onCellCommit) {
        return;
      }
      if (editingState.mode !== "editing" || editingState.pending) {
        return;
      }
      if (!editingState.rowId || !editingState.columnId) {
        return;
      }
      const rowId = editingState.rowId;
      const columnId = editingState.columnId;
      setEditingState(prev => {
        if (
          prev.mode !== "editing" ||
          prev.pending ||
          prev.rowId !== rowId ||
          prev.columnId !== columnId
        ) {
          return prev;
        }
        return { ...prev, pending: true, errorMessage: null };
      });
      try {
        await onCellCommit({ rowId, columnId, value, trigger });
        if (!mountedRef.current) {
          return;
        }
        setEditingState(prev => {
          if (
            prev.mode !== "editing" ||
            prev.rowId !== rowId ||
            prev.columnId !== columnId
          ) {
            return prev;
          }
          return {
            mode: "viewing",
            rowId: null,
            columnId: null,
            trigger: null,
            pending: false,
            errorMessage: null,
          };
        });
      } catch (error) {
        console.error("[commit:error]", {
          rowId,
          columnId,
          trigger,
          message: error instanceof Error ? error.message : "unknown",
        });
        if (!mountedRef.current) {
          return;
        }
        setEditingState(prev => {
          if (
            prev.mode !== "editing" ||
            prev.rowId !== rowId ||
            prev.columnId !== columnId
          ) {
            return prev;
          }
          return {
            ...prev,
            pending: false,
            errorMessage: "Commit failed. Please retry.",
          };
        });
      }
    },
    [editingState, onCellCommit]
  );

  const selectCell = useCallback((rowId: string, columnId: VisibleField) => {
    console.debug("[TaskList] select cell", { rowId, columnId });
    setEditingState({
      mode: "selected",
      rowId,
      columnId,
      trigger: null,
      pending: false,
      errorMessage: null,
    });
  }, []);

  const startEditing = useCallback(
    (rowId: string, columnId: VisibleField, trigger: EditingTrigger) => {
      if (editingState.pending) {
        console.debug("[TaskList] ignore enter editing", {
          reason: "pending",
          rowId,
          columnId,
        });
        return;
      }
      console.debug("[TaskList] enter editing", { rowId, columnId, trigger });
      setEditingState({
        mode: "editing",
        rowId,
        columnId,
        trigger,
        pending: false,
        errorMessage: null,
      });
    },
    [editingState.pending]
  );

  useEffect(() => {
    const previous = previousEditingStateRef.current;
    if (previous) {
      const buildLogContext = () => ({
        rowId: editingState.rowId ?? previous.rowId,
        columnId: editingState.columnId ?? previous.columnId,
        trigger: editingState.trigger ?? previous.trigger,
      });
      if (previous.mode !== "editing" && editingState.mode === "editing") {
        console.log("[edit:start]", buildLogContext());
      }
      if (!previous.pending && editingState.pending) {
        console.log("[commit:start]", buildLogContext());
      }
      if (previous.pending && !editingState.pending) {
        const logContext = buildLogContext();
        if (editingState.mode === "editing") {
          console.log("[commit:reject]", logContext);
        } else {
          console.log("[commit:resolve]", logContext);
        }
      }
      if (previous.mode === "editing" && editingState.mode !== "editing") {
        console.log("[edit:end]", { ...buildLogContext(), to: editingState.mode });
      }
    }
    previousEditingStateRef.current = editingState;
  }, [editingState]);

  const editingContextValue = useMemo(
    () => ({
      editingState,
      selectCell,
      startEditing,
    }),
    [editingState, selectCell, startEditing]
  );

  return (
    <div ref={taskListRef}>
      <OverlayEditor
        editingState={editingState}
        taskListRef={taskListRef}
        headerContainerRef={headerRef}
        bodyContainerRef={horizontalContainerRef}
        onCommit={commitEditing}
        onCancel={cancelEditing}
      />
      <div
        ref={headerRef}
        onScroll={onHorizontalScroll}
        style={{ width: "100%", overflowX: "hidden" }}
      >
        <TaskListHeader {...headerProps} />
      </div>
      <div
        ref={horizontalContainerRef}
        className={horizontalContainerClass}
        style={ganttHeight ? { height: ganttHeight } : {}}
        onScroll={onHorizontalScroll}
      >
        <TaskListEditingStateContext.Provider value={editingContextValue}>
          <TaskListTable {...tableProps} />
        </TaskListEditingStateContext.Provider>
      </div>
    </div>
  );
};
