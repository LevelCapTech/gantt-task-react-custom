import React, { useEffect, useRef, useState, useMemo } from "react";
import { BarTask } from "../../types/bar-task";
import { GanttContentMoveAction } from "../../types/gantt-task-actions";
import {
  getStatusBadgeText,
  getStatusColor,
  normalizeStatus,
} from "../../helpers/task-helper";
import { Bar } from "./bar/bar";
import { BarSmall } from "./bar/bar-small";
import { Milestone } from "./milestone/milestone";
import { Project } from "./project/project";
import style from "./task-list.module.css";

export type TaskItemProps = {
  task: BarTask;
  arrowIndent: number;
  taskHeight: number;
  isProgressChangeable: boolean;
  isDateChangeable: boolean;
  isDelete: boolean;
  isSelected: boolean;
  rtl: boolean;
  onEventStart: (
    action: GanttContentMoveAction,
    selectedTask: BarTask,
    event?: React.MouseEvent | React.KeyboardEvent
  ) => any;
};

export const TaskItem: React.FC<TaskItemProps> = props => {
  const {
    task,
    arrowIndent,
    isDelete,
    taskHeight,
    isSelected,
    rtl,
    onEventStart,
    isProgressChangeable,
    isDateChangeable,
  } = {
    ...props,
  };
  const textRef = useRef<SVGTextElement>(null);
  const [taskItem, setTaskItem] = useState<JSX.Element>(<div />);
  const [isTextInside, setIsTextInside] = useState(true);
  const normalizedStatus = normalizeStatus(task.status);
  const statusColor = getStatusColor(normalizedStatus);
  const statusBadgeText = getStatusBadgeText(normalizedStatus);

  const taskItemProps = useMemo(
    () => ({
      task,
      arrowIndent,
      taskHeight,
      isProgressChangeable,
      isDateChangeable,
      isDelete,
      isSelected,
      rtl,
      onEventStart,
    }),
    [
      task,
      arrowIndent,
      taskHeight,
      isProgressChangeable,
      isDateChangeable,
      isDelete,
      isSelected,
      rtl,
      onEventStart,
    ]
  );

  useEffect(() => {
    switch (task.typeInternal) {
      case "milestone":
        setTaskItem(<Milestone {...taskItemProps} />);
        break;
      case "project":
        setTaskItem(<Project {...taskItemProps} />);
        break;
      case "smalltask":
        setTaskItem(<BarSmall {...taskItemProps} />);
        break;
      default:
        setTaskItem(<Bar {...taskItemProps} />);
        break;
    }
  }, [
    task,
    task.typeInternal,
    taskItemProps,
  ]);

  const getBBoxWidth = () => {
    if (!textRef.current || typeof textRef.current.getBBox !== "function") {
      return 0;
    }
    return textRef.current.getBBox().width;
  };

  useEffect(() => {
    setIsTextInside(getBBoxWidth() < task.x2 - task.x1);
  }, [textRef, task]);

  const getX = () => {
    const width = task.x2 - task.x1;
    const hasChild = task.barChildren.length > 0;
    if (isTextInside) {
      return task.x1 + width * 0.5;
    }
    if (rtl && textRef.current) {
      return (
        task.x1 -
        getBBoxWidth() -
        arrowIndent * +hasChild -
        arrowIndent * 0.2
      );
    } else {
      return task.x1 + width + arrowIndent * +hasChild + arrowIndent * 0.2;
    }
  };

  return (
    <g
      onKeyDown={e => {
        switch (e.key) {
          case "Delete": {
            if (isDelete) onEventStart("delete", task, e);
            break;
          }
        }
        e.stopPropagation();
      }}
      onMouseEnter={e => {
        onEventStart("mouseenter", task, e);
      }}
      onMouseLeave={e => {
        onEventStart("mouseleave", task, e);
      }}
      onDoubleClick={e => {
        onEventStart("dblclick", task, e);
      }}
      onClick={e => {
        onEventStart("click", task, e);
      }}
      onFocus={() => {
        onEventStart("select", task);
      }}
    >
      {taskItem}
      <text
        x={getX()}
        y={task.y + taskHeight * 0.5}
        className={
          isTextInside
            ? style.barLabel
            : style.barLabel && style.barLabelOutside
        }
        ref={textRef}
      >
        {!!statusBadgeText && (
          <tspan className={style.statusDot} fill={statusColor}>
            ●
          </tspan>
        )}
        <tspan dx={statusBadgeText ? 4 : 0}>{task.name}</tspan>
      </text>
    </g>
  );
};
