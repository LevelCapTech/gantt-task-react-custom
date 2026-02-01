import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Gantt } from "../index";
import { Task } from "../types/public-types";

const baseTask: Task = {
  start: new Date("2026-01-01T00:00:00.000Z"),
  end: new Date("2026-01-05T00:00:00.000Z"),
  name: "分割ハンドル確認",
  id: "Task-split",
  progress: 40,
  type: "task",
};

const DEFAULT_TASK_LIST_WIDTH = 450;
const MIN_PANE_WIDTH = 150;
const LONG_TASK_NAME_REPEAT_COUNT = 30;
const LONG_LIST_CELL_WIDTH = "600px";

describe("Task/Schedule split handle", () => {
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth"
  );
  const originalPointerEvent = global.PointerEvent;
  const originalWindowPointerEvent = window.PointerEvent;

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 800,
    });
  });

  afterEach(() => {
    if (originalOffsetWidth) {
      Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    } else {
      delete (HTMLElement.prototype as { offsetWidth?: number }).offsetWidth;
    }
    if (originalPointerEvent === undefined) {
      delete (global as typeof globalThis & { PointerEvent?: typeof PointerEvent })
        .PointerEvent;
    } else {
      global.PointerEvent = originalPointerEvent;
    }
    if (originalWindowPointerEvent === undefined) {
      delete (window as Window & { PointerEvent?: typeof PointerEvent }).PointerEvent;
    } else {
      window.PointerEvent = originalWindowPointerEvent;
    }
  });

  it("renders split handle with default task width", async () => {
    render(<Gantt tasks={[baseTask]} listCellWidth="140px" onCellCommit={async () => {}} />);
    const taskListPanel = await screen.findByTestId("task-list-panel");
    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: `${DEFAULT_TASK_LIST_WIDTH}px` });
    });
    expect(screen.getByTestId("pane-splitter")).toBeInTheDocument();
  });

  it("clamps task pane width to minimum on drag", async () => {
    render(<Gantt tasks={[baseTask]} listCellWidth="140px" onCellCommit={async () => {}} />);
    const taskListPanel = await screen.findByTestId("task-list-panel");
    const splitHandle = screen.getByTestId("pane-splitter");

    fireEvent.mouseDown(splitHandle, { clientX: 500 });
    fireEvent.mouseMove(splitHandle, { clientX: 0 });
    fireEvent.mouseUp(splitHandle, { clientX: 0 });

    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: `${MIN_PANE_WIDTH}px` });
    });
  });

  it("clamps task pane width to maximum to keep schedule minimum", async () => {
    render(<Gantt tasks={[baseTask]} listCellWidth="140px" onCellCommit={async () => {}} />);
    const taskListPanel = await screen.findByTestId("task-list-panel");
    const splitHandle = screen.getByTestId("pane-splitter");

    fireEvent.mouseDown(splitHandle, { clientX: 450 });
    fireEvent.mouseMove(splitHandle, { clientX: 2000 });
    fireEvent.mouseUp(splitHandle, { clientX: 2000 });

    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: "642px" });
    });
  });

  it("clamps task pane width with pointer events", async () => {
    // window と global の両方に設定し、判定とイベント生成の双方を通す。
    const PointerEventMock = class PointerEvent extends MouseEvent {};
    global.PointerEvent = PointerEventMock;
    window.PointerEvent = PointerEventMock;
    render(<Gantt tasks={[baseTask]} listCellWidth="140px" onCellCommit={async () => {}} />);
    const taskListPanel = await screen.findByTestId("task-list-panel");
    const splitHandle = screen.getByTestId("pane-splitter");

    fireEvent.pointerDown(splitHandle, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(splitHandle, { clientX: 0, pointerId: 1 });
    fireEvent.pointerUp(splitHandle, { clientX: 0, pointerId: 1 });

    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: `${MIN_PANE_WIDTH}px` });
    });
  });

  it("keeps schedule pane width when task content is long", async () => {
    render(
      <Gantt
        tasks={[
          {
            ...baseTask,
            name: "長いタスク名".repeat(LONG_TASK_NAME_REPEAT_COUNT),
          },
        ]}
        listCellWidth={LONG_LIST_CELL_WIDTH}
        onCellCommit={async () => {}}
      />
    );
    const taskListPanel = await screen.findByTestId("task-list-panel");
    const ganttPanel = await screen.findByTestId("gantt-panel");
    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: `${DEFAULT_TASK_LIST_WIDTH}px` });
    });
    expect(ganttPanel).toHaveStyle({ minWidth: `${MIN_PANE_WIDTH}px` });
  });
});
