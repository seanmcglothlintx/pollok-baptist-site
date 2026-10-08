import { describe, it, expect } from "vitest";
import { toEventViewModels, groupByDate } from "../src/assets/js/lib/calendar-model.js";

const TZ = "America/Chicago";
const NOW = new Date("2026-10-01T12:00:00Z");

function timedEvent(overrides = {}) {
  return {
    id: "evt-timed",
    summary: "Sunday Worship",
    location: "Sanctuary",
    description: "Weekly service",
    htmlLink: "https://calendar.google.com/event?eid=abc",
    start: { dateTime: "2026-10-04T10:30:00-05:00" },
    end: { dateTime: "2026-10-04T12:00:00-05:00" },
    ...overrides,
  };
}

function allDayEvent(overrides = {}) {
  return {
    id: "evt-allday",
    summary: "Church Picnic",
    start: { date: "2026-10-10" },
    end: { date: "2026-10-11" }, // Google end dates are exclusive
    ...overrides,
  };
}

describe("toEventViewModels", () => {
  it("Given_TimedEvent_When_Mapped_Then_ShowsStartAndEndTime", () => {
    const [vm] = toEventViewModels([timedEvent()], { now: NOW, timeZone: TZ });
    expect(vm.title).toBe("Sunday Worship");
    expect(vm.location).toBe("Sanctuary");
    expect(vm.description).toBe("Weekly service");
    expect(vm.isAllDay).toBe(false);
    expect(vm.timeLabel).toBe("10:30 AM – 12:00 PM");
    expect(vm.dateKey).toBe("2026-10-04");
    expect(vm.dateLabel).toBe("Sunday, October 4, 2026");
    expect(vm.link).toBe("https://calendar.google.com/event?eid=abc");
  });

  it("Given_AllDayEvent_When_Mapped_Then_ShowsAllDay", () => {
    const [vm] = toEventViewModels([allDayEvent()], { now: NOW, timeZone: TZ });
    expect(vm.isAllDay).toBe(true);
    expect(vm.timeLabel).toBe("All day");
    expect(vm.dateKey).toBe("2026-10-10");
    expect(vm.dateLabel).toBe("Saturday, October 10, 2026");
  });

  it("Given_MultiDayAllDayEvent_When_Mapped_Then_ShowsDateRange", () => {
    const evt = allDayEvent({ start: { date: "2026-11-20" }, end: { date: "2026-11-23" } });
    const [vm] = toEventViewModels([evt], { now: NOW, timeZone: TZ });
    expect(vm.timeLabel).toBe("All day, through Sunday, November 22");
    expect(vm.dateKey).toBe("2026-11-20");
  });

  it("Given_PastEvent_When_Mapped_Then_Excluded", () => {
    const past = timedEvent({
      id: "old",
      start: { dateTime: "2026-09-27T10:30:00-05:00" },
      end: { dateTime: "2026-09-27T12:00:00-05:00" },
    });
    const vms = toEventViewModels([past, timedEvent()], { now: NOW, timeZone: TZ });
    expect(vms.map((v) => v.id)).toEqual(["evt-timed"]);
  });

  it("Given_EventInProgress_When_Mapped_Then_Included", () => {
    const now = new Date("2026-10-04T16:00:00Z"); // 11:00 AM Central, mid-service
    const vms = toEventViewModels([timedEvent()], { now, timeZone: TZ });
    expect(vms).toHaveLength(1);
  });

  it("Given_EventWithoutOptionalFields_When_Mapped_Then_UsesDefaults", () => {
    const bare = { id: "x", start: { date: "2026-10-12" }, end: { date: "2026-10-13" } };
    const [vm] = toEventViewModels([bare], { now: NOW, timeZone: TZ });
    expect(vm.title).toBe("(Untitled event)");
    expect(vm.location).toBe("");
    expect(vm.description).toBe("");
    expect(vm.link).toBe("");
  });

  it("Given_UnsortedEvents_When_Mapped_Then_SortedByStart", () => {
    const later = timedEvent({
      id: "later",
      start: { dateTime: "2026-10-11T10:30:00-05:00" },
      end: { dateTime: "2026-10-11T12:00:00-05:00" },
    });
    const vms = toEventViewModels([later, timedEvent()], { now: NOW, timeZone: TZ });
    expect(vms.map((v) => v.id)).toEqual(["evt-timed", "later"]);
  });
});

describe("groupByDate", () => {
  it("Given_EventsOnThreeDays_When_Grouped_Then_ThreeDateGroupsInOrder", () => {
    const later = timedEvent({
      id: "later",
      start: { dateTime: "2026-10-11T10:30:00-05:00" },
      end: { dateTime: "2026-10-11T12:00:00-05:00" },
    });
    const vms = toEventViewModels([later, timedEvent(), allDayEvent()], { now: NOW, timeZone: TZ });
    const groups = groupByDate(vms);
    expect(groups.map((g) => g.dateKey)).toEqual(["2026-10-04", "2026-10-10", "2026-10-11"]);
    expect(groups[0].dateLabel).toBe("Sunday, October 4, 2026");
    expect(groups[0].events.map((e) => e.id)).toEqual(["evt-timed"]);
  });

  it("Given_TwoEventsSameDay_When_Grouped_Then_OneGroupWithBoth", () => {
    const evening = timedEvent({
      id: "evening",
      start: { dateTime: "2026-10-04T18:00:00-05:00" },
      end: { dateTime: "2026-10-04T19:00:00-05:00" },
    });
    const groups = groupByDate(toEventViewModels([evening, timedEvent()], { now: NOW, timeZone: TZ }));
    expect(groups).toHaveLength(1);
    expect(groups[0].events.map((e) => e.id)).toEqual(["evt-timed", "evening"]);
  });

  it("Given_NoEvents_When_Grouped_Then_EmptyArray", () => {
    expect(groupByDate([])).toEqual([]);
  });
});
