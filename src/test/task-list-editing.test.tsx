import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskList, TaskListEditingStateContext, EditingTrigger } from "../components/task-list/task-list";
import { Task, VisibleField } from "../types/public-types";

// Mock components
const MockTaskListHeader: React.FC<any> = () => <div data-testid="mock-header">Header</div>;
const MockTaskListTable: React.FC<any> = () => {
  const context = React.useContext(TaskListEditingStateContext);
  return (
    <div data-testid="mock-table">
      <div data-testid="editing-mode">{context?.editingState.mode}</div>
      <div data-testid="editing-row">{context?.editingState.rowId || "null"}</div>
      <div data-testid="editing-column">{context?.editingState.columnId || "null"}</div>
      <button
        data-testid="select-cell-btn"
        onClick={() => context?.selectCell("task-1", "name")}
      >
        Select Cell
      </button>
      <button
        data-testid="start-editing-btn"
        onClick={() => context?.startEditing("task-1", "name", "enter")}
      >
        Start Editing
      </button>
    </div>
  );
};

// Using 2026 as test data - far enough in the future to avoid date-related issues
const createMockTask = (id: string, name: string): Task => ({
  id,
  name,
  start: new Date(2026, 0, 1),
  end: new Date(2026, 0, 10),
  progress: 50,
  type: "task",
});

describe("TaskList EditingStateContext", () => {
  const defaultProps = {
    headerHeight: 50,
    rowWidth: "155px",
    fontFamily: "Arial",
    fontSize: "14px",
    rowHeight: 40,
    ganttHeight: 400,
    scrollY: 0,
    visibleFields: ["name", "start", "end"] as VisibleField[],
    effortDisplayUnit: "MH" as const,
    tasks: [createMockTask("task-1", "Task 1"), createMockTask("task-2", "Task 2")],
    taskListRef: React.createRef<HTMLDivElement>(),
    selectedTask: undefined,
    setSelectedTask: jest.fn(),
    onExpanderClick: jest.fn(),
    TaskListHeader: MockTaskListHeader,
    TaskListTable: MockTaskListTable,
  };

  it("initializes with viewing mode", () => {
    render(<TaskList {...defaultProps} />);
    expect(screen.getByTestId("editing-mode")).toHaveTextContent("viewing");
    expect(screen.getByTestId("editing-row")).toHaveTextContent("null");
    expect(screen.getByTestId("editing-column")).toHaveTextContent("null");
  });

  it("transitions from viewing to selected when selectCell is called", () => {
    render(<TaskList {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId("select-cell-btn"));
    
    expect(screen.getByTestId("editing-mode")).toHaveTextContent("selected");
    expect(screen.getByTestId("editing-row")).toHaveTextContent("task-1");
    expect(screen.getByTestId("editing-column")).toHaveTextContent("name");
  });

  it("transitions from selected to editing when startEditing is called", () => {
    render(<TaskList {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId("select-cell-btn"));
    fireEvent.click(screen.getByTestId("start-editing-btn"));
    
    expect(screen.getByTestId("editing-mode")).toHaveTextContent("editing");
    expect(screen.getByTestId("editing-row")).toHaveTextContent("task-1");
    expect(screen.getByTestId("editing-column")).toHaveTextContent("name");
  });

  it("provides context value to TaskListTable", () => {
    render(<TaskList {...defaultProps} />);
    
    // Context should be available
    expect(screen.getByTestId("mock-table")).toBeInTheDocument();
    expect(screen.getByTestId("select-cell-btn")).toBeInTheDocument();
    expect(screen.getByTestId("start-editing-btn")).toBeInTheDocument();
  });

  it("maintains editing state across re-renders", () => {
    const { rerender } = render(<TaskList {...defaultProps} />);
    
    fireEvent.click(screen.getByTestId("select-cell-btn"));
    expect(screen.getByTestId("editing-mode")).toHaveTextContent("selected");
    
    // Re-render with updated tasks
    const updatedProps = {
      ...defaultProps,
      tasks: [
        createMockTask("task-1", "Updated Task 1"),
        createMockTask("task-2", "Task 2"),
      ],
    };
    rerender(<TaskList {...updatedProps} />);
    
    // Editing state should be maintained
    expect(screen.getByTestId("editing-mode")).toHaveTextContent("selected");
    expect(screen.getByTestId("editing-row")).toHaveTextContent("task-1");
  });

  it("handles multiple selectCell calls correctly", () => {
    const MockTableWithMultipleSelects: React.FC<any> = () => {
      const context = React.useContext(TaskListEditingStateContext);
      return (
        <div>
          <div data-testid="editing-row">{context?.editingState.rowId || "null"}</div>
          <div data-testid="editing-column">{context?.editingState.columnId || "null"}</div>
          <button onClick={() => context?.selectCell("task-1", "name")}>
            Select 1
          </button>
          <button onClick={() => context?.selectCell("task-2", "start")}>
            Select 2
          </button>
        </div>
      );
    };

    const propsWithMultipleSelects = {
      ...defaultProps,
      TaskListTable: MockTableWithMultipleSelects,
    };

    render(<TaskList {...propsWithMultipleSelects} />);
    
    fireEvent.click(screen.getByText("Select 1"));
    expect(screen.getByTestId("editing-row")).toHaveTextContent("task-1");
    expect(screen.getByTestId("editing-column")).toHaveTextContent("name");
    
    fireEvent.click(screen.getByText("Select 2"));
    expect(screen.getByTestId("editing-row")).toHaveTextContent("task-2");
    expect(screen.getByTestId("editing-column")).toHaveTextContent("start");
  });
});
