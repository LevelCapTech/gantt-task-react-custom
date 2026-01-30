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
  };

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

  it("ignores key events from input elements", () => {
    const context = createEditingContext("selected", "task-1", "name");
    
    render(
      <TaskListEditingStateContext.Provider value={context}>
        <TaskListTableDefault {...defaultProps} onUpdateTask={jest.fn()} />
      </TaskListEditingStateContext.Provider>
    );

    // Find an input element
    const input = screen.getAllByRole("textbox")[0];
    fireEvent.keyDown(input, { key: "ArrowDown" });

    // Should not call selectCell when event comes from input
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

describe("TaskListTable cell editing", () => {
  const defaultProps = {
    rowHeight: 40,
    rowWidth: "155px",
    fontFamily: "Arial",
    fontSize: "14px",
    tasks: [createMockTask("task-1", "Task 1")],
    selectedTaskId: "",
    setSelectedTask: jest.fn(),
    onExpanderClick: jest.fn(),
    visibleFields: ["name", "start", "end", "process", "assignee"] as VisibleField[],
    effortDisplayUnit: "MH" as const,
  };

  it("renders input for name field when editable", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const nameInput = screen.getByLabelText("タスク名");
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute("type", "text");
  });

  it("renders input for start date field when editable", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const startInput = screen.getByLabelText("開始日");
    expect(startInput).toBeInTheDocument();
    expect(startInput).toHaveAttribute("type", "date");
  });

  it("renders input for end date field when editable", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const endInput = screen.getByLabelText("終了日");
    expect(endInput).toBeInTheDocument();
    expect(endInput).toHaveAttribute("type", "date");
  });

  it("calls onUpdateTask when name is changed", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const nameInput = screen.getByLabelText("タスク名");
    fireEvent.change(nameInput, { target: { value: "Updated Task Name" } });

    expect(onUpdateTask).toHaveBeenCalledWith("task-1", { name: "Updated Task Name" });
  });

  it("calls onUpdateTask when start date is changed", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const startInput = screen.getByLabelText("開始日");
    fireEvent.change(startInput, { target: { value: "2026-02-15" } });

    expect(onUpdateTask).toHaveBeenCalledWith("task-1", {
      start: expect.any(Date),
    });
    
    const callArgs = onUpdateTask.mock.calls[0][1] as any;
    expect(callArgs.start.getFullYear()).toBe(2026);
    expect(callArgs.start.getMonth()).toBe(1); // February (0-indexed: 0=Jan, 1=Feb)
    expect(callArgs.start.getDate()).toBe(15);
  });

  it("calls onUpdateTask when end date is changed", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const endInput = screen.getByLabelText("終了日");
    fireEvent.change(endInput, { target: { value: "2026-03-20" } });

    expect(onUpdateTask).toHaveBeenCalledWith("task-1", {
      end: expect.any(Date),
    });
    
    const callArgs = onUpdateTask.mock.calls[0][1] as any;
    expect(callArgs.end.getFullYear()).toBe(2026);
    expect(callArgs.end.getMonth()).toBe(2); // March (0-indexed: 0=Jan, 1=Feb, 2=Mar)
    expect(callArgs.end.getDate()).toBe(20);
  });

  it("renders select for process field when editable", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const processSelect = screen.getByLabelText("工程");
    expect(processSelect).toBeInTheDocument();
    expect(processSelect.tagName).toBe("SELECT");
  });

  it("calls onUpdateTask when process is changed", () => {
    const onUpdateTask = jest.fn();
    const taskWithProcess = createMockTask("task-1", "Task 1", { process: "設計" });
    const propsWithProcess = {
      ...defaultProps,
      tasks: [taskWithProcess],
    };
    
    render(
      <TaskListTableDefault {...propsWithProcess} onUpdateTask={onUpdateTask} />
    );

    const processSelect = screen.getByLabelText("工程");
    fireEvent.change(processSelect, { target: { value: "開発" } });

    expect(onUpdateTask).toHaveBeenCalledWith("task-1", { process: "開発" });
  });

  it("renders input for assignee field when editable", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const assigneeInput = screen.getByLabelText("担当者");
    expect(assigneeInput).toBeInTheDocument();
    expect(assigneeInput).toHaveAttribute("type", "text");
  });

  it("calls onUpdateTask when assignee is changed", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const assigneeInput = screen.getByLabelText("担当者");
    fireEvent.change(assigneeInput, { target: { value: "田中太郎" } });

    expect(onUpdateTask).toHaveBeenCalledWith("task-1", { assignee: "田中太郎" });
  });

  it("does not render inputs when not editable", () => {
    render(
      <TaskListTableDefault {...defaultProps} />
    );

    // Should not have input elements
    expect(screen.queryByLabelText("タスク名")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("開始日")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("終了日")).not.toBeInTheDocument();
  });

  it("renders static text for name when not editable", () => {
    render(
      <TaskListTableDefault {...defaultProps} />
    );

    expect(screen.getByText("Task 1")).toBeInTheDocument();
  });

  it("handles invalid date input gracefully", () => {
    const onUpdateTask = jest.fn();
    
    render(
      <TaskListTableDefault {...defaultProps} onUpdateTask={onUpdateTask} />
    );

    const startInput = screen.getByLabelText("開始日");
    fireEvent.change(startInput, { target: { value: "2026-02-30" } }); // Invalid date

    // Should be called but with undefined since date is invalid
    expect(onUpdateTask).toHaveBeenCalledWith("task-1", { start: undefined });
  });

  it("clears assignee when empty string is provided", () => {
    const onUpdateTask = jest.fn();
    const taskWithAssignee = createMockTask("task-1", "Task 1", { assignee: "田中太郎" });
    const propsWithAssignee = {
      ...defaultProps,
      tasks: [taskWithAssignee],
    };
    
    render(
      <TaskListTableDefault {...propsWithAssignee} onUpdateTask={onUpdateTask} />
    );

    const assigneeInput = screen.getByLabelText("担当者");
    fireEvent.change(assigneeInput, { target: { value: "" } });

    expect(onUpdateTask).toHaveBeenCalledWith("task-1", { assignee: undefined });
  });
});

describe("TaskListTable editable fields", () => {
  it("renders input elements for all editable fields when table is editable", () => {
    const props = {
      rowHeight: 40,
      rowWidth: "155px",
      fontFamily: "Arial",
      fontSize: "14px",
      tasks: [createMockTask("task-1", "Task 1")],
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
      onUpdateTask: jest.fn(),
    };

    render(<TaskListTableDefault {...props} />);

    // All editable fields should have inputs or selects
    expect(screen.getByLabelText("タスク名")).toBeInTheDocument();
    expect(screen.getByLabelText("開始日")).toBeInTheDocument();
    expect(screen.getByLabelText("終了日")).toBeInTheDocument();
    expect(screen.getByLabelText("工程")).toBeInTheDocument();
    expect(screen.getByLabelText("担当者")).toBeInTheDocument();
    expect(screen.getByLabelText("予定開始")).toBeInTheDocument();
    expect(screen.getByLabelText("予定終了")).toBeInTheDocument();
    expect(screen.getByLabelText("予定工数（入力単位:時間）")).toBeInTheDocument();
    expect(screen.getByLabelText("実績工数（入力単位:時間）")).toBeInTheDocument();
    expect(screen.getByLabelText("ステータス")).toBeInTheDocument();
  });
});
