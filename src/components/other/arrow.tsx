import React from "react";
import { BarTask } from "../../types/bar-task";
import { DependencyType } from "../../types/public-types";

type ArrowProps = {
  taskFrom: BarTask;
  taskTo: BarTask;
  dependencyType: DependencyType;
  lagPx: number;
  rowHeight: number;
  taskHeight: number;
  arrowIndent: number;
  rtl: boolean;
};
export const Arrow: React.FC<ArrowProps> = ({
  taskFrom,
  taskTo,
  dependencyType,
  lagPx,
  rowHeight,
  taskHeight,
  arrowIndent,
  rtl,
}) => {
  let path: string;
  let trianglePoints: string;
  if (rtl) {
    [path, trianglePoints] = drownPathAndTriangleRTL(
      taskFrom,
      taskTo,
      dependencyType,
      lagPx,
      rowHeight,
      taskHeight,
      arrowIndent
    );
  } else {
    [path, trianglePoints] = drownPathAndTriangle(
      taskFrom,
      taskTo,
      dependencyType,
      lagPx,
      rowHeight,
      taskHeight,
      arrowIndent
    );
  }

  return (
    <g className="arrow">
      <path strokeWidth="1.5" d={path} fill="none" />
      <polygon points={trianglePoints} />
    </g>
  );
};

const drownPathAndTriangle = (
  taskFrom: BarTask,
  taskTo: BarTask,
  dependencyType: DependencyType,
  lagPx: number,
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number
) => {
  return drawPathAndTriangleByType(
    taskFrom,
    taskTo,
    dependencyType,
    lagPx,
    rowHeight,
    taskHeight,
    arrowIndent,
    false
  );
};

const drownPathAndTriangleRTL = (
  taskFrom: BarTask,
  taskTo: BarTask,
  dependencyType: DependencyType,
  lagPx: number,
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number
) => {
  return drawPathAndTriangleByType(
    taskFrom,
    taskTo,
    dependencyType,
    lagPx,
    rowHeight,
    taskHeight,
    arrowIndent,
    true
  );
};

const drawPathAndTriangleByType = (
  taskFrom: BarTask,
  taskTo: BarTask,
  dependencyType: DependencyType,
  lagPx: number,
  rowHeight: number,
  taskHeight: number,
  arrowIndent: number,
  rtl: boolean
) => {
  const anchor = getAnchorByType(dependencyType);
  const fromX = getAnchorX(taskFrom, anchor.from, rtl);
  const toX = getAnchorX(taskTo, anchor.to, rtl);
  const indexCompare = taskFrom.index > taskTo.index ? -1 : 1;
  const fromY = taskFrom.y + taskHeight / 2;
  const toY = taskTo.y + taskHeight / 2;
  const fromDirection = getSourceDirection(anchor.from, rtl);
  const toDirection = getTargetDirection(anchor.to, rtl);
  const firstX = fromX + fromDirection * arrowIndent;
  const maxLagRange = Math.max(Math.abs(toX - firstX) + arrowIndent * 2, arrowIndent);
  const limitedLag = Math.max(Math.min(lagPx, maxLagRange), -maxLagRange);
  const tailLength = Math.max(
    Math.min(arrowIndent + limitedLag, maxLagRange),
    -maxLagRange
  );
  const preEndX = toX - toDirection * tailLength;

  const path = `M ${fromX} ${fromY} 
  h ${fromDirection * arrowIndent} 
  v ${(indexCompare * rowHeight) / 2} 
  H ${preEndX}
  V ${toY} 
  H ${toX}`;

  const trianglePoints = `${toX},${toY} 
  ${toX - toDirection * 5},${toY - 5} 
  ${toX - toDirection * 5},${toY + 5}`;
  return [path, trianglePoints];
};

const getAnchorByType = (dependencyType: DependencyType) => {
  switch (dependencyType) {
    case "SS":
      return { from: "start", to: "start" } as const;
    case "FF":
      return { from: "end", to: "end" } as const;
    case "SF":
      return { from: "start", to: "end" } as const;
    case "FS":
    default:
      return { from: "end", to: "start" } as const;
  }
};

const getAnchorX = (
  task: BarTask,
  side: "start" | "end",
  rtl: boolean
) => {
  if (side === "start") {
    return rtl ? task.x2 : task.x1;
  }
  return rtl ? task.x1 : task.x2;
};

const getSourceDirection = (side: "start" | "end", rtl: boolean) => {
  if (side === "start") {
    return rtl ? 1 : -1;
  }
  return rtl ? -1 : 1;
};

const getTargetDirection = (side: "start" | "end", rtl: boolean) => {
  if (side === "start") {
    return rtl ? -1 : 1;
  }
  return rtl ? 1 : -1;
};
