import React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskListTableDefault } from "../components/task-list/task-list-table";
import { TaskListEditingStateContext } from "../components/task-list/task-list";
import { Task, VisibleField } from "../types/public-types";
import styles from "../components/task-list/task-list-table.module.css";

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */

const createMockTask = (id: string, name: string): Task => ({
  id,
  name,
  // Using 2026 as test data - far enough in the future to avoid date-related issues
  start: new Date(2026, 0, 1),
  end: new Date(2026, 0, 10),
  progress: 50,
  type: "task",
});

const createEditingContext = (
  mode: "viewing" | "selected" | "editing",
  rowId: string | null,
  columnId: VisibleField | null
) => ({
  editingState: {
    mode,
    rowId,
    columnId,
    trigger: null,
    pending: false,
    errorMessage: null,
  },
  selectCell: jest.fn(),
  startEditing: jest.fn(),
});

describe("TaskListTable cell highlight", () => {
  const defaultProps = {
    rowHeight: 40,
    rowWidth: "155px",
    fontFamily: "Arial",
    fontSize: "14px",
    tasks: [createMockTask("task-1", "Task 1"), createMockTask("task-2", "Task 2")],
    selectedTaskId: "",
    setSelectedTask: jest.fn(),
    onExpanderClick: jest.fn(),
    visibleFields: ["name", "start"] as VisibleField[],
    effortDisplayUnit: "MH" as const,
    onCellCommit: jest.fn().mockResolvedValue(undefined),
  };

  it("adds selected cell and row classes when a cell is selected", () => {
    const context = createEditingContext("selected", "task-1", "name");

    render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const selectedCell = document.querySelector(
      '[data-row-id="task-1"][data-column-id="name"]'
    ) as HTMLElement;
    const selectedRow = selectedCell.closest(
      `.${styles.taskListTableRow}`
    ) as HTMLElement;
    const otherCell = document.querySelector(
      '[data-row-id="task-1"][data-column-id="start"]'
    ) as HTMLElement;

    expect(selectedCell).toHaveClass(styles.taskListCellSelected);
    expect(selectedRow).toHaveClass(styles.taskListTableRowSelected);
    expect(otherCell).not.toHaveClass(styles.taskListCellSelected);
  });

  it("does not highlight when the selected column is not visible", () => {
    const context = createEditingContext("selected", "task-1", "end");

    render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const cell = document.querySelector(
      '[data-row-id="task-1"][data-column-id="name"]'
    ) as HTMLElement;
    const row = cell.closest(`.${styles.taskListTableRow}`) as HTMLElement;

    expect(cell).not.toHaveClass(styles.taskListCellSelected);
    expect(row).not.toHaveClass(styles.taskListTableRowSelected);
  });
});
