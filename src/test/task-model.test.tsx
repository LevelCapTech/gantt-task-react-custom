import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { Gantt, TASK_STATUS_COLORS, TASK_STATUS_OPTIONS } from "../index";
import { Task } from "../types/public-types";
import { StandardTooltipContent } from "../components/other/tooltip";

const baseTask: Task = {
  start: new Date("2026-01-01T00:00:00.000Z"),
  end: new Date("2026-01-05T00:00:00.000Z"),
  name: "開発タスク",
  id: "Task-1",
  progress: 40,
  type: "task",
  process: "開発",
  assignee: "田中",
  plannedStart: new Date("2026-01-01T00:00:00.000Z"),
  plannedEnd: new Date("2026-01-03T00:00:00.000Z"),
  plannedEffort: 16,
  actualEffort: 8,
  status: "進行中",
};

describe("Task data model extensions", () => {
  it("renders extended fields and status badge color in task list", async () => {
    const onTaskUpdate = jest.fn();
    render(
      <Gantt
        tasks={[baseTask]}
        onTaskUpdate={onTaskUpdate}
        listCellWidth="140px"
        effortDisplayUnit="MH"
      />
    );

    expect(screen.getByDisplayValue("開発")).toBeInTheDocument();
    expect(screen.getByDisplayValue("田中")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-01-01")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-01-03")).toBeInTheDocument();
    expect(screen.getByDisplayValue("16")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();

    const statusBadge = screen.getByText("進");
    expect(statusBadge).toHaveStyle(
      `background-color: ${TASK_STATUS_COLORS["進行中"]}`
    );
  });

  it("fires onTaskUpdate when status dropdown changes", async () => {
    const onTaskUpdate = jest.fn();
    render(
      <Gantt tasks={[baseTask]} onTaskUpdate={onTaskUpdate} listCellWidth="140px" />
    );
    const statusSelect = screen.getByDisplayValue("進行中");
    await userEvent.selectOptions(statusSelect, "完了");
    expect(onTaskUpdate).toHaveBeenCalledWith(
      "Task-1",
      expect.objectContaining({ status: "完了" })
    );
  });

  it("fires onTaskUpdate when process dropdown changes", async () => {
    const onTaskUpdate = jest.fn();
    render(
      <Gantt tasks={[baseTask]} onTaskUpdate={onTaskUpdate} listCellWidth="140px" />
    );
    const processSelect = screen.getByLabelText("工程");
    await userEvent.selectOptions(processSelect, "レビュー");
    expect(onTaskUpdate).toHaveBeenCalledWith(
      "Task-1",
      expect.objectContaining({ process: "レビュー" })
    );
  });

  it("fires onTaskUpdate when assignee and planned dates change", async () => {
    const onTaskUpdate = jest.fn();
    render(
      <Gantt tasks={[baseTask]} onTaskUpdate={onTaskUpdate} listCellWidth="140px" />
    );

    const assigneeInput = screen.getByLabelText("担当者");
    fireEvent.change(assigneeInput, { target: { value: "佐々木" } });
    const assigneeCall = onTaskUpdate.mock.calls.find(
      ([id, payload]) => id === "Task-1" && payload.assignee === "佐々木"
    );
    expect(assigneeCall).toBeDefined();
    onTaskUpdate.mockClear();

    const plannedStartInput = screen.getByLabelText("予定開始");
    const plannedEndInput = screen.getByLabelText("予定終了");
    fireEvent.change(plannedStartInput, { target: { value: "2026-01-02" } });
    fireEvent.change(plannedEndInput, { target: { value: "2026-01-04" } });

    const calls = onTaskUpdate.mock.calls;
    const plannedStartCall = calls.find(
      ([id, payload]) =>
        id === "Task-1" &&
        payload.plannedStart &&
        payload.plannedStart.getTime() === new Date("2026-01-02").getTime()
    );
    const plannedEndCall = calls.find(
      ([id, payload]) =>
        id === "Task-1" &&
        payload.plannedEnd &&
        payload.plannedEnd.getTime() === new Date("2026-01-04").getTime()
    );
    expect(plannedStartCall).toBeDefined();
    expect(plannedEndCall).toBeDefined();
  });

  it("renders tooltip content with planned and actual effort", () => {
    render(
      <StandardTooltipContent
        task={baseTask}
        fontSize="14px"
        fontFamily="Arial"
        effortDisplayUnit="MD"
      />
    );

    expect(screen.getByText("開発タスク")).toBeInTheDocument();
    expect(screen.getByText("予定工数")).toBeInTheDocument();
    expect(screen.getByText("2MD")).toBeInTheDocument();
    expect(screen.getByText("実績工数")).toBeInTheDocument();
    expect(screen.getByText("1MD")).toBeInTheDocument();
    expect(screen.getByText(/進行中/)).toBeInTheDocument();
  });

  it("keeps new fields in JSON export", () => {
    const serialized = JSON.parse(JSON.stringify(baseTask));
    expect(serialized.process).toBe(baseTask.process);
    expect(serialized.status).toBe(baseTask.status);
    expect(serialized.plannedEffort).toBe(baseTask.plannedEffort);
    expect(serialized.actualEffort).toBe(baseTask.actualEffort);
    expect(serialized.plannedStart).toBeDefined();
    expect(serialized.plannedEnd).toBeDefined();
    expect(TASK_STATUS_OPTIONS).toContain(serialized.status);
  });
});
