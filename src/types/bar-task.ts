import { DependencyType, Task, TaskType } from "./public-types";

export type BarTaskDependencyEdge = {
  task: BarTask;
  type: DependencyType;
  lagMinutes: number;
  source: "dependencies" | "dependencyLinks";
};

export interface BarTask extends Task {
  index: number;
  typeInternal: TaskTypeInternal;
  x1: number;
  x2: number;
  y: number;
  height: number;
  progressX: number;
  progressWidth: number;
  barCornerRadius: number;
  handleWidth: number;
  barChildren: BarTask[];
  barDependencyChildren: BarTaskDependencyEdge[];
  styles: {
    backgroundColor: string;
    backgroundSelectedColor: string;
    progressColor: string;
    progressSelectedColor: string;
  };
}

export type TaskTypeInternal = TaskType | "smalltask";
