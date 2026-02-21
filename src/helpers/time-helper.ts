/**
 * Parsed time value with validated hours (0-23) and minutes (0-59).
 */
export type ParsedTime = {
  hours: number;
  minutes: number;
};

/**
 * Parse "HH:mm" strings into validated hour/minute pairs.
 */
export const parseTimeString = (value?: string): ParsedTime | null => {
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
  return { hours, minutes };
};
