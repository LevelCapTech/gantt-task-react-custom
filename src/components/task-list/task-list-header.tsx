import React from "react";
import { resolveVisibleFields } from "../../helpers/task-helper";
import { VisibleField } from "../../types/public-types";
import styles from "./task-list-header.module.css";

export const TaskListHeaderDefault: React.FC<{
  headerHeight: number;
  rowWidth: string;
  fontFamily: string;
  fontSize: string;
  visibleFields: VisibleField[];
}> = ({ headerHeight, fontFamily, fontSize, rowWidth, visibleFields }) => {
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
  const columns = resolveVisibleFields(visibleFields);
  const getColumnWidth = (column: VisibleField) =>
    column === "name" ? "140px" : rowWidth;
  return (
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
        {columns.map((column, index) => (
          <React.Fragment key={column}>
            <div
              className={styles.ganttTable_HeaderItem}
              style={{
                minWidth: getColumnWidth(column),
                paddingLeft: 6,
                paddingRight: 6,
              }}
            >
              &nbsp;{labels[column]}
            </div>
            {index !== columns.length - 1 && (
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
};
