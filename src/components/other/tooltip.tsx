import React, { useRef, useEffect, useState } from "react";
import { EffortUnit, Task } from "../../types/public-types";
import { BarTask } from "../../types/bar-task";
import {
  formatDate,
  formatEffort,
  getStatusBadgeText,
  getStatusColor,
  normalizeProcess,
  normalizeStatus,
} from "../../helpers/task-helper";
import styles from "./tooltip.module.css";

export type TooltipProps = {
  task: BarTask;
  arrowIndent: number;
  rtl: boolean;
  svgContainerHeight: number;
  svgContainerWidth: number;
  svgWidth: number;
  headerHeight: number;
  taskListWidth: number;
  scrollX: number;
  scrollY: number;
  rowHeight: number;
  fontSize: string;
  fontFamily: string;
  TooltipContent: React.FC<{
    task: Task;
    fontSize: string;
    fontFamily: string;
    effortDisplayUnit?: EffortUnit;
  }>;
  effortDisplayUnit: EffortUnit;
};
export const Tooltip: React.FC<TooltipProps> = ({
  task,
  rowHeight,
  rtl,
  svgContainerHeight,
  svgContainerWidth,
  scrollX,
  scrollY,
  arrowIndent,
  fontSize,
  fontFamily,
  headerHeight,
  taskListWidth,
  TooltipContent,
  effortDisplayUnit,
}) => {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [relatedY, setRelatedY] = useState(0);
  const [relatedX, setRelatedX] = useState(0);
  useEffect(() => {
    if (tooltipRef.current) {
      const tooltipHeight = tooltipRef.current.offsetHeight * 1.1;
      const tooltipWidth = tooltipRef.current.offsetWidth * 1.1;

      let newRelatedY = task.index * rowHeight - scrollY + headerHeight;
      let newRelatedX: number;
      if (rtl) {
        newRelatedX = task.x1 - arrowIndent * 1.5 - tooltipWidth - scrollX;
        if (newRelatedX < 0) {
          newRelatedX = task.x2 + arrowIndent * 1.5 - scrollX;
        }
        const tooltipLeftmostPoint = tooltipWidth + newRelatedX;
        if (tooltipLeftmostPoint > svgContainerWidth) {
          newRelatedX = svgContainerWidth - tooltipWidth;
          newRelatedY += rowHeight;
        }
      } else {
        newRelatedX = task.x2 + arrowIndent * 1.5 + taskListWidth - scrollX;
        const tooltipLeftmostPoint = tooltipWidth + newRelatedX;
        const fullChartWidth = taskListWidth + svgContainerWidth;
        if (tooltipLeftmostPoint > fullChartWidth) {
          newRelatedX =
            task.x1 +
            taskListWidth -
            arrowIndent * 1.5 -
            scrollX -
            tooltipWidth;
        }
        if (newRelatedX < taskListWidth) {
          newRelatedX = svgContainerWidth + taskListWidth - tooltipWidth;
          newRelatedY += rowHeight;
        }
      }

      const tooltipLowerPoint = tooltipHeight + newRelatedY - scrollY;
      if (tooltipLowerPoint > svgContainerHeight - scrollY) {
        newRelatedY = svgContainerHeight - tooltipHeight;
      }
      setRelatedY(newRelatedY);
      setRelatedX(newRelatedX);
    }
  }, [
    tooltipRef,
    task,
    arrowIndent,
    scrollX,
    scrollY,
    headerHeight,
    taskListWidth,
    rowHeight,
    svgContainerHeight,
    svgContainerWidth,
    rtl,
  ]);

  return (
    <div
      ref={tooltipRef}
      className={
        relatedX
          ? styles.tooltipDetailsContainer
          : styles.tooltipDetailsContainerHidden
      }
      style={{ left: relatedX, top: relatedY }}
    >
      <TooltipContent
        task={task}
        fontSize={fontSize}
        fontFamily={fontFamily}
        effortDisplayUnit={effortDisplayUnit}
      />
    </div>
  );
};

export const StandardTooltipContent: React.FC<{
  task: Task;
  fontSize: string;
  fontFamily: string;
  effortDisplayUnit?: EffortUnit;
}> = ({ task, fontSize, fontFamily, effortDisplayUnit = "MH" }) => {
  const style = {
    fontSize,
    fontFamily,
  };
  const normalizedStatus = normalizeStatus(task.status);
  const normalizedProcess = normalizeProcess(task.process);
  const dateRange = `${formatDate(task.start)} 〜 ${formatDate(task.end)}`;
  const plannedRange =
    task.plannedStart || task.plannedEnd
      ? `${formatDate(task.plannedStart)} 〜 ${formatDate(task.plannedEnd)}`
      : "";
  const plannedEffort = formatEffort(task.plannedEffort, effortDisplayUnit);
  const actualEffort = formatEffort(task.actualEffort, effortDisplayUnit);
  return (
    <div className={styles.tooltipDefaultContainer} style={style}>
      <div className={styles.tooltipTitle}>
        <b className={styles.tooltipName}>{task.name}</b>
        <span className={styles.tooltipDate}>{dateRange}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>工程</span>
        <span className={styles.tooltipValue}>{normalizedProcess}</span>
      </div>
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>担当</span>
        <span className={styles.tooltipValue}>{task.assignee || "-"}</span>
      </div>
      {plannedRange && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>予定</span>
          <span className={styles.tooltipValue}>{plannedRange}</span>
        </div>
      )}
      {plannedEffort && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>予定工数</span>
          <span className={styles.tooltipValue}>{plannedEffort}</span>
        </div>
      )}
      {actualEffort && (
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>実績工数</span>
          <span className={styles.tooltipValue}>{actualEffort}</span>
        </div>
      )}
      <div className={styles.tooltipRow}>
        <span className={styles.tooltipLabel}>ステータス</span>
        <span className={styles.tooltipValue}>
          <span
            className={styles.tooltipStatus}
            style={{ backgroundColor: getStatusColor(normalizedStatus) }}
          >
            {getStatusBadgeText(normalizedStatus)}
          </span>
          <span className={styles.tooltipStatusText}>{normalizedStatus}</span>
        </span>
      </div>
      {!!task.progress && (
        <p className={styles.tooltipDefaultContainerParagraph}>
          進捗率: {task.progress} %
        </p>
      )}
    </div>
  );
};
