import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TaskList, TaskListEditingStateContext } from "../components/task-list/task-list";
import { Task, VisibleField } from "../types/public-types";

const MockTaskListHeader: React.FC = () => <div />;

const MockTaskListTable: React.FC = () => {
  const context = React.useContext(TaskListEditingStateContext);
  return (
    <div>
      <button
        data-testid="start-edit"
        onClick={() => context?.startEditing("task-1", "name", "enter")}
      >
        Start
      </button>
      <div data-row-id="task-1" data-column-id="name">
        Task 1
      </div>
    </div>
  );
};

const createTask = (): Task => ({
  id: "task-1",
  name: "Task 1",
  start: new Date(2026, 0, 1),
  end: new Date(2026, 0, 2),
  progress: 0,
  type: "task",
});

const renderTaskList = (onCellCommit: jest.Mock) => {
  render(
    <TaskList
      headerHeight={40}
      rowWidth="155px"
      fontFamily="Arial"
      fontSize="14px"
      rowHeight={40}
      ganttHeight={200}
      scrollY={0}
      visibleFields={["name"] as VisibleField[]}
      effortDisplayUnit="MH"
      tasks={[createTask()]}
      taskListRef={React.createRef<HTMLDivElement>()}
      selectedTask={undefined}
      setSelectedTask={jest.fn()}
      onExpanderClick={jest.fn()}
      TaskListHeader={MockTaskListHeader}
      TaskListTable={MockTaskListTable}
      onCellCommit={onCellCommit}
    />
  );
};

describe("TaskList onCellCommit", () => {
  it("closes editor after commit resolves", async () => {
    const onCellCommit = jest.fn().mockResolvedValue(undefined);

    renderTaskList(onCellCommit);
    fireEvent.click(screen.getByTestId("start-edit"));

    const input = await screen.findByTestId("overlay-editor-input");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCellCommit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.queryByTestId("overlay-editor")).toBeNull()
    );
  });

  it("keeps editor open and shows error on commit reject", async () => {
    const onCellCommit = jest.fn().mockRejectedValue(new Error("fail"));

    renderTaskList(onCellCommit);
    fireEvent.click(screen.getByTestId("start-edit"));

    const input = await screen.findByTestId("overlay-editor-input");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCellCommit).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Commit failed. Please retry."
      )
    );
    expect(screen.getByTestId("overlay-editor-input")).toBeInTheDocument();
  });

  it("prevents double commit and input changes while pending", async () => {
    let resolveCommit: () => void = () => {};
    const onCellCommit = jest.fn(
      () =>
        new Promise<void>(resolve => {
          resolveCommit = resolve;
        })
    );

    renderTaskList(onCellCommit);
    fireEvent.click(screen.getByTestId("start-edit"));

    const input = await screen.findByTestId("overlay-editor-input");
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCellCommit).toHaveBeenCalledTimes(1));
    expect(input).toHaveAttribute("readonly");

    fireEvent.change(input, { target: { value: "Changed" } });
    expect(input).toHaveValue("Task 1");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCellCommit).toHaveBeenCalledTimes(1);

    resolveCommit();
    await waitFor(() =>
      expect(screen.queryByTestId("overlay-editor")).toBeNull()
    );
  });
});
