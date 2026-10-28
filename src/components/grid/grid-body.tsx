import React, { ReactNode } from "react";
import { Task } from "../../types/public-types";
import { addToDate } from "../../helpers/date-helper";
import {
  isWorkingDay,
  NormalizedCalendarConfig,
} from "../../helpers/calendar-helper";
import styles from "./grid.module.css";

export type GridBodyProps = {
  tasks: Task[];
  dates: Date[];
  svgWidth: number;
  rowHeight: number;
  columnWidth: number;
  todayColor: string;
  rtl: boolean;
  calendarConfig?: NormalizedCalendarConfig;
  /** 仮想化が有効な場合の描画開始行インデックス（含む）。省略時は 0 */
  virtualStart?: number;
  /** 全行数（仮想化有効時の全高計算に使用）。省略時は tasks.length */
  totalRowCount?: number;
};
export const GridBody: React.FC<GridBodyProps> = ({
  tasks,
  dates,
  rowHeight,
  svgWidth,
  columnWidth,
  todayColor,
  rtl,
  calendarConfig,
  virtualStart = 0,
  totalRowCount,
}) => {
  // 行背景と行区切りを描画する（仮想化時は tasks が部分配列になる）
  const gridRows: ReactNode[] = [];
  const rowLines: ReactNode[] = [
    <line
      key="RowLineFirst"
      x="0"
      y1={0}
      x2={svgWidth}
      y2={0}
      className={styles.gridRowLine}
    />,
  ];

  tasks.forEach((task, localIndex) => {
    const y = (virtualStart + localIndex) * rowHeight;
    gridRows.push(
      <rect
        key={"Row" + task.id}
        x="0"
        y={y}
        width={svgWidth}
        height={rowHeight}
        className={styles.gridRow}
      />
    );
    rowLines.push(
      <line
        key={"RowLine" + task.id}
        x="0"
        y1={y + rowHeight}
        x2={svgWidth}
        y2={y + rowHeight}
        className={styles.gridRowLine}
      />
    );
  });

  // 日付列ごとの縦線・非稼働日 rect は全高で描画（plan §3.2 / §7）
  const totalRows = totalRowCount ?? tasks.length;
  const fullHeight = totalRows * rowHeight;

  const now = new Date();
  let tickX = 0;
  const ticks: ReactNode[] = [];
  const nonWorkingDays: ReactNode[] = [];
  let today: ReactNode = <rect />;
  for (let i = 0; i < dates.length; i++) {
    const date = dates[i];
    ticks.push(
      <line
        key={date.getTime()}
        x1={tickX}
        y1={0}
        x2={tickX}
        y2={fullHeight}
        className={styles.gridTick}
      />
    );

    // 非稼働日ハイライト
    if (
      calendarConfig &&
      calendarConfig.highlightNonWorkingDays &&
      !isWorkingDay(date, calendarConfig)
    ) {
      nonWorkingDays.push(
        <rect
          key={`non-working-${date.getTime()}`}
          x={tickX}
          y={0}
          width={columnWidth}
          height={fullHeight}
          fill="rgba(0, 0, 0, 0.05)"
        />
      );
    }

    if (
      (i + 1 !== dates.length &&
        date.getTime() < now.getTime() &&
        dates[i + 1].getTime() >= now.getTime()) ||
      // if current date is last
      (i !== 0 &&
        i + 1 === dates.length &&
        date.getTime() < now.getTime() &&
        addToDate(
          date,
          date.getTime() - dates[i - 1].getTime(),
          "millisecond"
        ).getTime() >= now.getTime())
    ) {
      today = (
        <rect
          x={tickX}
          y={0}
          width={columnWidth}
          height={fullHeight}
          fill={todayColor}
        />
      );
    }
    // rtl for today
    if (
      rtl &&
      i + 1 !== dates.length &&
      date.getTime() >= now.getTime() &&
      dates[i + 1].getTime() < now.getTime()
    ) {
      today = (
        <rect
          x={tickX + columnWidth}
          y={0}
          width={columnWidth}
          height={fullHeight}
          fill={todayColor}
        />
      );
    }
    tickX += columnWidth;
  }
  return (
    <g className="gridBody">
      <g className="rows">{gridRows}</g>
      <g className="nonWorkingDays">{nonWorkingDays}</g>
      <g className="rowLines">{rowLines}</g>
      <g className="ticks">{ticks}</g>
      <g className="today">{today}</g>
    </g>
  );
};
