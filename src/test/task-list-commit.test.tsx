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
      <button
        data-testid="start-edit-start"
        onClick={() => context?.startEditing("task-1", "start", "enter")}
      >
        Start Date
      </button>
      <button
        data-testid="start-edit-effort"
        onClick={() => context?.startEditing("task-1", "actualEffort", "enter")}
      >
        Start Effort
      </button>
      <div data-row-id="task-1" data-column-id="name">
        Task 1
      </div>
      <div data-row-id="task-1" data-column-id="start">
        2026-01-01
      </div>
      <div data-row-id="task-1" data-column-id="actualEffort">
        1
      </div>
    </div>
  );
};

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: "task-1",
  name: "Task 1",
  start: new Date(2026, 0, 1, 9, 0),
  end: new Date(2026, 0, 1, 10, 0),
  progress: 0,
  type: "task",
  ...overrides,
});

const renderTaskList = (
  onCellCommit: jest.Mock,
  onUpdateTask?: jest.Mock,
  tasks: Task[] = [createTask()]
) => {
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
      tasks={tasks}
      taskListRef={React.createRef<HTMLDivElement>()}
      selectedTask={undefined}
      setSelectedTask={jest.fn()}
      onExpanderClick={jest.fn()}
      TaskListHeader={MockTaskListHeader}
      TaskListTable={MockTaskListTable}
      onUpdateTask={onUpdateTask}
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

  it("normalizes actual effort commits and updates derived end", async () => {
    const onCellCommit = jest.fn().mockResolvedValue(undefined);
    const onUpdateTask = jest.fn();
    renderTaskList(onCellCommit, onUpdateTask, [
      createTask({
        start: new Date(2026, 0, 1, 9, 0),
        end: new Date("invalid"), // ensure invalid dates are treated as changed
        actualEffort: 1,
      }),
    ]);
    fireEvent.click(screen.getByTestId("start-edit-effort"));

    const input = await screen.findByTestId("overlay-editor-input");
    fireEvent.change(input, { target: { value: "4.13" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCellCommit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledTimes(1));
    const commitPayload = onCellCommit.mock.calls[0][0];
    expect(commitPayload.value).toBe("4.25");
    const update = onUpdateTask.mock.calls[0][1] as Partial<Task>;
    expect(update.actualEffort).toBe(4.25);
    expect(update.end).toBeInstanceOf(Date);
    expect((update.end as Date).getHours()).toBe(14);
    expect((update.end as Date).getMinutes()).toBe(15);
  });

  it("keeps time portion when editing start date", async () => {
    const onCellCommit = jest.fn().mockResolvedValue(undefined);
    const onUpdateTask = jest.fn();
    renderTaskList(onCellCommit, onUpdateTask, [
      createTask({
        start: new Date(2026, 0, 1, 13, 30),
        end: new Date(2026, 0, 2, 18, 0),
        actualEffort: 8,
      }),
    ]);

    fireEvent.click(screen.getByTestId("start-edit-start"));
    const input = await screen.findByTestId("overlay-editor-input");
    fireEvent.change(input, { target: { value: "2026-01-02" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => expect(onCellCommit).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onUpdateTask).toHaveBeenCalledTimes(1));
    const update = onUpdateTask.mock.calls[0][1] as Partial<Task>;
    expect(update.start).toBeInstanceOf(Date);
    expect((update.start as Date).getHours()).toBe(13);
    expect((update.start as Date).getMinutes()).toBe(30);
  });
});
