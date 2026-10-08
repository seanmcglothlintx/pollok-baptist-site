import { describe, it, expect } from "vitest";
import { toAnnouncements } from "../src/assets/js/lib/announcements-model.js";

const TZ = "America/Chicago";
const NOW = new Date("2026-10-01T12:00:00Z");

function row(overrides = {}) {
  return { Title: "Fall Festival", Date: "2026-09-28", Body: "Bring a dish.", ExpiresOn: "", Pinned: "", ...overrides };
}

describe("toAnnouncements", () => {
  it("Given_BasicRow_When_Mapped_Then_HasTitleBodyAndDateLabel", () => {
    const [a] = toAnnouncements([row()], { now: NOW, timeZone: TZ });
    expect(a.title).toBe("Fall Festival");
    expect(a.body).toBe("Bring a dish.");
    expect(a.dateLabel).toBe("September 28, 2026");
    expect(a.pinned).toBe(false);
  });

  it("Given_UsStyleDate_When_Mapped_Then_ParsesMonthDayYear", () => {
    const [a] = toAnnouncements([row({ Date: "9/28/2026" })], { now: NOW, timeZone: TZ });
    expect(a.dateLabel).toBe("September 28, 2026");
  });

  it("Given_ExpiredRow_When_Mapped_Then_Hidden", () => {
    const rows = [row({ Title: "Old", ExpiresOn: "2026-09-30" }), row({ Title: "Current" })];
    const titles = toAnnouncements(rows, { now: NOW, timeZone: TZ }).map((a) => a.title);
    expect(titles).toEqual(["Current"]);
  });

  it("Given_ExpiresToday_When_Mapped_Then_StillShownUntilEndOfDay", () => {
    const rows = [row({ ExpiresOn: "2026-10-01" })];
    expect(toAnnouncements(rows, { now: NOW, timeZone: TZ })).toHaveLength(1);
  });

  it("Given_PinnedAndUnpinned_When_Mapped_Then_PinnedFirstThenNewest", () => {
    const rows = [
      row({ Title: "Older", Date: "2026-09-01" }),
      row({ Title: "Newest", Date: "2026-09-30" }),
      row({ Title: "Pinned old", Date: "2026-08-01", Pinned: "yes" }),
    ];
    const titles = toAnnouncements(rows, { now: NOW, timeZone: TZ }).map((a) => a.title);
    expect(titles).toEqual(["Pinned old", "Newest", "Older"]);
  });

  it("Given_PinnedSpelledVariously_When_Mapped_Then_AllCountAsPinned", () => {
    for (const flag of ["yes", "Yes", "TRUE", "1", "x", "Y"]) {
      const [a] = toAnnouncements([row({ Pinned: flag })], { now: NOW, timeZone: TZ });
      expect(a.pinned, `flag "${flag}"`).toBe(true);
    }
  });

  it("Given_RowWithoutTitle_When_Mapped_Then_Skipped", () => {
    const rows = [row({ Title: "  " }), row()];
    expect(toAnnouncements(rows, { now: NOW, timeZone: TZ })).toHaveLength(1);
  });

  it("Given_RowWithoutDate_When_Mapped_Then_EmptyDateLabelAndSortsLast", () => {
    const rows = [row({ Title: "Undated", Date: "" }), row({ Title: "Dated" })];
    const result = toAnnouncements(rows, { now: NOW, timeZone: TZ });
    expect(result.map((a) => a.title)).toEqual(["Dated", "Undated"]);
    expect(result[1].dateLabel).toBe("");
  });

  it("Given_UnparseableDate_When_Mapped_Then_TreatedAsUndated", () => {
    const [a] = toAnnouncements([row({ Date: "sometime soon" })], { now: NOW, timeZone: TZ });
    expect(a.dateLabel).toBe("");
  });
});
