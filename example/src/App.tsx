import React from "react";
import {
  EffortUnit,
  Task,
  ViewMode,
  VisibleField,
  GanttProps,
  Gantt,
  formatEffort,
  formatDate,
  normalizeProcess,
  normalizeStatus,
  getStatusBadgeText,
  getStatusColor,
  DEFAULT_VISIBLE_FIELDS,
  TaskProcess,
  TaskStatus,
} from "@levelcaptech/gantt-task-react-custom";
import type { CalendarConfig } from "@levelcaptech/gantt-task-react-custom";
import { ViewSwitcher } from "./components/view-switcher";
import { getStartEndDateForProject, initTasks } from "./helper";
import "@levelcaptech/gantt-task-react-custom/dist/index.css";

/** 10k 件の合成タスクを生成する（seed=42、plan §4.2 準拠） */
function initLargeTasks(size = 10000): Task[] {
  let state = 42;
  const rand = () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };

  const base = new Date("2024-01-01");
  const tasks: Task[] = [];

  for (let i = 0; i < size; i++) {
    const startOffset = Math.floor(rand() * 365);
    const duration = Math.floor(rand() * 30) + 1;
    const start = new Date(base);
    start.setDate(start.getDate() + startOffset);
    const end = new Date(start);
    end.setDate(end.getDate() + duration);

    const isProject = rand() < 0.1;
    const task: Task = {
      id: `lt-${i}`,
      name: isProject ? `プロジェクト ${i}` : `タスク ${i}`,
      start,
      end,
      type: isProject ? "project" : "task",
      progress: Math.floor(rand() * 100),
      styles: undefined,
      dependencies: [],
    };

    if (!isProject && i > 0) {
      const prevIndex = Math.max(0, i - 1 - Math.floor(rand() * 50));
      if (rand() < 0.5) {
        task.dependencies = [`lt-${prevIndex}`];
      }
    }

    tasks.push(task);
  }
  return tasks;
}

const tooltipStyles = {
  tooltipDefaultContainer: "TooltipContainer",
  tooltipDefaultContainerParagraph: "TooltipParagraph",
};

const JapaneseTooltip: React.FC<{
  task: Task;
  fontSize: string;
  fontFamily: string;
  effortDisplayUnit?: EffortUnit;
}> = ({ task, fontSize, fontFamily, effortDisplayUnit = "MH" }) => {
  const style = {
    fontSize,
    fontFamily,
  };
  const durationDays = Math.max(
    1,
    Math.ceil(
      (task.end.getTime() - task.start.getTime()) / (1000 * 60 * 60 * 24)
    )
  );
  const formattedDateRange = `${formatDate(task.start)}〜${formatDate(
    task.end
  )}`;
  const titleText = `${task.name}: ${formattedDateRange}`;
  const statusValue = normalizeStatus(task.status as TaskStatus);
  const processValue = normalizeProcess(task.process as TaskProcess);
  const plannedRange =
    task.plannedStart || task.plannedEnd
      ? `${formatDate(task.plannedStart)}〜${formatDate(task.plannedEnd)}`
      : "";
  const plannedEffort = formatEffort(task.plannedEffort, effortDisplayUnit);
  const actualEffort = formatEffort(task.actualEffort, effortDisplayUnit);
  return (
    <div className={tooltipStyles.tooltipDefaultContainer} style={style}>
      <b style={{ fontSize: `calc(${fontSize} + 6px)` }}>{titleText}</b>
      {task.end.getTime() - task.start.getTime() !== 0 && (
        <p className={tooltipStyles.tooltipDefaultContainerParagraph}>{`期間: ${durationDays}日`}</p>
      )}
      <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
        工程: {processValue}
      </p>
      <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
        担当: {task.assignee || "-"}
      </p>
      {plannedRange && (
        <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
          予定: {plannedRange}
        </p>
      )}
      {plannedEffort && (
        <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
          予定工数: {plannedEffort}
        </p>
      )}
      {actualEffort && (
        <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
          実績工数: {actualEffort}
        </p>
      )}
      <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
        ステータス:{" "}
        <span
          className="TooltipStatusBadge"
          style={{ backgroundColor: getStatusColor(statusValue) }}
        >
          {getStatusBadgeText(statusValue)}
        </span>{" "}
        {statusValue}
      </p>
      <p className={tooltipStyles.tooltipDefaultContainerParagraph}>
        {!!task.progress && `進捗: ${task.progress} %`}
      </p>
    </div>
  );
};

type TaskFieldValue = Task[VisibleField];

// 表示順と重複除外に使う基準の列（進捗列を含む定義は以下で構築する）
const BASE_VISIBLE_FIELDS: VisibleField[] = ["name", "start", "end"];

const VISIBLE_FIELDS_WITH_PROGRESS: VisibleField[] = [
  ...BASE_VISIBLE_FIELDS,
  "progress",
  ...DEFAULT_VISIBLE_FIELDS.filter(field => !BASE_VISIBLE_FIELDS.includes(field)),
];

const resolveCellCommitValue = (
  columnId: VisibleField,
  value: string,
  fallbackValue: TaskFieldValue
) => {
  switch (columnId) {
    case "start":
    case "end":
    case "plannedStart":
    case "plannedEnd": {
      const parsedDate = new Date(value);
      return Number.isNaN(parsedDate.getTime()) ? fallbackValue : parsedDate;
    }
    case "plannedEffort":
    case "actualEffort":
    case "progress": {
      const parsedNumber = Number(value);
      return Number.isNaN(parsedNumber) ? fallbackValue : parsedNumber;
    }
    default:
      return value;
  }
};

// 初期化
const App = () => {
  const [view, setView] = React.useState<ViewMode>(ViewMode.Day);
  const [tasks, setTasks] = React.useState<Task[]>(initTasks());
  const [isChecked, setIsChecked] = React.useState(true);
  const [effortUnit, setEffortUnit] = React.useState<EffortUnit>("MH");
  const [largeTasks] = React.useState<Task[]>(() => initLargeTasks(10000));
  const [enableVirtualization, setEnableVirtualization] = React.useState(false);

  // 日本カレンダー設定
  const calendarConfig: CalendarConfig = {
    locale: "ja",
    enableJPHoliday: true,
    highlightNonWorkingDays: true,
    workOnSaturday: false,
    // 例: 会社独自の休業日を追加
    extraHolidays: ["2024-12-30", "2024-12-31"],
    // 例: 特別稼働日を追加
    extraWorkingDays: [],
  };

  let columnWidth = 65;
  if (view === ViewMode.Year) {
    columnWidth = 350;
  } else if (view === ViewMode.Month) {
    columnWidth = 300;
  } else if (view === ViewMode.Week) {
    columnWidth = 250;
  }

  const handleTaskChange = (task: Task) => {
    console.log(`日付が変更されたタスク ID: ${task.id}`);
    let newTasks = tasks.map(t => (t.id === task.id ? task : t));
    if (task.project) {
      const [start, end] = getStartEndDateForProject(newTasks, task.project);
      const project = newTasks[newTasks.findIndex(t => t.id === task.project)];
      if (
        project.start.getTime() !== start.getTime() ||
        project.end.getTime() !== end.getTime()
      ) {
        const changedProject = { ...project, start, end };
        newTasks = newTasks.map(t =>
          t.id === task.project ? changedProject : t
        );
      }
    }
    setTasks(newTasks);
  };

  const handleTaskDelete = (task: Task) => {
    const conf = window.confirm(`${task.name} を削除してもよろしいですか？`);
    if (conf) {
      setTasks(tasks.filter(t => t.id !== task.id));
    }
    return conf;
  };

  const handleProgressChange = async (task: Task) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
    console.log(`進捗が変更されたタスク ID: ${task.id}`);
  };

  const handleTaskUpdate = (taskId: string, updatedFields: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, ...updatedFields } : t))
    );
  };

  const handleCellCommit: NonNullable<GanttProps["onCellCommit"]> = async ({
    rowId,
    columnId,
    value,
  }) => {
    setTasks(prev =>
      prev.map(task => {
        if (task.id !== rowId) {
          return task;
        }
        const updatedValue = resolveCellCommitValue(
          columnId,
          value,
          task[columnId]
        );
        return { ...task, [columnId]: updatedValue };
      })
    );
  };

  const handleDblClick = (task: Task) => {
    alert(`ダブルクリックイベント ID: ${task.id}`);
  };

  const handleClick = (task: Task) => {
    console.log(`クリックイベント ID: ${task.id}`);
  };

  const handleSelect = (task: Task, isSelected: boolean) => {
    const selectionText = isSelected ? "選択されました" : "選択解除されました";
    console.log(`${task.name} は ${selectionText}`);
  };

  const handleExpanderClick = (task: Task) => {
    setTasks(tasks.map(t => (t.id === task.id ? task : t)));
    console.log(`折りたたみ操作のタスク ID: ${task.id}`);
  };

  return (
    <div className="Wrapper">
      <ViewSwitcher
        onViewModeChange={viewMode => setView(viewMode)}
        onViewListChange={setIsChecked}
        isChecked={isChecked}
      />
      <div className="UnitSwitcher">
        <label htmlFor="effortUnit">工数単位</label>
        <select
          id="effortUnit"
          className="EffortUnitSelect"
          value={effortUnit}
          onChange={event =>
            setEffortUnit(event.target.value as EffortUnit)
          }
        >
          <option value="MH">MH</option>
          <option value="MD">MD</option>
          <option value="MM">MM</option>
        </select>
      </div>
      <h3>高さ無制限のガントチャート</h3>
      <Gantt
        tasks={tasks}
        viewMode={view}
        onDateChange={handleTaskChange}
        onDelete={handleTaskDelete}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDblClick}
        onClick={handleClick}
        onSelect={handleSelect}
        onExpanderClick={handleExpanderClick}
        listCellWidth={isChecked ? "130px" : ""}
        columnWidth={columnWidth}
        locale="ja-JP"
        calendar={calendarConfig}
        TooltipContent={JapaneseTooltip}
        visibleFields={VISIBLE_FIELDS_WITH_PROGRESS}
        onTaskUpdate={handleTaskUpdate}
        onCellCommit={handleCellCommit}
        effortDisplayUnit={effortUnit}
      />
      <h3>高さ制限ありのガントチャート</h3>
      <Gantt
        tasks={tasks}
        viewMode={view}
        onDateChange={handleTaskChange}
        onDelete={handleTaskDelete}
        onProgressChange={handleProgressChange}
        onDoubleClick={handleDblClick}
        onClick={handleClick}
        onSelect={handleSelect}
        onExpanderClick={handleExpanderClick}
        listCellWidth={isChecked ? "130px" : ""}
        ganttHeight={300}
        columnWidth={columnWidth}
        locale="ja-JP"
        calendar={calendarConfig}
        TooltipContent={JapaneseTooltip}
        visibleFields={VISIBLE_FIELDS_WITH_PROGRESS}
        onTaskUpdate={handleTaskUpdate}
        onCellCommit={handleCellCommit}
        effortDisplayUnit={effortUnit}
      />
      <h3>大規模タスクデモ（10k 件）— 仮想化 opt-in</h3>
      <div>
        <label>
          <input
            type="checkbox"
            checked={enableVirtualization}
            onChange={e => setEnableVirtualization(e.target.checked)}
          />
          {" enableVirtualization（仮想化有効/無効を切り替え）"}
        </label>
      </div>
      <Gantt
        tasks={largeTasks}
        viewMode={ViewMode.Day}
        ganttHeight={600}
        columnWidth={60}
        rowHeight={32}
        enableVirtualization={enableVirtualization}
        listCellWidth="130px"
        locale="ja-JP"
      />
    </div>
  );
};

export default App;
export { JapaneseTooltip };
