import { CalendarConfig } from "../types/public-types";
import { getJPHolidaySet } from "./jp-holidays";

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
 * Normalize and validate calendar configuration
 */
export const normalizeCalendarConfig = (
  config?: CalendarConfig,
  displayLocale?: string
): NormalizedCalendarConfig => {
  // Only apply Japanese defaults if calendar config is explicitly provided
  // For backward compatibility, if config is undefined, disable Japanese calendar features
  const isCalendarConfigured = config !== undefined;
  
  const locale = config?.locale || displayLocale || "ja";
  const dateFormat = config?.dateFormat || "MM/dd(EEE)";
  const enableJPHoliday = isCalendarConfigured && config?.enableJPHoliday !== false;
  const highlightNonWorkingDays = isCalendarConfigured && config?.highlightNonWorkingDays !== false;
  const workOnSaturday = config?.workOnSaturday === true;

  // Validate and normalize ISO date strings
  const extraHolidays = new Set<string>();
  if (config?.extraHolidays) {
    config.extraHolidays.forEach((dateStr) => {
      const normalized = normalizeISODate(dateStr);
      if (normalized) {
        extraHolidays.add(normalized);
      }
    });
  }

  const extraWorkingDays = new Set<string>();
  if (config?.extraWorkingDays) {
    config.extraWorkingDays.forEach((dateStr) => {
      const normalized = normalizeISODate(dateStr);
      if (normalized) {
        extraWorkingDays.add(normalized);
      }
    });
  }

  // Warn if non-ja locale is specified when calendar is configured
  if (isCalendarConfigured && locale !== "ja" && typeof console !== "undefined") {
    console.warn(
      `[Gantt Calendar] Non-Japanese locale "${locale}" specified. ` +
        `Holiday definitions and weekday labels will remain in Japanese.`
    );
  }

  // Warn if unsupported dateFormat is specified
  if (dateFormat !== "MM/dd(EEE)" && typeof console !== "undefined") {
    console.warn(
      `[Gantt Calendar] Unsupported dateFormat "${dateFormat}" specified. ` +
        `Falling back to default "MM/dd(EEE)" format.`
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
 * Returns null if invalid
 */
export const normalizeISODate = (dateStr: string): string | null => {
  try {
    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

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

    return dateStr;
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
    const jpHolidays = getJPHolidaySet();
    if (jpHolidays.has(dateStr)) {
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
