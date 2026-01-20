import {
  formatDate,
  parseDateFromInput,
  formatEffort,
  sanitizeEffortInput,
  normalizeProcess,
  normalizeStatus,
} from "../helpers/task-helper";
import { TASK_PROCESS_OPTIONS, TASK_STATUS_OPTIONS } from "../constants/taskOptions";

describe("task-helper formatDate", () => {
  it("formats date to YYYY-MM-DD", () => {
    expect(formatDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });

  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });
});

describe("task-helper parseDateFromInput", () => {
  it("parses valid date", () => {
    const result = parseDateFromInput("2026-02-10");
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(1);
    expect(result?.getDate()).toBe(10);
  });

  it("rejects invalid calendar dates", () => {
    expect(parseDateFromInput("2026-02-30")).toBeUndefined();
  });

  it("rejects non-numeric input", () => {
    expect(parseDateFromInput("2026-0x-02")).toBeUndefined();
  });
});

describe("task-helper formatEffort", () => {
  it("formats effort in MH", () => {
    expect(formatEffort(8, "MH")).toBe("8MH");
  });

  it("formats effort in MD", () => {
    expect(formatEffort(16, "MD")).toBe("2MD");
  });

  it("returns empty string for negative or invalid", () => {
    expect(formatEffort(-1, "MH")).toBe("");
    expect(formatEffort(undefined, "MH")).toBe("");
    expect(formatEffort(Number.NaN, "MH")).toBe("");
  });
});

describe("task-helper sanitizeEffortInput", () => {
  it("returns parsed number when valid", () => {
    expect(sanitizeEffortInput("12.5")).toBe(12.5);
  });

  it("returns undefined for invalid", () => {
    expect(sanitizeEffortInput("-1")).toBeUndefined();
    expect(sanitizeEffortInput("abc")).toBeUndefined();
  });
});

describe("task-helper normalize helpers", () => {
  it("normalizes process to defined options", () => {
    expect(normalizeProcess("設計")).toBe("設計");
    expect(TASK_PROCESS_OPTIONS).toContain(normalizeProcess("unknown" as any));
  });

  it("normalizes status to defined options", () => {
    expect(normalizeStatus("完了")).toBe("完了");
    expect(TASK_STATUS_OPTIONS).toContain(normalizeStatus("unknown" as any));
  });
});
