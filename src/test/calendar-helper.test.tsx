import {
  normalizeCalendarConfig,
  normalizeISODate,
  toISODateString,
  isWorkingDay,
  countWorkingDays,
  formatJapaneseDate,
} from "../helpers/calendar-helper";

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
