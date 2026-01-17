import React from "react";
import { render, screen } from "@testing-library/react";
import { Task } from "gantt-task-react";
import {
  JapaneseTaskListHeader,
  JapaneseTooltip,
} from "./App";

describe("JapaneseTaskListHeader", () => {
  it("renders Japanese header labels", () => {
    render(
      <JapaneseTaskListHeader
        headerHeight={50}
        rowWidth="155px"
        fontFamily="Arial"
        fontSize="14px"
      />
    );

    expect(screen.getByText("タスク名")).toBeInTheDocument();
    expect(screen.getByText("開始日")).toBeInTheDocument();
    expect(screen.getByText("終了日")).toBeInTheDocument();
  });
});

describe("JapaneseTooltip", () => {
  const baseTask: Task = {
    start: new Date("2026-01-01T00:00:00.000Z"),
    end: new Date("2026-01-02T00:00:00.000Z"),
    name: "タスクA",
    id: "TaskA",
    type: "task",
    progress: 50,
  };

  it("renders Japanese date range with wave dash and duration minimum 1 day", () => {
    render(
      <JapaneseTooltip
        task={baseTask}
        fontSize="14px"
        fontFamily="Arial"
      />
    );

    expect(
      screen.getByText("タスクA: 2026年1月1日〜2026年1月2日")
    ).toBeInTheDocument();
    expect(screen.getByText("期間: 1日")).toBeInTheDocument();
    expect(screen.getByText("進捗: 50 %")).toBeInTheDocument();
  });
});
