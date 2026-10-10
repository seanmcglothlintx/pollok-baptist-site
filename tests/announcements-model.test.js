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

describe("toAnnouncements Order column", () => {
  function titles(rows) {
    return toAnnouncements(rows, { now: NOW, timeZone: TZ }).map((a) => a.title);
  }

  it("Given_OrderOnUnpinnedRows_When_Mapped_Then_SortedByOrderNotDate", () => {
    const rows = [
      row({ Title: "Newest but third", Date: "2026-09-30", Order: "3" }),
      row({ Title: "Oldest but first", Date: "2026-08-01", Order: "1" }),
      row({ Title: "Second", Date: "2026-09-15", Order: "2" }),
    ];
    expect(titles(rows)).toEqual(["Oldest but first", "Second", "Newest but third"]);
  });

  it("Given_UnpinnedRowWithLowerOrder_When_Mapped_Then_PinnedStillFirst", () => {
    const rows = [
      row({ Title: "Unpinned order 1", Order: "1" }),
      row({ Title: "Pinned order 9", Pinned: "yes", Order: "9" }),
    ];
    expect(titles(rows)).toEqual(["Pinned order 9", "Unpinned order 1"]);
  });

  it("Given_SeveralPinnedRows_When_Mapped_Then_OrderDecidesAmongPinned", () => {
    const rows = [
      row({ Title: "Pinned B", Pinned: "yes", Order: "2", Date: "2026-09-30" }),
      row({ Title: "Unpinned", Order: "1" }),
      row({ Title: "Pinned A", Pinned: "yes", Order: "1", Date: "2026-08-01" }),
    ];
    expect(titles(rows)).toEqual(["Pinned A", "Pinned B", "Unpinned"]);
  });

  it("Given_BlankOrder_When_Mapped_Then_AfterNumberedRowsNewestFirst", () => {
    const rows = [
      row({ Title: "Blank older", Date: "2026-09-01", Order: "" }),
      row({ Title: "Numbered", Date: "2026-08-01", Order: "5" }),
      row({ Title: "Blank newer", Date: "2026-09-20" }),
    ];
    expect(titles(rows)).toEqual(["Numbered", "Blank newer", "Blank older"]);
  });

  it("Given_NonNumericOrder_When_Mapped_Then_TreatedAsBlank", () => {
    const rows = [
      row({ Title: "Text order", Date: "2026-09-30", Order: "first" }),
      row({ Title: "Numbered", Date: "2026-08-01", Order: " 2 " }),
    ];
    expect(titles(rows)).toEqual(["Numbered", "Text order"]);
  });

  it("Given_SameOrder_When_Mapped_Then_NewestDateFirst", () => {
    const rows = [
      row({ Title: "Older", Date: "2026-09-01", Order: "1" }),
      row({ Title: "Newer", Date: "2026-09-20", Order: "1" }),
    ];
    expect(titles(rows)).toEqual(["Newer", "Older"]);
  });

  it("Given_TheChurchSheetAsOfOctober9_When_Mapped_Then_FollowsItsOrderColumn", () => {
    const rows = [
      row({ Title: "Fall Revival November 20-22", Date: "9/28/2026", ExpiresOn: "11/23/2026", Pinned: "yes", Order: "1" }),
      row({ Title: "Church Picnic October 10", Date: "9/25/2026", ExpiresOn: "10/11/2026", Order: "2" }),
      row({ Title: "Wednesday Bible Study resumes", Date: "9/20/2026", Order: "3" }),
      row({ Title: "Online giving is available", Date: "9/1/2026", Order: "4" }),
      row({ Title: "This one is expired and should not show", Date: "8/1/2026", ExpiresOn: "9/1/2026", Order: "5" }),
      row({ Title: "New Website", Date: "10/8/2026", ExpiresOn: "10/11/2026", Order: "6" }),
    ];
    expect(titles(rows)).toEqual([
      "Fall Revival November 20-22",
      "Church Picnic October 10",
      "Wednesday Bible Study resumes",
      "Online giving is available",
      "New Website",
    ]);
  });
});
