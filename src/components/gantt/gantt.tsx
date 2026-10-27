import React, {
  useState,
  SyntheticEvent,
  useRef,
  useEffect,
  useMemo,
} from "react";
import { ViewMode, GanttProps, Task } from "../../types/public-types";
import { GridProps } from "../grid/grid";
import { ganttDateRange, seedDates } from "../../helpers/date-helper";
import { CalendarProps } from "../calendar/calendar";
import { TaskGanttContentProps } from "./task-gantt-content";
import { TaskListHeaderDefault } from "../task-list/task-list-header";
import { TaskListTableDefault } from "../task-list/task-list-table";
import { StandardTooltipContent, Tooltip } from "../other/tooltip";
import { VerticalScroll } from "../other/vertical-scroll";
import { TaskListProps, TaskList } from "../task-list/task-list";
import { TaskGantt } from "./task-gantt";
import { BarTask } from "../../types/bar-task";
import {
  buildDependencyMaps,
  convertToBarTasks,
} from "../../helpers/bar-helper";
import { GanttEvent } from "../../types/gantt-task-actions";
import { DateSetup } from "../../types/date-setup";
import { HorizontalScroll } from "../other/horizontal-scroll";
import { removeHiddenTasks, sortTasks } from "../../helpers/other-helper";
import { DEFAULT_VISIBLE_FIELDS } from "../../helpers/task-helper";
import { normalizeCalendarConfig } from "../../helpers/calendar-helper";
import { normalizeActuals } from "../../helpers/actuals-helper";
import {
  computeVisibleRange,
  isVirtualizationEnabled,
} from "../../helpers/virtualization-helper";
import styles from "./gantt.module.css";

const DEFAULT_TASK_LIST_WIDTH = 450;
const MIN_PANE_WIDTH = 150;
const SPLIT_HANDLE_WIDTH = 8;

const clampTaskListWidth = (width: number, containerWidth: number) => {
  const maxWidth = Math.max(
    MIN_PANE_WIDTH,
    containerWidth - MIN_PANE_WIDTH - SPLIT_HANDLE_WIDTH
  );
  return Math.min(Math.max(width, MIN_PANE_WIDTH), maxWidth);
};

export const Gantt: React.FunctionComponent<GanttProps> = ({
  tasks,
  headerHeight = 50,
  columnWidth = 60,
  listCellWidth = "155px",
  rowHeight = 50,
  ganttHeight = 0,
  viewMode = ViewMode.Day,
  preStepsCount = 1,
  locale = "en-GB",
  calendar,
  workHoursPerDay,
  workdayStartTime,
  workdayEndTime,
  barFill = 60,
  barCornerRadius = 3,
  barProgressColor = "#a3a3ff",
  barProgressSelectedColor = "#8282f5",
  barBackgroundColor = "#b8c2cc",
  barBackgroundSelectedColor = "#aeb8c2",
  projectProgressColor = "#7db59a",
  projectProgressSelectedColor = "#59a985",
  projectBackgroundColor = "#fac465",
  projectBackgroundSelectedColor = "#f7bb53",
  milestoneBackgroundColor = "#f1c453",
  milestoneBackgroundSelectedColor = "#f29e4c",
  rtl = false,
  handleWidth = 8,
  timeStep = 300000,
  arrowColor = "grey",
  fontFamily = "Arial, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue",
  fontSize = "14px",
  arrowIndent = 20,
  todayColor = "rgba(252, 248, 227, 0.5)",
  viewDate,
  TooltipContent = StandardTooltipContent,
  TaskListHeader = TaskListHeaderDefault,
  TaskListTable = TaskListTableDefault,
  visibleFields = DEFAULT_VISIBLE_FIELDS,
  effortDisplayUnit = "MH",
  enableColumnDrag,
  enableVirtualization,
  onDateChange,
  onProgressChange,
  onDoubleClick,
  onClick,
  onDelete,
  onSelect,
  onExpanderClick,
  onTaskUpdate,
  onCellCommit,
}) => {
  // Normalize calendar configuration (only when calendar prop is provided)
  const calendarConfig = useMemo(
    () => (calendar ? normalizeCalendarConfig(calendar) : undefined),
    [calendar]
  );
  const actualsOptions = useMemo(
    () => ({
      calendarConfig,
      workHoursPerDay,
      workdayStartTime,
      workdayEndTime,
    }),
    [calendarConfig, workHoursPerDay, workdayStartTime, workdayEndTime]
  );
  const normalizedTasks = useMemo(
    () => tasks.map(task => normalizeActuals(task, actualsOptions)),
    [tasks, actualsOptions]
  );

  const wrapperRef = useRef<HTMLDivElement>(null);
  const taskListRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const taskListHeaderRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const taskListBodyRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const ganttContainerRef = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;
  const splitStartXRef = useRef<number | null>(null);
  const splitStartWidthRef = useRef<number | null>(null);
  const splitMoveHandlerRef = useRef<((event: MouseEvent) => void) | null>(null);
  const splitUpHandlerRef = useRef<(() => void) | null>(null);
  const supportsPointerEvents =
    typeof window !== "undefined" && "PointerEvent" in window;
  const [dateSetup, setDateSetup] = useState<DateSetup>(() => {
    const [startDate, endDate] = ganttDateRange(
      normalizedTasks,
      viewMode,
      preStepsCount
    );
    return { viewMode, dates: seedDates(startDate, endDate, viewMode) };
  });
  const [currentViewDate, setCurrentViewDate] = useState<Date | undefined>(
    undefined
  );

  const [taskListWidth, setTaskListWidth] = useState(DEFAULT_TASK_LIST_WIDTH);
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const [isResizing, setIsResizing] = useState(false);
  const [svgContainerWidth, setSvgContainerWidth] = useState(0);
  const [svgContainerHeight, setSvgContainerHeight] = useState(ganttHeight);
  const [barTasks, setBarTasks] = useState<BarTask[]>([]);
  const [ganttEvent, setGanttEvent] = useState<GanttEvent>({
    action: "",
  });
  const taskHeight = useMemo(
    () => (rowHeight * barFill) / 100,
    [rowHeight, barFill]
  );

  const [selectedTask, setSelectedTask] = useState<BarTask>();
  const [failedTask, setFailedTask] = useState<BarTask | null>(null);

  const svgWidth = dateSetup.dates.length * columnWidth;
  const ganttFullHeight = barTasks.length * rowHeight;

  const [scrollY, setScrollY] = useState(0);
  const [scrollXLeft, setScrollXLeft] = useState(0);
  const [scrollXRight, setScrollXRight] = useState(-1);
  const [leftScrollerWidth, setLeftScrollerWidth] = useState(1430);
  const ignoreScrollLeftRef = useRef(false);
  const ignoreScrollRightRef = useRef(false);

  // 仮想化が有効かどうか（plan §1）
  const virtEnabled = useMemo(
    () => isVirtualizationEnabled(enableVirtualization, ganttHeight, rowHeight),
    [enableVirtualization, ganttHeight, rowHeight]
  );

  // 仮想化: 表示行の範囲計算（plan §3.1）
  const visibleRange = useMemo(
    () =>
      computeVisibleRange(barTasks.length, scrollY, ganttHeight, rowHeight, virtEnabled),
    [barTasks.length, scrollY, ganttHeight, rowHeight, virtEnabled]
  );

  // 仮想化: 依存Mapを barTasks から構築（plan §3.3）
  const dependencyMaps = useMemo(
    () => (virtEnabled ? buildDependencyMaps(barTasks) : undefined),
    [virtEnabled, barTasks]
  );

  // 仮想化: 描画対象の barTasks スライス
  const visibleBarTasks = useMemo(
    () =>
      virtEnabled
        ? barTasks.slice(visibleRange.start, visibleRange.end)
        : barTasks,
    [virtEnabled, barTasks, visibleRange.start, visibleRange.end]
  );

  // 仮想化: タスクリストに渡す Task スライス（座標計算不要）
  const visibleTasks = useMemo(
    () =>
      virtEnabled
        ? (barTasks.slice(visibleRange.start, visibleRange.end) as Task[])
        : (barTasks as Task[]),
    [virtEnabled, barTasks, visibleRange.start, visibleRange.end]
  );

  // task change events
  useEffect(() => {
    let filteredTasks: Task[];
    if (onExpanderClick) {
      filteredTasks = removeHiddenTasks(normalizedTasks);
    } else {
      filteredTasks = normalizedTasks;
    }
    filteredTasks = filteredTasks.sort(sortTasks);
    const [startDate, endDate] = ganttDateRange(
      filteredTasks,
      viewMode,
      preStepsCount
    );
    let newDates = seedDates(startDate, endDate, viewMode);
    if (rtl) {
      newDates = newDates.reverse();
      if (scrollXRight === -1) {
        setScrollXRight(newDates.length * columnWidth);
      }
    }
    setDateSetup({ dates: newDates, viewMode });
    setBarTasks(
      convertToBarTasks(
        filteredTasks,
        newDates,
        columnWidth,
        rowHeight,
        taskHeight,
        barCornerRadius,
        handleWidth,
        rtl,
        barProgressColor,
        barProgressSelectedColor,
        barBackgroundColor,
        barBackgroundSelectedColor,
        projectProgressColor,
        projectProgressSelectedColor,
        projectBackgroundColor,
        projectBackgroundSelectedColor,
        milestoneBackgroundColor,
        milestoneBackgroundSelectedColor
      )
    );
  }, [
    normalizedTasks,
    viewMode,
    preStepsCount,
    rowHeight,
    barCornerRadius,
    columnWidth,
    taskHeight,
    handleWidth,
    barProgressColor,
    barProgressSelectedColor,
    barBackgroundColor,
    barBackgroundSelectedColor,
    projectProgressColor,
    projectProgressSelectedColor,
    projectBackgroundColor,
    projectBackgroundSelectedColor,
    milestoneBackgroundColor,
    milestoneBackgroundSelectedColor,
    rtl,
    scrollXRight,
    onExpanderClick,
  ]);

  useEffect(() => {
    if (
      viewMode === dateSetup.viewMode &&
      ((viewDate && !currentViewDate) ||
        (viewDate && currentViewDate?.valueOf() !== viewDate.valueOf()))
    ) {
      const dates = dateSetup.dates;
      const index = dates.findIndex(
        (d, i) =>
          viewDate.valueOf() >= d.valueOf() &&
          i + 1 !== dates.length &&
          viewDate.valueOf() < dates[i + 1].valueOf()
      );
      if (index === -1) {
        return;
      }
      setCurrentViewDate(viewDate);
      setScrollXRight(columnWidth * index);
    }
  }, [
    viewDate,
    columnWidth,
    dateSetup.dates,
    dateSetup.viewMode,
    viewMode,
    currentViewDate,
    setCurrentViewDate,
  ]);

  useEffect(() => {
    const { changedTask, action } = ganttEvent;
    if (changedTask) {
      if (action === "delete") {
        setGanttEvent({ action: "" });
        setBarTasks(barTasks.filter(t => t.id !== changedTask.id));
      } else if (
        action === "move" ||
        action === "end" ||
        action === "start" ||
        action === "progress"
      ) {
        const prevStateTask = barTasks.find(t => t.id === changedTask.id);
        if (
          prevStateTask &&
          (prevStateTask.start.getTime() !== changedTask.start.getTime() ||
            prevStateTask.end.getTime() !== changedTask.end.getTime() ||
            prevStateTask.progress !== changedTask.progress)
        ) {
          // actions for change
          const newTaskList = barTasks.map(t =>
            t.id === changedTask.id ? changedTask : t
          );
          setBarTasks(newTaskList);
        }
      }
    }
  }, [ganttEvent, barTasks]);

  useEffect(() => {
    if (failedTask) {
      setBarTasks(barTasks.map(t => (t.id !== failedTask.id ? t : failedTask)));
      setFailedTask(null);
    }
  }, [failedTask, barTasks]);

  useEffect(() => {
    const updateWrapperWidth = () => {
      if (wrapperRef.current) {
        setWrapperWidth(wrapperRef.current.offsetWidth);
      }
    };
    updateWrapperWidth();
    window.addEventListener("resize", updateWrapperWidth);
    return () => window.removeEventListener("resize", updateWrapperWidth);
  }, []);

  useEffect(() => {
    if (!listCellWidth) {
      setTaskListWidth(0);
      return;
    }
    if (wrapperWidth) {
      setTaskListWidth(prev => clampTaskListWidth(prev, wrapperWidth));
    }
  }, [listCellWidth, wrapperWidth]);

  const taskListOffset = listCellWidth
    ? taskListWidth + SPLIT_HANDLE_WIDTH
    : 0;

  useEffect(() => {
    if (wrapperWidth) {
      setSvgContainerWidth(Math.max(wrapperWidth - taskListOffset, 0));
    }
  }, [wrapperWidth, taskListOffset]);

  useEffect(() => {
    if (ganttHeight) {
      setSvgContainerHeight(ganttHeight + headerHeight);
    } else {
      setSvgContainerHeight(normalizedTasks.length * rowHeight + headerHeight);
    }
  }, [ganttHeight, normalizedTasks, headerHeight, rowHeight]);

  useEffect(() => {
    return () => {
      if (splitMoveHandlerRef.current) {
        document.removeEventListener("mousemove", splitMoveHandlerRef.current);
        splitMoveHandlerRef.current = null;
      }
      if (splitUpHandlerRef.current) {
        document.removeEventListener("mouseup", splitUpHandlerRef.current);
        splitUpHandlerRef.current = null;
      }
    };
  }, []);

  // scroll events
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (event.shiftKey || event.deltaX) {
        const scrollMove = event.deltaX ? event.deltaX : event.deltaY;
        let newScrollX = scrollXRight + scrollMove;
        if (newScrollX < 0) {
          newScrollX = 0;
        } else if (newScrollX > svgWidth) {
          newScrollX = svgWidth;
        }
        ignoreScrollRightRef.current = true;
        setScrollXRight(newScrollX);
        event.preventDefault();
      } else if (ganttHeight) {
        let newScrollY = scrollY + event.deltaY;
        if (newScrollY < 0) {
          newScrollY = 0;
        } else if (newScrollY > ganttFullHeight - ganttHeight) {
          newScrollY = ganttFullHeight - ganttHeight;
        }
        if (newScrollY !== scrollY) {
          setScrollY(newScrollY);
          event.preventDefault();
        }
      }
    };

    // subscribe if scroll is necessary
    const wrapperEl = wrapperRef.current;
    wrapperEl?.addEventListener("wheel", handleWheel, {
      passive: false,
    });
    return () => {
      wrapperEl?.removeEventListener("wheel", handleWheel);
    };
  }, [
    scrollY,
    scrollXRight,
    ganttHeight,
    svgWidth,
    rtl,
    ganttFullHeight,
  ]);

  // update left scroller width from the task list body content
  useEffect(() => {
    const updateLeftScroller = () => {
      const el = taskListBodyRef.current;
      if (el) {
        setLeftScrollerWidth(el.scrollWidth || 0);
      }
    };
    updateLeftScroller();
    const RO = (window as any).ResizeObserver;
    const ro = RO ? new RO(updateLeftScroller) : null;
    if (ro && taskListBodyRef.current) {
      ro.observe(taskListBodyRef.current);
    }
    window.addEventListener("resize", updateLeftScroller);
    return () => {
      if (ro) {
        ro.disconnect();
      }
      window.removeEventListener("resize", updateLeftScroller);
    };
  }, [
    normalizedTasks,
    fontFamily,
    fontSize,
    listCellWidth,
    taskListBodyRef,
    visibleFields,
  ]);

  const handleScrollY = (event: SyntheticEvent<HTMLDivElement>) => {
    if (scrollY !== event.currentTarget.scrollTop && !ignoreScrollLeftRef.current) {
      setScrollY(event.currentTarget.scrollTop);
      ignoreScrollLeftRef.current = true;
    } else {
      ignoreScrollLeftRef.current = false;
    }
  };

  const handleScrollLeft = (event: SyntheticEvent<HTMLDivElement>) => {
    if (
      scrollXLeft !== event.currentTarget.scrollLeft &&
      !ignoreScrollLeftRef.current
    ) {
      setScrollXLeft(event.currentTarget.scrollLeft);
      ignoreScrollLeftRef.current = true;
    } else {
      ignoreScrollLeftRef.current = false;
    }
  };

  const handleScrollRight = (event: SyntheticEvent<HTMLDivElement>) => {
    if (
      scrollXRight !== event.currentTarget.scrollLeft &&
      !ignoreScrollRightRef.current
    ) {
      setScrollXRight(event.currentTarget.scrollLeft);
      ignoreScrollRightRef.current = true;
    } else {
      ignoreScrollRightRef.current = false;
    }
    if (ganttContainerRef.current && ganttContainerRef.current.scrollLeft !== event.currentTarget.scrollLeft) {
      ganttContainerRef.current.scrollLeft = event.currentTarget.scrollLeft;
    }
  };

  /**
   * Handles arrow keys events and transform it to new scroll
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement) {
      if (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        return;
      }
    }
    event.preventDefault();
    let newScrollY = scrollY;
    let newScrollX = scrollXRight;
    let isX = true;
    switch (event.key) {
      case "Down": // IE/Edge specific value
      case "ArrowDown":
        newScrollY += rowHeight;
        isX = false;
        break;
      case "Up": // IE/Edge specific value
      case "ArrowUp":
        newScrollY -= rowHeight;
        isX = false;
        break;
      case "Left":
      case "ArrowLeft":
        newScrollX -= columnWidth;
        break;
      case "Right": // IE/Edge specific value
      case "ArrowRight":
        newScrollX += columnWidth;
        break;
    }
    if (isX) {
      if (newScrollX < 0) {
        newScrollX = 0;
      } else if (newScrollX > svgWidth) {
        newScrollX = svgWidth;
      }
      ignoreScrollRightRef.current = true;
      setScrollXRight(newScrollX);
    } else {
      if (newScrollY < 0) {
        newScrollY = 0;
      } else if (newScrollY > ganttFullHeight - ganttHeight) {
        newScrollY = ganttFullHeight - ganttHeight;
      }
      setScrollY(newScrollY);
    }
  };

  /**
   * Task select event
   */
  const handleSelectedTask = (taskId: string) => {
    const newSelectedTask = barTasks.find(t => t.id === taskId);
    const oldSelectedTask = barTasks.find(
      t => !!selectedTask && t.id === selectedTask.id
    );
    if (onSelect) {
      if (oldSelectedTask) {
        onSelect(oldSelectedTask, false);
      }
      if (newSelectedTask) {
        onSelect(newSelectedTask, true);
      }
    }
    setSelectedTask(newSelectedTask);
  };
  const handleExpanderClick = (task: Task) => {
    if (onExpanderClick && task.hideChildren !== undefined) {
      onExpanderClick({ ...task, hideChildren: !task.hideChildren });
    }
  };

  const updateTaskListWidth = (clientX: number) => {
    if (splitStartXRef.current == null || splitStartWidthRef.current == null) {
      return;
    }
    if (!wrapperRef.current) {
      return;
    }
    const delta = clientX - splitStartXRef.current;
    const nextWidth = clampTaskListWidth(
      splitStartWidthRef.current + delta,
      wrapperRef.current.offsetWidth
    );
    setTaskListWidth(nextWidth);
  };

  const handleSplitPointerDown: React.PointerEventHandler<HTMLDivElement> =
    event => {
      event.preventDefault();
      splitStartXRef.current = event.clientX;
      splitStartWidthRef.current = taskListWidth;
      setIsResizing(true);
      if (event.currentTarget.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
    };

  const handleSplitPointerMove: React.PointerEventHandler<HTMLDivElement> =
    event => {
      updateTaskListWidth(event.clientX);
    };

  const handleSplitPointerUp: React.PointerEventHandler<HTMLDivElement> = event => {
    splitStartXRef.current = null;
    splitStartWidthRef.current = null;
    setIsResizing(false);
    if (event.currentTarget.releasePointerCapture) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleSplitMouseDown: React.MouseEventHandler<HTMLDivElement> = event => {
    event.preventDefault();
    splitStartXRef.current = event.clientX;
    splitStartWidthRef.current = taskListWidth;
    setIsResizing(true);
    if (splitMoveHandlerRef.current) {
      document.removeEventListener("mousemove", splitMoveHandlerRef.current);
    }
    if (splitUpHandlerRef.current) {
      document.removeEventListener("mouseup", splitUpHandlerRef.current);
    }
    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTaskListWidth(moveEvent.clientX);
    };
    const handleMouseUp = () => {
      splitStartXRef.current = null;
      splitStartWidthRef.current = null;
      setIsResizing(false);
      if (splitMoveHandlerRef.current) {
        document.removeEventListener("mousemove", splitMoveHandlerRef.current);
        splitMoveHandlerRef.current = null;
      }
      if (splitUpHandlerRef.current) {
        document.removeEventListener("mouseup", splitUpHandlerRef.current);
        splitUpHandlerRef.current = null;
      }
    };
    splitMoveHandlerRef.current = handleMouseMove;
    splitUpHandlerRef.current = handleMouseUp;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const gridProps: GridProps = {
    columnWidth,
    svgWidth,
    tasks: virtEnabled ? visibleTasks : normalizedTasks,
    rowHeight,
    dates: dateSetup.dates,
    todayColor,
    rtl,
    calendarConfig,
    // 仮想化時: 描画開始行の絶対インデックスと全行数を渡す
    virtualStart: virtEnabled ? visibleRange.start : undefined,
    totalRowCount: virtEnabled ? barTasks.length : undefined,
  };
  const calendarProps: CalendarProps = {
    dateSetup,
    locale,
    viewMode,
    headerHeight,
    columnWidth,
    fontFamily,
    fontSize,
    rtl,
    calendarConfig,
  };
  const barProps: TaskGanttContentProps = {
    tasks: visibleBarTasks,
    dates: dateSetup.dates,
    ganttEvent,
    selectedTask,
    rowHeight,
    taskHeight,
    columnWidth,
    arrowColor,
    timeStep,
    fontFamily,
    fontSize,
    arrowIndent,
    svgWidth,
    rtl,
    setGanttEvent,
    setFailedTask,
    setSelectedTask: handleSelectedTask,
    onDateChange,
    onProgressChange,
    onDoubleClick,
    onClick,
    onDelete,
    // 仮想化: viewport 範囲と依存Mapを渡す
    viewStart: virtEnabled ? visibleRange.viewStart : undefined,
    viewEnd: virtEnabled ? visibleRange.viewEnd : undefined,
    allBarTasks: virtEnabled ? barTasks : undefined,
    dependencyMaps: virtEnabled ? dependencyMaps : undefined,
  };

  const tableProps: TaskListProps = {
    rowHeight,
    rowWidth: listCellWidth,
    fontFamily,
    fontSize,
    tasks: barTasks,
    headerHeight,
    scrollY,
    horizontalScroll: scrollXLeft,
    ganttHeight,
    horizontalContainerClass: styles.horizontalContainer,
    headerContainerRef: taskListHeaderRef,
    bodyContainerRef: taskListBodyRef,
    onHorizontalScroll: handleScrollLeft,
    selectedTask,
    taskListRef,
    setSelectedTask: handleSelectedTask,
    onExpanderClick: handleExpanderClick,
    TaskListHeader,
    TaskListTable,
    visibleFields,
    onUpdateTask: onTaskUpdate,
    onCellCommit,
    effortDisplayUnit,
    enableColumnDrag,
    actualsOptions,
    // 仮想化: 描画範囲と全行数を渡す
    virtualStart: virtEnabled ? visibleRange.start : undefined,
    virtualEnd: virtEnabled ? visibleRange.end : undefined,
    totalRowCount: virtEnabled ? barTasks.length : undefined,
  };
  return (
    <div>
      <div
        className={styles.wrapper}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        ref={wrapperRef}
      >
        {listCellWidth && (
          <div
            className={styles.taskListPanel}
            style={{ width: taskListWidth }}
            data-testid="task-list-panel"
          >
            <TaskList {...tableProps} />
          </div>
        )}
        {listCellWidth && (
          <div
            className={`${styles.splitHandle} ${
              isResizing ? styles.splitHandleActive : ""
            }`}
            onPointerDown={supportsPointerEvents ? handleSplitPointerDown : undefined}
            onPointerMove={supportsPointerEvents ? handleSplitPointerMove : undefined}
            onPointerUp={supportsPointerEvents ? handleSplitPointerUp : undefined}
            onPointerCancel={supportsPointerEvents ? handleSplitPointerUp : undefined}
            onMouseDown={supportsPointerEvents ? undefined : handleSplitMouseDown}
            role="separator"
            aria-label="Task/Schedule divider"
            aria-orientation="vertical"
            data-testid="pane-splitter"
          />
        )}
        <div
          className={styles.ganttPanel}
          style={{ minWidth: MIN_PANE_WIDTH }}
          data-testid="gantt-panel"
        >
          <TaskGantt
            gridProps={gridProps}
            calendarProps={calendarProps}
            barProps={barProps}
            ganttHeight={ganttHeight}
            scrollY={scrollY}
            scrollX={scrollXRight}
            verticalGanttContainerRef={ganttContainerRef}
            svgFullHeight={virtEnabled ? ganttFullHeight : undefined}
          />
        </div>
        {ganttEvent.changedTask && (
          <Tooltip
            arrowIndent={arrowIndent}
            rowHeight={rowHeight}
            svgContainerHeight={svgContainerHeight}
            svgContainerWidth={svgContainerWidth}
            fontFamily={fontFamily}
            fontSize={fontSize}
             scrollX={scrollXRight}
            scrollY={scrollY}
            task={ganttEvent.changedTask}
            headerHeight={headerHeight}
            taskListWidth={taskListOffset}
            TooltipContent={TooltipContent}
            rtl={rtl}
            svgWidth={svgWidth}
            effortDisplayUnit={effortDisplayUnit}
          />
        )}
        <VerticalScroll
          ganttFullHeight={ganttFullHeight}
          ganttHeight={ganttHeight}
          headerHeight={headerHeight}
          scroll={scrollY}
          onScroll={handleScrollY}
          rtl={rtl}
        />
      </div>
      <div className={styles.scrollRow} style={{ "--splitter-width": `${SPLIT_HANDLE_WIDTH}px` } as React.CSSProperties}>
        <div className={styles.scrollCellLeft}>
          {listCellWidth && (
            <HorizontalScroll
              svgWidth={taskListWidth}
              scrollerWidth={leftScrollerWidth}
              scroll={scrollXLeft}
              rtl={rtl}
              onScroll={handleScrollLeft}
            />
          )}
        </div>
        {listCellWidth && <div className={styles.scrollSplitter} />}
        <div className={styles.scrollCellRight}>
          <HorizontalScroll
            svgWidth={svgWidth}
            scroll={scrollXRight}
            rtl={rtl}
            onScroll={handleScrollRight}
          />
        </div>
      </div>
    </div>
  );
};
