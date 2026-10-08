import { describe, it, expect } from "vitest";
import { formatDateHeading, formatTime, toDateKey, formatLongDate } from "../src/assets/js/lib/format-date.js";

const TZ = "America/Chicago";

describe("format-date", () => {
  it("Given_AnInstant_When_FormattedAsHeading_Then_ShowsWeekdayMonthDayYear", () => {
    const d = new Date("2026-10-04T15:30:00Z"); // 10:30 AM Central (CDT)
    expect(formatDateHeading(d, TZ)).toBe("Sunday, October 4, 2026");
  });

  it("Given_AnInstant_When_FormattedAsLongDate_Then_ShowsMonthDayYear", () => {
    const d = new Date("2026-10-04T15:30:00Z");
    expect(formatLongDate(d, TZ)).toBe("October 4, 2026");
  });

  it("Given_AMorningInstant_When_FormattedAsTime_Then_ShowsTwelveHourClock", () => {
    const d = new Date("2026-10-04T15:30:00Z");
    expect(formatTime(d, TZ)).toBe("10:30 AM");
  });

  it("Given_AnEveningInstantNearMidnightUtc_When_KeyedByDate_Then_UsesCentralDate", () => {
    const d = new Date("2026-10-05T02:00:00Z"); // 9:00 PM Oct 4 Central
    expect(toDateKey(d, TZ)).toBe("2026-10-04");
  });
});
