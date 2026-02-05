import React from "react";
import { ColumnsState, VisibleField } from "../../types/public-types";
export declare const TaskListHeaderDefault: React.FC<{
    headerHeight: number;
    rowWidth: string;
    fontFamily: string;
    fontSize: string;
    visibleFields: VisibleField[];
    columnsState?: ColumnsState;
    setColumnsState?: React.Dispatch<React.SetStateAction<ColumnsState>>;
    enableColumnDrag?: boolean;
}>;
