import { Task } from "../types/public-types";
import { isWorkingDay, NormalizedCalendarConfig } from "./calendar-helper";

export type ActualsNormalizeOptions = {
  workHoursPerDay?: number;
  workdayStartTime?: string;
  workdayEndTime?: string;
  calendarConfig?: NormalizedCalendarConfig;
};

type WorkdayWindow = {
  startMinutes: number;
  endMinutes: number;
  workMinutesPerDay: number;
  breakMinutes: number;
};

type ActualsContext = {
  window: WorkdayWindow;
  calendarConfig?: NormalizedCalendarConfig;
};

const DEFAULT_WORKDAY_START_MINUTES = 9 * 60;
const DEFAULT_WORKDAY_END_MINUTES = 18 * 60;
const DEFAULT_BREAK_MINUTES = 60;
const MINUTES_PER_HOUR = 60;

const emittedWarnings = new Set<string>();

const warnOnce = (key: string, message: string): void => {
  if (!emittedWarnings.has(key) && typeof console !== "undefined") {
    console.warn(message);
    emittedWarnings.add(key);
  }
};

const parseTimeToMinutes = (value?: string): number | null => {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * MINUTES_PER_HOUR + minutes;
};

const resolveWorkdayWindow = (options: ActualsNormalizeOptions): WorkdayWindow => {
  const parsedStart = parseTimeToMinutes(options.workdayStartTime);
  const parsedEnd = parseTimeToMinutes(options.workdayEndTime);
  let startMinutes = parsedStart ?? DEFAULT_WORKDAY_START_MINUTES;
  let endMinutes = parsedEnd ?? DEFAULT_WORKDAY_END_MINUTES;
  if (endMinutes <= startMinutes) {
    startMinutes = DEFAULT_WORKDAY_START_MINUTES;
    endMinutes = DEFAULT_WORKDAY_END_MINUTES;
  }
  const windowMinutes = endMinutes - startMinutes;
  const workHoursPerDay = options.workHoursPerDay;
  const requestedWorkHours =
    workHoursPerDay !== undefined && Number.isFinite(workHoursPerDay) && workHoursPerDay > 0
      ? workHoursPerDay
      : undefined;
  let workMinutesPerDay =
    requestedWorkHours !== undefined
      ? Math.round(requestedWorkHours * MINUTES_PER_HOUR)
      : windowMinutes <= DEFAULT_BREAK_MINUTES
        ? windowMinutes
        : windowMinutes - DEFAULT_BREAK_MINUTES;
  if (workMinutesPerDay > windowMinutes) {
    const windowHours = windowMinutes / MINUTES_PER_HOUR;
    warnOnce(
      `gantt-actuals-workhours-${requestedWorkHours}-${windowHours}`,
      `[Gantt Actuals] workHoursPerDay (${requestedWorkHours}h) exceeds workday window (${windowHours}h). ` +
        `Clamping to ${windowHours}h.`
    );
    workMinutesPerDay = windowMinutes;
  }
  const breakMinutes = Math.max(0, windowMinutes - workMinutesPerDay);
  return {
    startMinutes,
    endMinutes,
    workMinutesPerDay,
    breakMinutes,
  };
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60000);

const diffMinutes = (end: Date, start: Date) =>
  (end.getTime() - start.getTime()) / 60000;

const toDateAtMinutes = (day: Date, minutes: number) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);

const buildWorkSegments = (
  day: Date,
  window: WorkdayWindow
): Array<{ start: Date; end: Date }> => {
  if (window.workMinutesPerDay <= 0) return [];
  const dayStart = toDateAtMinutes(day, window.startMinutes);
  const dayEnd = toDateAtMinutes(day, window.endMinutes);
  if (window.breakMinutes <= 0) {
    return [{ start: dayStart, end: dayEnd }];
  }
  const beforeBreak = Math.floor(window.workMinutesPerDay / 2);
  const afterBreak = window.workMinutesPerDay - beforeBreak;
  const breakStart = addMinutes(dayStart, beforeBreak);
  const breakEnd = addMinutes(breakStart, window.breakMinutes);
  const segments: Array<{ start: Date; end: Date }> = [];
  if (beforeBreak > 0) {
    segments.push({ start: dayStart, end: breakStart });
  }
  if (afterBreak > 0) {
    segments.push({ start: breakEnd, end: dayEnd });
  }
  return segments;
};

const resolveContext = (options: ActualsNormalizeOptions): ActualsContext => ({
  window: resolveWorkdayWindow(options),
  calendarConfig: options.calendarConfig,
});

const isValidDate = (value?: Date) =>
  value instanceof Date && !Number.isNaN(value.getTime());

const isValidEffort = (value?: number) =>
  value !== undefined && Number.isFinite(value) && value >= 0;

export const roundEffortToQuarterHour = (
  effort?: number
): number | undefined => {
  if (!isValidEffort(effort)) {
    return undefined;
  }
  const minutes = (effort as number) * MINUTES_PER_HOUR;
  const scaled = minutes / 15;
  // Guard against floating point precision around half steps.
  const roundedMinutes = Math.floor(scaled + 0.5 + Number.EPSILON) * 15;
  return roundedMinutes / MINUTES_PER_HOUR;
};

const recalcEffort = (start: Date, end: Date, context: ActualsContext) => {
  let totalMinutes = 0;
  let currentDay = startOfDay(start);
  const endTime = end.getTime();
  while (currentDay.getTime() < endTime) {
    if (
      !context.calendarConfig ||
      isWorkingDay(currentDay, context.calendarConfig)
    ) {
      const segments = buildWorkSegments(currentDay, context.window);
      for (const segment of segments) {
        const overlapStart = segment.start > start ? segment.start : start;
        const overlapEnd = segment.end < end ? segment.end : end;
        if (overlapStart < overlapEnd) {
          totalMinutes += diffMinutes(overlapEnd, overlapStart);
        }
      }
    }
    currentDay = addDays(currentDay, 1);
  }
  const rounded = roundEffortToQuarterHour(totalMinutes / MINUTES_PER_HOUR);
  return rounded ?? 0;
};

const deriveEnd = (
  start: Date,
  effortHours: number,
  context: ActualsContext
) => {
  const roundedEffort = roundEffortToQuarterHour(effortHours);
  if (roundedEffort === undefined) {
    return undefined;
  }
  let remaining = Math.round(roundedEffort * MINUTES_PER_HOUR);
  if (remaining === 0) {
    return start;
  }
  let cursor = new Date(start);
  while (remaining > 0) {
    const day = startOfDay(cursor);
    if (
      context.calendarConfig &&
      !isWorkingDay(day, context.calendarConfig)
    ) {
      cursor = toDateAtMinutes(addDays(day, 1), context.window.startMinutes);
      continue;
    }
    const segments = buildWorkSegments(day, context.window);
    if (segments.length === 0) {
      cursor = toDateAtMinutes(addDays(day, 1), context.window.startMinutes);
      continue;
    }
    for (const segment of segments) {
      if (cursor < segment.start) {
        cursor = segment.start;
      }
      if (cursor >= segment.end) {
        continue;
      }
      const available = diffMinutes(segment.end, cursor);
      if (remaining <= available) {
        return addMinutes(cursor, remaining);
      }
      remaining -= available;
      cursor = segment.end;
    }
    cursor = toDateAtMinutes(addDays(day, 1), context.window.startMinutes);
  }
  return cursor;
};

const deriveStart = (
  end: Date,
  effortHours: number,
  context: ActualsContext
) => {
  const roundedEffort = roundEffortToQuarterHour(effortHours);
  if (roundedEffort === undefined) {
    return undefined;
  }
  let remaining = Math.round(roundedEffort * MINUTES_PER_HOUR);
  if (remaining === 0) {
    return end;
  }
  let cursor = new Date(end);
  while (remaining > 0) {
    const day = startOfDay(cursor);
    if (
      context.calendarConfig &&
      !isWorkingDay(day, context.calendarConfig)
    ) {
      const prevDay = addDays(day, -1);
      cursor = toDateAtMinutes(prevDay, context.window.endMinutes);
      continue;
    }
    const segments = buildWorkSegments(day, context.window).slice().reverse();
    if (segments.length === 0) {
      const prevDay = addDays(day, -1);
      cursor = toDateAtMinutes(prevDay, context.window.endMinutes);
      continue;
    }
    for (const segment of segments) {
      if (cursor > segment.end) {
        cursor = segment.end;
      }
      if (cursor <= segment.start) {
        continue;
      }
      const available = diffMinutes(cursor, segment.start);
      if (remaining <= available) {
        return addMinutes(cursor, -remaining);
      }
      remaining -= available;
      cursor = segment.start;
    }
    const prevDay = addDays(day, -1);
    cursor = toDateAtMinutes(prevDay, context.window.endMinutes);
  }
  return cursor;
};

export const normalizeActuals = (
  task: Task,
  options: ActualsNormalizeOptions = {}
): Task => {
  const context = resolveContext(options);
  const validStart = isValidDate(task.start) ? task.start : undefined;
  const validEnd = isValidDate(task.end) ? task.end : undefined;
  const validEffort = isValidEffort(task.actualEffort)
    ? (task.actualEffort as number)
    : undefined;
  const hasValidRange =
    validStart &&
    validEnd &&
    validStart.getTime() <= validEnd.getTime();
  let nextStart = task.start;
  let nextEnd = task.end;
  let nextEffort = task.actualEffort;
  if (hasValidRange) {
    nextEffort = recalcEffort(validStart as Date, validEnd as Date, context);
    if (nextEffort !== task.actualEffort) {
      console.debug("[Actuals] effort normalized", {
        rowId: task.id,
        field: "actualEffort",
        reason: "start-end",
      });
    }
  } else if (validStart && validEffort !== undefined) {
    const roundedEffort = roundEffortToQuarterHour(validEffort);
    const derivedEnd =
      roundedEffort === undefined
        ? undefined
        : deriveEnd(validStart as Date, roundedEffort, context);
    if (derivedEnd) {
      nextEnd = derivedEnd;
      nextEffort = roundedEffort;
      console.debug("[Actuals] end derived", {
        rowId: task.id,
        field: "end",
        reason: "start-effort",
      });
    }
  } else if (validEnd && validEffort !== undefined) {
    const roundedEffort = roundEffortToQuarterHour(validEffort);
    const derivedStart =
      roundedEffort === undefined
        ? undefined
        : deriveStart(validEnd as Date, roundedEffort, context);
    if (derivedStart) {
      nextStart = derivedStart;
      nextEffort = roundedEffort;
      console.debug("[Actuals] start derived", {
        rowId: task.id,
        field: "start",
        reason: "end-effort",
      });
    }
  }
  const nextTask: Task = {
    ...task,
    start: nextStart,
    end: nextEnd,
    actualEffort: nextEffort,
  };
  const hasChange =
    nextTask.start.getTime() !== task.start.getTime() ||
    nextTask.end.getTime() !== task.end.getTime() ||
    nextTask.actualEffort !== task.actualEffort;
  return hasChange ? nextTask : task;
};
