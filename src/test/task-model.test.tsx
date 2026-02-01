import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Gantt, TASK_STATUS_OPTIONS } from "../index";
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
  it("renders extended fields in task list", async () => {
    const onTaskUpdate = jest.fn();
    render(
      <Gantt
        tasks={[baseTask]}
        onTaskUpdate={onTaskUpdate}
        onCellCommit={async () => {}}
        listCellWidth="140px"
        effortDisplayUnit="MH"
      />
    );

    expect(screen.getByText("開発")).toBeInTheDocument();
    expect(screen.getByText("田中")).toBeInTheDocument();
    expect(screen.getAllByText("2026-01-01").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2026-01-03").length).toBeGreaterThan(0);
    expect(screen.getAllByText("16").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8").length).toBeGreaterThan(0);
    expect(screen.getByText("進行中")).toBeInTheDocument();
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
