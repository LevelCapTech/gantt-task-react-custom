import React from "react";
import { ColumnsState, EffortUnit, Task, VisibleField } from "../../types/public-types";
export declare const TaskListTableDefault: React.FC<{
    rowHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    tasks: Task[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: Task) => void;
    visibleFields: VisibleField[];
    onUpdateTask?: (taskId: string, updatedFields: Partial<Task>) => void;
    onCellCommit?: (payload: {
        rowId: string;
        columnId: VisibleField;
        value: string;
        trigger: "enter";
    }) => Promise<void>;
    effortDisplayUnit: EffortUnit;
    columnsState?: ColumnsState;
}>;
