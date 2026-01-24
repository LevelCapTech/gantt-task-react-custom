import React, { useEffect, useMemo, useRef, useState } from "react";
import { resolveVisibleFields } from "../../helpers/task-helper";
import {
  ColumnState,
  ColumnsState,
  VisibleField,
} from "../../types/public-types";
import styles from "./task-list-header.module.css";
import classNames from "classnames";
import { getDefaultWidth, DEFAULT_MIN_WIDTH } from "./task-list";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const TaskListHeaderDefault: React.FC<{
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  visibleFields: VisibleField[];
  columnsState?: ColumnsState;
  setColumnsState?: React.Dispatch<React.SetStateAction<ColumnsState>>;
  enableColumnDrag?: boolean;
}> = ({
  headerHeight,
  fontFamily,
  fontSize,
  rowWidth,
  visibleFields,
  columnsState,
  setColumnsState,
  enableColumnDrag = true,
}) => {
  const labels: Record<VisibleField, string> = {
    name: "タスク名",
    start: "開始日",
    end: "終了日",
    process: "工程",
    assignee: "担当者",
    plannedStart: "予定開始",
    plannedEnd: "予定終了",
    plannedEffort: "予定工数",
    actualEffort: "実績工数",
    status: "ステータス",
  };
  const fallbackColumns = resolveVisibleFields(visibleFields).map(
    (field): ColumnState => ({
      id: field,
      label: labels[field],
      width: getDefaultWidth(field, rowWidth),
      minWidth: DEFAULT_MIN_WIDTH,
      visible: true,
    })
  );
  const resolvedColumns = useMemo(
    () =>
      (columnsState || fallbackColumns).filter(column => column.visible !== false),
    [columnsState, fallbackColumns]
  );
  const sensors = useSensors(useSensor(PointerSensor));
  const [resizingId, setResizingId] = useState<string | null>(null);
  const onDragEnd = (event: DragEndEvent) => {
    if (!setColumnsState || !enableColumnDrag) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setColumnsState(prev => {
      const visible = prev.filter(column => column.visible !== false);
      const oldIndex = visible.findIndex(column => column.id === active.id);
      const newIndex = visible.findIndex(column => column.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      const moved = arrayMove(visible, oldIndex, newIndex);
      let idx = 0;
      return prev.map(column =>
        column.visible !== false ? moved[idx++] : column
      );
    });
  };
  const headerContent = (
    <div
      className={styles.ganttTable}
      style={{
        fontFamily: fontFamily,
        fontSize: fontSize,
      }}
    >
      <div
        className={styles.ganttTable_Header}
        style={{
          height: headerHeight - 2,
        }}
      >
        {resolvedColumns.map((column, index) => (
          <React.Fragment key={column.id}>
            <SortableHeaderItem
              column={column}
              labels={labels}
              setColumnsState={setColumnsState}
              enableDrag={enableColumnDrag && !!setColumnsState}
              setResizingId={setResizingId}
              isResizing={resizingId === column.id}
            />
            {index !== resolvedColumns.length - 1 && (
              <div
                className={styles.ganttTable_HeaderSeparator}
                style={{
                  height: headerHeight * 0.5,
                  marginTop: headerHeight * 0.2,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <DndContext sensors={sensors} onDragEnd={enableColumnDrag ? onDragEnd : undefined}>
      <SortableContext
        items={resolvedColumns.map(column => column.id)}
        strategy={horizontalListSortingStrategy}
      >
        {headerContent}
      </SortableContext>
    </DndContext>
  );
};

const SortableHeaderItem: React.FC<{
  column: ColumnState;
  labels: Record<VisibleField, string>;
  setColumnsState?: React.Dispatch<React.SetStateAction<ColumnsState>>;
  enableDrag: boolean;
  setResizingId: (id: string | null) => void;
  isResizing: boolean;
}> = ({ column, labels, setColumnsState, enableDrag, setResizingId, isResizing }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    disabled: !enableDrag,
  });
  const startXRef = useRef<number | null>(null);
  const startWidthRef = useRef<number | null>(null);
  const moveHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const upHandlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      if (moveHandlerRef.current) {
        document.removeEventListener("mousemove", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (upHandlerRef.current) {
        document.removeEventListener("mouseup", upHandlerRef.current);
        upHandlerRef.current = null;
      }
    };
  }, []);

  const style: React.CSSProperties = {
    minWidth: column.width,
    maxWidth: column.width,
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onMouseDownResize: React.MouseEventHandler<HTMLDivElement> = event => {
    event.stopPropagation();
    event.preventDefault();
    startXRef.current = event.clientX;
    startWidthRef.current = column.width;
    setResizingId(column.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (startXRef.current == null || startWidthRef.current == null) return;
      const delta = moveEvent.clientX - startXRef.current;
      const nextWidth = Math.max(column.minWidth, startWidthRef.current + delta);
      setColumnsState?.(prev =>
        prev.map(item =>
          item.id === column.id ? { ...item, width: nextWidth } : item
        )
      );
    };

    const handleMouseUp = () => {
      startXRef.current = null;
      startWidthRef.current = null;
      setResizingId(null);
      if (moveHandlerRef.current) {
        document.removeEventListener("mousemove", moveHandlerRef.current);
        moveHandlerRef.current = null;
      }
      if (upHandlerRef.current) {
        document.removeEventListener("mouseup", upHandlerRef.current);
        upHandlerRef.current = null;
      }
    };

    moveHandlerRef.current = handleMouseMove;
    upHandlerRef.current = handleMouseUp;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={setNodeRef}
      className={classNames(styles.ganttTable_HeaderItem, {
        [styles.ganttTable_HeaderItemDragging]: isDragging,
      })}
      style={style}
    >
      <div
        className={classNames(styles.ganttTable_DragHandle, {
          [styles.ganttTable_DragHandleDisabled]: !enableDrag,
        })}
        {...attributes}
        {...listeners}
        aria-label="Drag column"
        onMouseDown={event => event.stopPropagation()}
      >
        <span className={styles.ganttTable_DragIcon} aria-hidden="true">
          ⋮⋮
        </span>
      </div>
      <div className={styles.ganttTable_HeaderLabel}>{labels[column.id]}</div>
      <div
        className={classNames(styles.ganttTable_ResizeHandle, {
          [styles.ganttTable_ResizeHandleActive]: isResizing,
        })}
        onMouseDown={onMouseDownResize}
        aria-label="Resize column"
        role="separator"
        aria-orientation="vertical"
      />
    </div>
  );
};
