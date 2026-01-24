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

describe("Task/Schedule split handle", () => {
  const originalOffsetWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    "offsetWidth"
  );

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
  });

  it("renders split handle with default task width", async () => {
    render(<Gantt tasks={[baseTask]} listCellWidth="140px" />);
    const taskListPanel = await screen.findByTestId("task-list-panel");
    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: "450px" });
    });
    expect(screen.getByTestId("pane-splitter")).toBeInTheDocument();
  });

  it("clamps task pane width to minimum on drag", async () => {
    render(<Gantt tasks={[baseTask]} listCellWidth="140px" />);
    const taskListPanel = await screen.findByTestId("task-list-panel");
    const splitHandle = screen.getByTestId("pane-splitter");

    fireEvent.pointerDown(splitHandle, { clientX: 500, pointerId: 1 });
    fireEvent.pointerMove(splitHandle, { clientX: 0, pointerId: 1 });
    fireEvent.pointerUp(splitHandle, { clientX: 0, pointerId: 1 });

    await waitFor(() => {
      expect(taskListPanel).toHaveStyle({ width: "150px" });
    });
  });
});
