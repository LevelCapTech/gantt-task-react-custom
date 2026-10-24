import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { TaskGanttContent } from "../components/gantt/task-gantt-content";
import { BarTask } from "../types/bar-task";

const createBarTask = (id: string, index: number, x1: number, x2: number): BarTask => ({
  id,
  name: id,
  type: "task",
  typeInternal: "task",
  start: new Date("2026-01-01T00:00:00.000Z"),
  end: new Date("2026-01-02T00:00:00.000Z"),
  progress: 0,
  x1,
  x2,
  y: index * 30,
  height: 16,
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

describe("TaskGanttContent", () => {
  const createSvgRef = () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    (svg as any).createSVGPoint = () => {
      const point = {
        x: 0,
        matrixTransform: () => ({ x: point.x }),
      };
      return point;
    };
    (svg as any).getScreenCTM = () => ({
      inverse: () => ({}),
    });
    return { current: svg } as React.RefObject<SVGSVGElement>;
  };

  it("依存線描画は barDependencyChildren を使用する", () => {
    const taskA = createBarTask("A", 0, 10, 30);
    const taskB = createBarTask("B", 1, 60, 90);
    const taskC = createBarTask("C", 2, 100, 130);
    taskA.barChildren = [taskB];
    taskA.barDependencyChildren = [
      { task: taskB, type: "FS", lagMinutes: 0, source: "dependencies" },
      { task: taskC, type: "SS", lagMinutes: 30, source: "dependencyLinks" },
    ];

    const svgRef = createSvgRef();
    const { container } = render(
      <svg>
        <TaskGanttContent
          tasks={[taskA, taskB, taskC]}
          dates={[
            new Date("2026-01-01T00:00:00.000Z"),
            new Date("2026-01-02T00:00:00.000Z"),
          ]}
          ganttEvent={{ action: "" }}
          selectedTask={undefined}
          rowHeight={30}
          columnWidth={40}
          timeStep={24 * 60 * 60 * 1000}
          svg={svgRef}
          svgWidth={400}
          taskHeight={16}
          arrowColor="#000"
          arrowIndent={12}
          fontSize="12"
          fontFamily="sans-serif"
          rtl={false}
          setGanttEvent={jest.fn()}
          setFailedTask={jest.fn()}
          setSelectedTask={jest.fn()}
        />
      </svg>
    );

    expect(container.querySelectorAll(".arrow")).toHaveLength(2);
  });

  it("onDateChange の children は barChildren（直接後続）を維持する", async () => {
    const original = createBarTask("A", 0, 10, 30);
    const child = createBarTask("B", 1, 60, 90);
    const changed = {
      ...original,
      start: new Date("2026-01-03T00:00:00.000Z"),
      barChildren: [child],
      barDependencyChildren: [
        { task: child, type: "FS", lagMinutes: 0, source: "dependencies" as const },
      ],
    };
    const onDateChange = jest.fn().mockResolvedValue(true);
    const svgRef = createSvgRef();
    const setGanttEvent = jest.fn();

    render(
      <svg>
        <TaskGanttContent
          tasks={[changed, child]}
          dates={[
            new Date("2026-01-01T00:00:00.000Z"),
            new Date("2026-01-02T00:00:00.000Z"),
            new Date("2026-01-03T00:00:00.000Z"),
          ]}
          ganttEvent={{
            action: "move",
            changedTask: changed,
            originalSelectedTask: original,
          }}
          selectedTask={changed}
          rowHeight={30}
          columnWidth={40}
          timeStep={24 * 60 * 60 * 1000}
          svg={svgRef}
          svgWidth={400}
          taskHeight={16}
          arrowColor="#000"
          arrowIndent={12}
          fontSize="12"
          fontFamily="sans-serif"
          rtl={false}
          setGanttEvent={setGanttEvent}
          setFailedTask={jest.fn()}
          setSelectedTask={jest.fn()}
          onDateChange={onDateChange}
        />
      </svg>
    );

    fireEvent.mouseUp(svgRef.current as SVGSVGElement, { clientX: 120 });

    await waitFor(() => {
      expect(onDateChange).toHaveBeenCalled();
    });
    expect(onDateChange.mock.calls[0][1].map((task: BarTask) => task.id)).toEqual(["B"]);
    expect(setGanttEvent).toHaveBeenCalledWith({ action: "" });
  });
});
