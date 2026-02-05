import React from "react";
import { CellCommitTrigger, VisibleField } from "../../types/public-types";
declare type EditingState = {
    mode: "viewing" | "selected" | "editing";
    rowId: string | null;
    columnId: VisibleField | null;
    pending: boolean;
    errorMessage: string | null;
};
declare type OverlayEditorProps = {
    editingState: EditingState;
    taskListRef: React.RefObject<HTMLDivElement>;
    headerContainerRef?: React.RefObject<HTMLDivElement>;
    bodyContainerRef?: React.RefObject<HTMLDivElement>;
    onCommit: (value: string, trigger: CellCommitTrigger) => Promise<void>;
    onCancel: (reason: "escape" | "nochange-blur" | "unmounted") => void;
};
export declare const OverlayEditor: React.FC<OverlayEditorProps>;
export {};
