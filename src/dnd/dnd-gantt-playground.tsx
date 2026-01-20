import React from "react";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Gantt } from "../components/gantt/gantt";
import { Task, ViewMode } from "../types/public-types";
import {
  applyIndentSteps,
  deriveIndentSteps,
  getTaskLevel,
  moveTaskWithChildren,
  normalizeDisplayOrder,
  INDENT_WIDTH_PX,
} from "./task-hierarchy";
import { buildSampleTasks } from "./sample-tasks";

type SortableTaskRowProps = {
  task: Task;
  tasks: Task[];
};

const rowStyles: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "48px 1fr",
  alignItems: "center",
  padding: "6px 8px",
  borderBottom: "1px solid #e5e7eb",
  gap: "8px",
  background: "#fff",
};

const handleStyles: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  background: "#f9fafb",
  cursor: "grab",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const SortableTaskRow: React.FC<SortableTaskRowProps> = ({ task, tasks }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const level = getTaskLevel(tasks, task.id);
  const style: React.CSSProperties = {
    ...rowStyles,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} data-task-id={task.id}>
      <button
        type="button"
        aria-label={`${task.name} をドラッグ`}
        style={handleStyles}
        {...listeners}
        {...attributes}
      >
        ☰
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingLeft: level * INDENT_WIDTH_PX,
        }}
      >
        <span style={{ fontWeight: 600 }}>{task.name}</span>
        <span style={{ color: "#6b7280", fontSize: 12 }}>{task.type}</span>
      </div>
    </div>
  );
};

export const DndGanttPlayground: React.FC = () => {
  const [tasks, setTasks] = React.useState<Task[]>(() =>
    normalizeDisplayOrder(buildSampleTasks())
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;
      setActiveId(null);
      if (!over) return;
      setTasks(prevTasks => {
        const reordered = moveTaskWithChildren(prevTasks, active.id as string, over.id as string);
        const indentSteps = deriveIndentSteps(delta.x);
        const adjusted = applyIndentSteps(reordered, active.id as string, indentSteps);
        return normalizeDisplayOrder(adjusted);
      });
    },
    []
  );

  const activeTask = tasks.find(task => task.id === activeId);

  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        gridTemplateColumns: "minmax(320px, 380px) 1fr",
        alignItems: "start",
      }}
    >
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          overflow: "hidden",
          boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ padding: "12px 16px", background: "#f3f4f6" }}>
          <h4 style={{ margin: 0, fontSize: 16 }}>dnd-kit 行並べ替え / 階層化 PoC</h4>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: 12 }}>
            ハンドルでドラッグし、横方向の移動量でインデントを切り替えます。
          </p>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={tasks.map(task => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <div>
              {tasks.map(task => (
                <SortableTaskRow key={task.id} task={task} tasks={tasks} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay dropAnimation={null}>
            {activeTask ? (
              <div
                style={{
                  ...rowStyles,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                  background: "#eef2ff",
                }}
              >
                <span style={{ marginLeft: 12, fontWeight: 700 }}>{activeTask.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 8,
          boxShadow: "0 10px 20px rgba(0,0,0,0.04)",
          background: "#fff",
        }}
      >
        <Gantt
          tasks={tasks}
          viewMode={ViewMode.Day}
          listCellWidth="180px"
          columnWidth={70}
          locale="ja-JP"
        />
      </div>
    </div>
  );
};
