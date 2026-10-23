import {
  normalizeCalendarConfig,
  normalizeISODate,
  toISODateString,
  isWorkingDay,
  countWorkingDays,
  formatJapaneseDate,
} from "../helpers/calendar-helper";
import { JP_HOLIDAYS_SET } from "../helpers/jp-holidays";

const JP_2007_HOLIDAY_DATES = [
  "2007-01-01",
  "2007-01-08",
  "2007-02-11",
  "2007-02-12",
  "2007-03-21",
  "2007-04-29",
  "2007-04-30",
  "2007-05-03",
  "2007-05-04",
  "2007-05-05",
  "2007-07-16",
  "2007-09-17",
  "2007-09-23",
  "2007-09-24",
  "2007-10-08",
  "2007-11-03",
  "2007-11-23",
  "2007-12-23",
  "2007-12-24",
];

describe("normalizeISODate", () => {
  test("valid date", () => {
    expect(normalizeISODate("2024-01-15")).toBe("2024-01-15");
    expect(normalizeISODate("2024-12-31")).toBe("2024-12-31");
  });

  test("invalid date", () => {
    expect(normalizeISODate("2024-02-30")).toBeNull(); // February 30th doesn't exist
    expect(normalizeISODate("2024-13-01")).toBeNull(); // Month 13 doesn't exist
    expect(normalizeISODate("invalid")).toBeNull();
    expect(normalizeISODate("2024/01/15")).toBeNull(); // Wrong separator
  });
});

describe("toISODateString", () => {
  test("convert date to ISO string", () => {
    expect(toISODateString(new Date(2024, 0, 15))).toBe("2024-01-15");
    expect(toISODateString(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});

describe("normalizeCalendarConfig", () => {
  test("default configuration with explicit empty calendar config", () => {
    const config = normalizeCalendarConfig({});
    expect(config.locale).toBe("ja");
    expect(config.dateFormat).toBe("MM/dd(EEE)");
    expect(config.enableJPHoliday).toBe(true); // Enabled when config provided
    expect(config.highlightNonWorkingDays).toBe(true); // Enabled when config provided
    expect(config.workOnSaturday).toBe(false);
    expect(config.extraHolidays.size).toBe(0);
    expect(config.extraWorkingDays.size).toBe(0);
  });

  test("custom configuration", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      const config = normalizeCalendarConfig({
        locale: "en",
        workOnSaturday: true,
        extraHolidays: ["2024-01-15"],
        extraWorkingDays: ["2024-01-01"],
      });
      expect(config.locale).toBe("en");
      expect(config.workOnSaturday).toBe(true);
      expect(config.extraHolidays.has("2024-01-15")).toBe(true);
      expect(config.extraWorkingDays.has("2024-01-01")).toBe(true);
    } finally {
      warnSpy.mockRestore();
    }
  });

  test("invalid dates are filtered", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2024-01-15", "invalid", "2024-02-30"],
    });
    expect(config.extraHolidays.size).toBe(1);
    expect(config.extraHolidays.has("2024-01-15")).toBe(true);
  });

  test("normalizes non-zero-padded dates", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2024-1-5", "2024-01-15"],
    });
    expect(config.extraHolidays.size).toBe(2);
    expect(config.extraHolidays.has("2024-01-05")).toBe(true);
    expect(config.extraHolidays.has("2024-01-15")).toBe(true);
  });

  test("trims whitespace from locale", () => {
    // Test that locale with leading/trailing whitespace is trimmed
    const config1 = normalizeCalendarConfig({ locale: " ja-JP " });
    expect(config1.locale).toBe("ja-JP");

    const config2 = normalizeCalendarConfig({ locale: "  ja  " });
    expect(config2.locale).toBe("ja");
  });

  test("falls back to 'ja' when locale is empty after trimming", () => {
    // Test that empty or whitespace-only locale falls back to "ja"
    const config1 = normalizeCalendarConfig({ locale: "   " });
    expect(config1.locale).toBe("ja");

    const config2 = normalizeCalendarConfig({ locale: "" });
    expect(config2.locale).toBe("ja");
  });
});

describe("isWorkingDay", () => {
  test("weekday is working day", () => {
    const config = normalizeCalendarConfig({});
    // Monday 2024-01-15
    expect(isWorkingDay(new Date(2024, 0, 15), config)).toBe(true);
  });

  test("Sunday is non-working day", () => {
    const config = normalizeCalendarConfig({});
    // Sunday 2024-01-14
    expect(isWorkingDay(new Date(2024, 0, 14), config)).toBe(false);
  });

  test("Saturday is non-working by default", () => {
    const config = normalizeCalendarConfig({});
    // Saturday 2024-01-13
    expect(isWorkingDay(new Date(2024, 0, 13), config)).toBe(false);
  });

  test("Saturday is working when workOnSaturday is true", () => {
    const config = normalizeCalendarConfig({ workOnSaturday: true });
    // Saturday 2024-01-13
    expect(isWorkingDay(new Date(2024, 0, 13), config)).toBe(true);
  });

  test("Japanese holiday is non-working", () => {
    const config = normalizeCalendarConfig({ enableJPHoliday: true });
    // New Year's Day 2024-01-01 (Monday)
    expect(isWorkingDay(new Date(2024, 0, 1), config)).toBe(false);
  });

  test("Japanese holiday is working when disabled", () => {
    const config = normalizeCalendarConfig({ enableJPHoliday: false });
    // New Year's Day 2024-01-01 (Monday)
    expect(isWorkingDay(new Date(2024, 0, 1), config)).toBe(true);
  });

  test("2007 Japanese holidays are non-working days", () => {
    const config = normalizeCalendarConfig({});

    JP_2007_HOLIDAY_DATES.forEach((dateStr) => {
      const date = new Date(
        Number(dateStr.slice(0, 4)),
        Number(dateStr.slice(5, 7)) - 1,
        Number(dateStr.slice(8, 10))
      );
      expect(isWorkingDay(date, config)).toBe(false);
    });
  });

  test("2007 holiday weekends and regular weekday are handled correctly", () => {
    const config = normalizeCalendarConfig({});
    expect(isWorkingDay(new Date(2007, 1, 12), config)).toBe(false);
    expect(isWorkingDay(new Date(2007, 3, 30), config)).toBe(false);
    expect(isWorkingDay(new Date(2007, 8, 24), config)).toBe(false);
    expect(isWorkingDay(new Date(2007, 11, 24), config)).toBe(false);
    expect(isWorkingDay(new Date(2007, 0, 9), config)).toBe(true);
  });

  test("2007 holidays are working when Japanese holidays are disabled", () => {
    const config = normalizeCalendarConfig({ enableJPHoliday: false });
    expect(isWorkingDay(new Date(2007, 0, 1), config)).toBe(true);
    expect(isWorkingDay(new Date(2007, 0, 9), config)).toBe(true);
  });

  test("existing 2024-2026 holiday checks remain stable", () => {
    const config = normalizeCalendarConfig({});
    expect(isWorkingDay(new Date(2024, 0, 1), config)).toBe(false);
    expect(isWorkingDay(new Date(2025, 4, 5), config)).toBe(false);
    expect(isWorkingDay(new Date(2026, 8, 21), config)).toBe(false);
    expect(isWorkingDay(new Date(2026, 8, 23), config)).toBe(true);
  });

  test("2007 holiday data is included in JP_HOLIDAYS_SET", () => {
    JP_2007_HOLIDAY_DATES.forEach((date) => {
      expect(JP_HOLIDAYS_SET.has(date)).toBe(true);
    });
  });

  test("extraWorkingDays override a 2007 substitute holiday while extraHolidays still mark dates as non-working", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2007-01-08"],
      extraWorkingDays: ["2007-02-12"],
    });

    expect(isWorkingDay(new Date(2007, 0, 8), config)).toBe(false);
    expect(isWorkingDay(new Date(2007, 1, 12), config)).toBe(true);
  });

  test("extraWorkingDays overrides holiday status for a 2007 holiday", () => {
    const config = normalizeCalendarConfig({
      extraWorkingDays: ["2007-01-01"],
    });
    expect(isWorkingDay(new Date(2007, 0, 1), config)).toBe(true);
  });

  test("extraHolidays override 2007 working day", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2007-01-09"],
    });
    expect(isWorkingDay(new Date(2007, 0, 9), config)).toBe(false);
  });

  test("extraHolidays makes working day non-working", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2024-01-15"],
    });
    // Monday 2024-01-15
    expect(isWorkingDay(new Date(2024, 0, 15), config)).toBe(false);
  });

  test("extraWorkingDays overrides everything", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2024-01-01"],
      extraWorkingDays: ["2024-01-01"],
      enableJPHoliday: true,
    });
    // New Year's Day 2024-01-01, but in extraWorkingDays
    expect(isWorkingDay(new Date(2024, 0, 1), config)).toBe(true);
  });

  test("extraWorkingDays works on Sunday", () => {
    const config = normalizeCalendarConfig({
      extraWorkingDays: ["2024-01-14"],
    });
    // Sunday 2024-01-14
    expect(isWorkingDay(new Date(2024, 0, 14), config)).toBe(true);
  });
});

describe("countWorkingDays", () => {
  test("count working days in a week", () => {
    const config = normalizeCalendarConfig({});
    // Monday to Sunday (2024-01-15 to 2024-01-21)
    const count = countWorkingDays(
      new Date(2024, 0, 15),
      new Date(2024, 0, 21),
      config
    );
    // Mon-Fri = 5 days (Sat-Sun are non-working)
    expect(count).toBe(5);
  });

  test("count working days with Saturday working", () => {
    const config = normalizeCalendarConfig({ workOnSaturday: true });
    // Monday to Sunday (2024-01-15 to 2024-01-21)
    const count = countWorkingDays(
      new Date(2024, 0, 15),
      new Date(2024, 0, 21),
      config
    );
    // Mon-Sat = 6 days (only Sun is non-working)
    expect(count).toBe(6);
  });

  test("count working days with holiday", () => {
    const config = normalizeCalendarConfig({ enableJPHoliday: true });
    // Week including New Year (2024-01-01 to 2024-01-07)
    const count = countWorkingDays(
      new Date(2024, 0, 1),
      new Date(2024, 0, 7),
      config
    );
    // Mon(holiday), Tue, Wed, Thu, Fri, Sat(non-working), Sun(non-working)
    // = 4 days (Tue-Fri)
    expect(count).toBe(4);
  });

  test("count working days with extraHolidays", () => {
    const config = normalizeCalendarConfig({
      extraHolidays: ["2024-01-15", "2024-01-16"],
    });
    // Monday to Friday (2024-01-15 to 2024-01-19)
    const count = countWorkingDays(
      new Date(2024, 0, 15),
      new Date(2024, 0, 19),
      config
    );
    // Mon(extra), Tue(extra), Wed, Thu, Fri = 3 days
    expect(count).toBe(3);
  });
});

describe("formatJapaneseDate", () => {
  test("format date in Japanese", () => {
    // Monday 2024-01-15
    const formatted = formatJapaneseDate(new Date(2024, 0, 15));
    // Should be in format MM/dd(曜)
    expect(formatted).toMatch(/01\/15\([月火水木金土日]\)/);
  });

  test("format different dates", () => {
    // Test various dates
    expect(formatJapaneseDate(new Date(2024, 11, 31))).toMatch(/12\/31/);
    expect(formatJapaneseDate(new Date(2024, 0, 1))).toMatch(/01\/01/);
  });
});
