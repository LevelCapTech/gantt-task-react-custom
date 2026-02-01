import React from "react";
import { render, screen } from "@testing-library/react";
import { Task } from "@levelcaptech/gantt-task-react-custom";
import { JapaneseTooltip } from "./App";

describe("JapaneseTooltip", () => {
  const baseTask: Task = {
    start: new Date("2026-01-01T00:00:00.000Z"),
    end: new Date("2026-01-02T00:00:00.000Z"),
    name: "タスクA",
    id: "TaskA",
    type: "task",
    progress: 50,
    process: "設計",
    assignee: "田中",
    plannedStart: new Date("2026-01-01T00:00:00.000Z"),
    plannedEnd: new Date("2026-01-03T00:00:00.000Z"),
    plannedEffort: 16,
    actualEffort: 8,
    status: "進行中",
  };

  it("renders Japanese date range with wave dash and duration minimum 1 day", () => {
    render(
      <JapaneseTooltip
        task={baseTask}
        fontSize="14px"
        fontFamily="Arial"
      />
    );

    expect(screen.getByText("タスクA: 2026-01-01〜2026-01-02")).toBeInTheDocument();
    expect(screen.getByText("期間: 1日")).toBeInTheDocument();
    expect(screen.getByText("工程: 設計")).toBeInTheDocument();
    expect(screen.getByText("担当: 田中")).toBeInTheDocument();
    expect(screen.getByText("予定: 2026-01-01〜2026-01-03")).toBeInTheDocument();
    expect(screen.getByText("予定工数: 16MH")).toBeInTheDocument();
    expect(screen.getByText("実績工数: 8MH")).toBeInTheDocument();
    expect(screen.getByText(/進行中/)).toBeInTheDocument();
    expect(screen.getByText(/ステータス:/)).toBeInTheDocument();
    expect(screen.getByText("進捗: 50 %")).toBeInTheDocument();
  });
});
