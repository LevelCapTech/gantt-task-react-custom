import React, { useRef, useEffect } from "react";
import { GridProps, Grid } from "../grid/grid";
import { CalendarProps, Calendar } from "../calendar/calendar";
import { TaskGanttContentProps, TaskGanttContent } from "./task-gantt-content";
import styles from "./gantt.module.css";

export type TaskGanttProps = {
  gridProps: GridProps;
  calendarProps: CalendarProps;
  barProps: TaskGanttContentProps;
  ganttHeight: number;
  scrollY: number;
  scrollX: number;
  verticalGanttContainerRef?: React.RefObject<HTMLDivElement>;
  /** 仮想化が有効な場合の SVG 全高（totalRowCount * rowHeight）。省略時は tasks.length * rowHeight */
  svgFullHeight?: number;
};
export const TaskGantt: React.FC<TaskGanttProps> = ({
  gridProps,
  calendarProps,
  barProps,
  ganttHeight,
  scrollY,
  scrollX,
  verticalGanttContainerRef,
  svgFullHeight,
}) => {
  const ganttSVGRef = useRef<SVGSVGElement>(null) as React.RefObject<SVGSVGElement>;
  const horizontalContainerRef = useRef<HTMLDivElement>(null);
  const internalVerticalRef = useRef<HTMLDivElement>(null);
  const ganttContainerRef = verticalGanttContainerRef || internalVerticalRef;
  const newBarProps = { ...barProps, svg: ganttSVGRef };

  useEffect(() => {
    if (horizontalContainerRef.current) {
      horizontalContainerRef.current.scrollTop = scrollY;
    }
  }, [scrollY]);

  useEffect(() => {
    if (ganttContainerRef.current) {
      ganttContainerRef.current.scrollLeft = scrollX;
    }
  }, [scrollX, ganttContainerRef]);

  // SVG の高さ: 仮想化有効時は svgFullHeight、それ以外は tasks.length * rowHeight
  const svgHeight =
    svgFullHeight !== undefined
      ? svgFullHeight
      : barProps.rowHeight * barProps.tasks.length;

  return (
    <div
      className={styles.ganttVerticalContainer}
      ref={ganttContainerRef}
      dir="ltr"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={gridProps.svgWidth}
        height={calendarProps.headerHeight}
        fontFamily={barProps.fontFamily}
      >
        <Calendar {...calendarProps} />
      </svg>
      <div
        ref={horizontalContainerRef}
        className={styles.horizontalContainer}
        style={
          ganttHeight
            ? { height: ganttHeight, width: gridProps.svgWidth }
            : { width: gridProps.svgWidth }
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={gridProps.svgWidth}
          height={svgHeight}
          fontFamily={barProps.fontFamily}
          ref={ganttSVGRef}
        >
          <Grid {...gridProps} />
          <TaskGanttContent {...newBarProps} />
        </svg>
      </div>
    </div>
  );
};
