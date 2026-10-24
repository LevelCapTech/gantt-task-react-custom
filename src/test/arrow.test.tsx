import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Arrow } from "../components/other/arrow";
import { BarTask } from "../types/bar-task";

const createBarTask = (
  id: string,
  index: number,
  x1: number,
  x2: number
): BarTask => ({
  id,
  name: id,
  type: "task",
  typeInternal: "task",
  start: new Date("2026-01-01T00:00:00.000Z"),
  end: new Date("2026-01-02T00:00:00.000Z"),
  progress: 0,
  x1,
  x2,
  y: index * 20,
  height: 10,
  index,
  progressX: x1,
  progressWidth: 0,
  barCornerRadius: 3,
  handleWidth: 8,
  barChildren: [],
  barDependencyChildren: [],
  styles: {
    backgroundColor: "#1",
    backgroundSelectedColor: "#2",
    progressColor: "#3",
    progressSelectedColor: "#4",
  },
});

const getArrowPath = (dependencyType: "FS" | "SS" | "FF" | "SF", rtl = false, lagPx = 0) => {
  cleanup();
  const taskFrom = createBarTask("from", 0, 10, 30);
  const taskTo = createBarTask("to", 1, 60, 90);
  render(
    <svg>
      <Arrow
        taskFrom={taskFrom}
        taskTo={taskTo}
        dependencyType={dependencyType}
        lagPx={lagPx}
        rowHeight={20}
        taskHeight={10}
        arrowIndent={12}
        rtl={rtl}
      />
    </svg>
  );
  const path = screen.getByTestId("dependency-arrow-path").getAttribute("d") || "";
  cleanup();
  return path;
};

describe("Arrow", () => {
  it("依存タイプごとに接続点を切り替える", () => {
    expect(getArrowPath("FS")).toContain("M 30 5");
    expect(getArrowPath("SS")).toContain("M 10 5");
    expect(getArrowPath("FF")).toContain("H 90");
    expect(getArrowPath("SF")).toContain("H 90");
  });

  it("lag を終端前水平セグメントへ反映する", () => {
    const withoutLag = getArrowPath("FS", false, 0);
    const withLag = getArrowPath("FS", false, 30);
    expect(withLag).not.toBe(withoutLag);
  });

  it("RTL では x1/x2 の向きを反転して描画する", () => {
    const rtlPath = getArrowPath("FS", true, 0);
    expect(rtlPath).toContain("M 10 5");
    expect(rtlPath).toContain("H 90");
  });
});
