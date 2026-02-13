import { CalendarConfig } from "../types/public-types";
import { JP_HOLIDAYS_SET } from "./jp-holidays";

/**
 * Normalized calendar configuration with default values
 */
export interface NormalizedCalendarConfig {
  locale: string;
  dateFormat: string;
  enableJPHoliday: boolean;
  highlightNonWorkingDays: boolean;
  workOnSaturday: boolean;
  extraHolidays: Set<string>;
  extraWorkingDays: Set<string>;
}

/**
 * Module-scoped set to track warnings already emitted (works in both browser and SSR)
 */
const emittedWarnings = new Set<string>();

/**
 * Helper to emit a warning only once per unique key
 */
const warnOnce = (key: string, message: string): void => {
  if (!emittedWarnings.has(key) && typeof console !== "undefined") {
    console.warn(message);
    emittedWarnings.add(key);
  }
};

/**
 * Normalize and validate calendar configuration
 */
export const normalizeCalendarConfig = (
  config: CalendarConfig
): NormalizedCalendarConfig => {
  // When calendar config is provided, default to Japanese locale unless overridden
  // Normalize locale by trimming whitespace and falling back to "ja" if empty
  const rawLocale = config.locale?.trim() || "";
  const locale = rawLocale || "ja";
  const dateFormat = config.dateFormat || "MM/dd(EEE)";
  const enableJPHoliday = config.enableJPHoliday ?? true;
  const highlightNonWorkingDays = config.highlightNonWorkingDays ?? true;
  const workOnSaturday = config.workOnSaturday === true;

  // Validate and normalize ISO date strings
  const extraHolidays = new Set<string>();
  if (config.extraHolidays) {
    config.extraHolidays.forEach((dateStr) => {
      const normalized = normalizeISODate(dateStr);
      if (normalized) {
        extraHolidays.add(normalized);
      }
    });
  }

  const extraWorkingDays = new Set<string>();
  if (config.extraWorkingDays) {
    config.extraWorkingDays.forEach((dateStr) => {
      const normalized = normalizeISODate(dateStr);
      if (normalized) {
        extraWorkingDays.add(normalized);
      }
    });
  }

  // Warn if non-ja locale is specified when calendar is configured (only once per normalized locale)
  if (!locale.toLowerCase().startsWith("ja")) {
    const localeKey = locale.trim().toLowerCase();
    warnOnce(
      `gantt-calendar-locale-${localeKey}`,
      `[Gantt Calendar] Non-Japanese locale "${locale}" specified. ` +
        `Holiday definitions (including Japanese public holidays) are still based on the Japanese calendar.`
    );
  }

  // Warn if non-default dateFormat is specified (only once per normalized format)
  // Note: dateFormat is currently a legacy field and does not affect rendering
  if (dateFormat !== "MM/dd(EEE)") {
    const dateFormatKey = dateFormat.trim().toLowerCase();
    warnOnce(
      `gantt-calendar-dateFormat-${dateFormatKey}`,
      `[Gantt Calendar] Custom dateFormat "${dateFormat}" specified. ` +
        `Note: dateFormat is currently a legacy field and does not affect date rendering. ` +
        `The format "MM/dd(EEE)" is used internally regardless of this setting.`
    );
  }

  return {
    locale,
    dateFormat,
    enableJPHoliday,
    highlightNonWorkingDays,
    workOnSaturday,
    extraHolidays,
    extraWorkingDays,
  };
};

/**
 * Normalize ISO date string (YYYY-MM-DD) to valid date
 * Returns canonical YYYY-MM-DD format or null if invalid
 */
export const normalizeISODate = (dateStr: string): string | null => {
  try {
    const trimmed = dateStr.trim();

    // Strictly validate format: YYYY-M-D where year is 4 digits and month/day are 1–2 digits
    // This prevents inputs with trailing characters (e.g. "2024-01-15abc") from being accepted.
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
      return null;
    }

    const parts = trimmed.split("-");
    if (parts.length !== 3) return null;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    // Validate ranges
    if (
      isNaN(year) ||
      isNaN(month) ||
      isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return null;
    }

    // Create date and verify it matches input (catches invalid dates like 2/30)
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return null;
    }

    // Return canonical zero-padded format
    const paddedMonth = String(month).padStart(2, "0");
    const paddedDay = String(day).padStart(2, "0");
    return `${year}-${paddedMonth}-${paddedDay}`;
  } catch (e) {
    if (typeof console !== "undefined") {
      console.warn(`[Gantt Calendar] Invalid date string: ${dateStr}`);
    }
    return null;
  }
};

/**
 * Convert Date to ISO date string (YYYY-MM-DD)
 */
export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date is a working day according to calendar configuration
 */
export const isWorkingDay = (
  date: Date,
  config: NormalizedCalendarConfig
): boolean => {
  const dateStr = toISODateString(date);

  // Priority 1: extraWorkingDays overrides everything
  if (config.extraWorkingDays.has(dateStr)) {
    return true;
  }

  // Priority 2: extraHolidays makes it non-working
  if (config.extraHolidays.has(dateStr)) {
    return false;
  }

  // Priority 3: Check day of week
  const dayOfWeek = date.getDay();
  
  // Sunday is always non-working
  if (dayOfWeek === 0) {
    return false;
  }

  // Saturday depends on workOnSaturday setting
  if (dayOfWeek === 6 && !config.workOnSaturday) {
    return false;
  }

  // Priority 4: Check Japanese holidays
  if (config.enableJPHoliday) {
    if (JP_HOLIDAYS_SET.has(dateStr)) {
      return false;
    }
  }

  // Default: working day
  return true;
};

/**
 * Count working days between two dates (inclusive)
 */
export const countWorkingDays = (
  startDate: Date,
  endDate: Date,
  config: NormalizedCalendarConfig
): number => {
  let count = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate, config)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

/**
 * Format date in MM/dd(曜) format using Intl.DateTimeFormat
 */
export const formatJapaneseDate = (date: Date): string => {
  try {
    const formatter = new Intl.DateTimeFormat("ja", {
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });

    const parts = formatter.formatToParts(date);
    let month = "";
    let day = "";
    let weekday = "";

    parts.forEach((part) => {
      if (part.type === "month") {
        month = part.value;
      } else if (part.type === "day") {
        day = part.value;
      } else if (part.type === "weekday") {
        weekday = part.value;
      }
    });

    return `${month}/${day}(${weekday})`;
  } catch (e) {
    // Fallback to simple format if Intl fails
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}/${day}`;
  }
};
