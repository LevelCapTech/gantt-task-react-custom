import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskListTableDefault } from "../components/task-list/task-list-table";
import { TaskListEditingStateContext } from "../components/task-list/task-list";
import { Task, VisibleField } from "../types/public-types";

/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */

// Note: Using container.firstChild to access the wrapper div that handles keyboard events.
// This is necessary because the wrapper div has tabIndex but no specific role or test-id
// in the production code, and we're testing keyboard navigation at the wrapper level.

const createMockTask = (id: string, name: string, overrides?: Partial<Task>): Task => ({
  id,
  name,
  // Using 2026 as test data - far enough in the future to avoid date-related issues
  start: new Date(2026, 0, 1),
  end: new Date(2026, 0, 10),
  progress: 50,
  type: "task",
  ...overrides,
});

const createEditingContext = (
  mode: "viewing" | "selected" | "editing" = "viewing",
  rowId: string | null = null,
  columnId: VisibleField | null = null
) => {
  const selectCell = jest.fn();
  const startEditing = jest.fn();
  
  return {
      editingState: {
        mode,
        rowId,
        columnId,
        trigger: null,
        pending: false,
        errorMessage: null,
      },
    selectCell,
    startEditing,
  };
};

describe("TaskListTable keyboard navigation", () => {
  const defaultProps = {
    rowHeight: 40,
    rowWidth: "155px",
    fontFamily: "Arial",
    fontSize: "14px",
    tasks: [
      createMockTask("task-1", "Task 1"),
      createMockTask("task-2", "Task 2"),
      createMockTask("task-3", "Task 3"),
    ],
    selectedTaskId: "",
    setSelectedTask: jest.fn(),
    onExpanderClick: jest.fn(),
    visibleFields: ["name", "start", "end"] as VisibleField[],
    effortDisplayUnit: "MH" as const,
    onCellCommit: jest.fn().mockResolvedValue(undefined),
  };

  it("ignores cell selection when editing is pending", () => {
    const selectCell = jest.fn();
    const context = {
      editingState: {
        mode: "editing" as const,
        rowId: "task-1",
        columnId: "name" as VisibleField,
        trigger: "enter" as const,
        pending: true,
        errorMessage: null,
      },
      selectCell,
      startEditing: jest.fn(),
    };

    render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const nameCell = document.querySelector(
      '[data-row-id="task-2"][data-column-id="name"]'
    ) as HTMLElement;
    fireEvent.click(nameCell);

    expect(selectCell).not.toHaveBeenCalled();
  });

  it("moves selection down with ArrowDown key", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    // Find the wrapper div that has the onKeyDown handler
    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowDown" });

    expect(context.selectCell).toHaveBeenCalledWith("task-2", "name");
  });

  it("moves selection up with ArrowUp key", () => {
    const context = createEditingContext("selected", "task-2", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowUp" });

    expect(context.selectCell).toHaveBeenCalledWith("task-1", "name");
  });

  it("moves selection right with ArrowRight key", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowRight" });

    expect(context.selectCell).toHaveBeenCalledWith("task-1", "start");
  });

  it("moves selection left with ArrowLeft key", () => {
    const context = createEditingContext("selected", "task-1", "start");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowLeft" });

    expect(context.selectCell).toHaveBeenCalledWith("task-1", "name");
  });

  it("does not move beyond first row with ArrowUp", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowUp" });

    // Should stay on task-1
    expect(context.selectCell).toHaveBeenCalledWith("task-1", "name");
  });

  it("does not move beyond last row with ArrowDown", () => {
    const context = createEditingContext("selected", "task-3", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowDown" });

    // Should stay on task-3
    expect(context.selectCell).toHaveBeenCalledWith("task-3", "name");
  });

  it("starts editing with Enter key on selected cell", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(context.startEditing).toHaveBeenCalledWith("task-1", "name", "enter");
  });

  it("starts editing with printable key on selected cell", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "a" });

    expect(context.startEditing).toHaveBeenCalledWith("task-1", "name", "key");
  });

  it("does not start editing without onUpdateTask prop", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(context.startEditing).not.toHaveBeenCalled();
  });

  it("starts editing with double-click on cell", () => {
    const context = createEditingContext("viewing", null, null);
    
    render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
      </TaskListEditingStateContext.Provider>
    );

    // Find a cell by its data attributes (the name cell for the first task)
    const cells = document.querySelectorAll('[data-row-id="task-1"][data-column-id="name"]');
    const nameCell = cells[0] as HTMLElement;
    fireEvent.doubleClick(nameCell);

    expect(context.startEditing).toHaveBeenCalledWith("task-1", "name", "dblclick");
  });

  it("does not handle arrow keys when in editing mode", () => {
    const context = createEditingContext("editing", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "ArrowDown" });

    // Should not call selectCell when in editing mode
    expect(context.selectCell).not.toHaveBeenCalled();
  });

  it("does not start editing on disabled task", () => {
    const disabledTask = createMockTask("task-1", "Disabled Task", { isDisabled: true });
    const propsWithDisabled = {
      ...defaultProps,
      tasks: [disabledTask, createMockTask("task-2", "Task 2")],
    };
    const context = createEditingContext("selected", "task-1", "name");
    
    const { container } = render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...propsWithDisabled} onUpdateTask={jest.fn()} />
      </TaskListEditingStateContext.Provider>
    );

    const wrapper = container.firstChild as HTMLElement;
    fireEvent.keyDown(wrapper, { key: "Enter" });

    expect(context.startEditing).not.toHaveBeenCalled();
  });
});

describe("TaskListTable cell display", () => {
  const defaultProps = {
    rowHeight: 40,
    rowWidth: "155px",
    fontFamily: "Arial",
    fontSize: "14px",
    tasks: [
      createMockTask("task-1", "Task 1", {
        start: new Date(2026, 1, 1),
        end: new Date(2026, 1, 10),
        process: "開発",
        assignee: "田中太郎",
        plannedStart: new Date(2026, 1, 1),
        plannedEnd: new Date(2026, 1, 15),
        plannedEffort: 12,
        actualEffort: 5,
        status: "進行中",
      }),
    ],
    selectedTaskId: "",
    setSelectedTask: jest.fn(),
    onExpanderClick: jest.fn(),
    visibleFields: [
      "name",
      "start",
      "end",
      "process",
      "assignee",
      "plannedStart",
      "plannedEnd",
      "plannedEffort",
      "actualEffort",
      "status",
    ] as VisibleField[],
    effortDisplayUnit: "MH" as const,
    onCellCommit: jest.fn().mockResolvedValue(undefined),
  };

  it("renders label-only text for editable fields", () => {
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
    );

    expect(screen.getByText("Task 1")).toBeInTheDocument();
    // start and plannedStart share the same date for this fixture
    expect(screen.getAllByText("2026-02-01")).toHaveLength(2);
    expect(screen.getByText("2026-02-10")).toBeInTheDocument();
    expect(screen.getByText("開発")).toBeInTheDocument();
    expect(screen.getByText("田中太郎")).toBeInTheDocument();
    expect(screen.getByText("2026-02-15")).toBeInTheDocument();
    expect(screen.getByText("12MH")).toBeInTheDocument();
    expect(screen.getByText("5MH")).toBeInTheDocument();
    expect(screen.getByText("進行中")).toBeInTheDocument();
  });

  it("renders label-only display without form controls", () => {
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
    );

    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
    expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    expect(screen.queryAllByRole("spinbutton")).toHaveLength(0);
  });

  it("keeps edit triggers available for overlay editing", () => {
    const context = createEditingContext("selected", "task-1", "name");

    render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
      </TaskListEditingStateContext.Provider>
    );

    const nameCell = document.querySelector(
      '[data-row-id="task-1"][data-column-id="name"]'
    ) as HTMLElement;
    fireEvent.doubleClick(nameCell);

    expect(context.startEditing).toHaveBeenCalledWith("task-1", "name", "dblclick");
  });
});
