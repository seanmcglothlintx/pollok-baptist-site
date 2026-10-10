// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRotator } from "../src/assets/js/lib/rotator.js";

let container;
let rotator;

function items(n) {
  return Array.from({ length: n }, (_, i) => ({
    title: `Notice ${i + 1}`,
    body: `First line ${i + 1}\nSecond line ${i + 1}`,
    dateLabel: "October 1, 2026",
    pinned: i === 0,
  }));
}

function shownTitle() {
  return container.querySelector(".notice-bar__title").textContent;
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="bar" hidden></div>';
  container = document.getElementById("bar");
});

afterEach(() => {
  if (rotator) {
    rotator.destroy();
    rotator = null;
  }
  vi.useRealTimers();
});

describe("createRotator", () => {
  it("Given_NoItems_When_Created_Then_ContainerStaysHidden", () => {
    rotator = createRotator(container, [], { intervalMs: 1000 });
    expect(container.hidden).toBe(true);
    expect(container.children.length).toBe(0);
  });

  it("Given_SevenItems_When_CreatedWithLimitFive_Then_ShowsFirstAndFiveDots", () => {
    rotator = createRotator(container, items(7), { intervalMs: 1000, limit: 5 });
    expect(container.hidden).toBe(false);
    expect(shownTitle()).toBe("Notice 1");
    expect(container.querySelectorAll(".notice-bar__dot").length).toBe(5);
    expect(container.querySelector(".notice-bar__dot[aria-current='true']").textContent).toContain("1");
  });

  it("Given_Body_When_Rendered_Then_OnlyFirstLineShownAndLinkToAnnouncements", () => {
    rotator = createRotator(container, items(2), { intervalMs: 1000, moreHref: "/announcements/" });
    const body = container.querySelector(".notice-bar__body").textContent;
    expect(body).toBe("First line 1");
    expect(container.querySelector(".notice-bar__more").getAttribute("href")).toBe("/announcements/");
  });

  it("Given_TitleWithHtml_When_Rendered_Then_Escaped", () => {
    rotator = createRotator(container, [{ title: "<b>x</b>", body: "", dateLabel: "", pinned: false }], { intervalMs: 1000 });
    expect(container.querySelector("b")).toBeNull();
    expect(shownTitle()).toBe("<b>x</b>");
  });

  it("Given_NextClicked_When_AtLastItem_Then_WrapsToFirst", () => {
    rotator = createRotator(container, items(2), { intervalMs: 1000 });
    container.querySelector(".notice-bar__next").click();
    expect(shownTitle()).toBe("Notice 2");
    container.querySelector(".notice-bar__next").click();
    expect(shownTitle()).toBe("Notice 1");
  });

  it("Given_PrevClicked_When_AtFirstItem_Then_WrapsToLast", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    container.querySelector(".notice-bar__prev").click();
    expect(shownTitle()).toBe("Notice 3");
  });

  it("Given_DotClicked_When_ThirdDot_Then_ShowsThirdItem", () => {
    rotator = createRotator(container, items(4), { intervalMs: 1000 });
    container.querySelectorAll(".notice-bar__dot")[2].click();
    expect(shownTitle()).toBe("Notice 3");
    expect(container.querySelectorAll(".notice-bar__dot")[2].getAttribute("aria-current")).toBe("true");
  });

  it("Given_IntervalElapses_When_Idle_Then_AdvancesAutomatically", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    vi.advanceTimersByTime(1000);
    expect(shownTitle()).toBe("Notice 2");
    vi.advanceTimersByTime(2000);
    expect(shownTitle()).toBe("Notice 1");
  });

  it("Given_MouseOver_When_IntervalElapses_Then_DoesNotAdvance_ThenResumesOnLeave", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    container.dispatchEvent(new Event("mouseenter"));
    vi.advanceTimersByTime(3000);
    expect(shownTitle()).toBe("Notice 1");
    container.dispatchEvent(new Event("mouseleave"));
    vi.advanceTimersByTime(1000);
    expect(shownTitle()).toBe("Notice 2");
  });

  it("Given_KeyboardFocusInside_When_IntervalElapses_Then_DoesNotAdvance", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    container.dispatchEvent(new Event("focusin"));
    vi.advanceTimersByTime(3000);
    expect(shownTitle()).toBe("Notice 1");
  });

  it("Given_ManualNavigation_When_IntervalElapsesAfter_Then_TimerRestartedFromThatPoint", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    vi.advanceTimersByTime(900);
    container.querySelector(".notice-bar__next").click();
    expect(shownTitle()).toBe("Notice 2");
    vi.advanceTimersByTime(500);
    expect(shownTitle()).toBe("Notice 2");
    vi.advanceTimersByTime(500);
    expect(shownTitle()).toBe("Notice 3");
  });

  it("Given_ReducedMotion_When_IntervalElapses_Then_NeverAutoAdvances", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000, reducedMotion: true });
    vi.advanceTimersByTime(5000);
    expect(shownTitle()).toBe("Notice 1");
    container.querySelector(".notice-bar__next").click();
    expect(shownTitle()).toBe("Notice 2");
  });

  it("Given_OneItem_When_Created_Then_NoControlsAndNoTimer", () => {
    rotator = createRotator(container, items(1), { intervalMs: 1000 });
    expect(container.querySelector(".notice-bar__next")).toBeNull();
    expect(container.querySelectorAll(".notice-bar__dot").length).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(shownTitle()).toBe("Notice 1");
  });

  it("Given_Destroyed_When_IntervalElapses_Then_NothingChanges", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    rotator.destroy();
    vi.advanceTimersByTime(3000);
    expect(shownTitle()).toBe("Notice 1");
    rotator = null;
  });

  it("Given_TabHidden_When_IntervalElapses_Then_DoesNotAdvance_ThenResumesWhenVisible", () => {
    rotator = createRotator(container, items(3), { intervalMs: 1000 });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(2000);
    expect(shownTitle()).toBe("Notice 1");
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
    document.dispatchEvent(new Event("visibilitychange"));
    vi.advanceTimersByTime(1000);
    expect(shownTitle()).toBe("Notice 2");
  });

  it("Given_LiveRegion_When_Rendered_Then_AnnouncesPolitely", () => {
    rotator = createRotator(container, items(2), { intervalMs: 1000 });
    expect(container.querySelector("[aria-live='polite']")).not.toBeNull();
    expect(container.getAttribute("aria-roledescription")).toBe("carousel");
  });
});

describe("createRotator for events", () => {
  function events(n) {
    return Array.from({ length: n }, (_, i) => ({
      title: `Event ${i + 1}`,
      location: `Room ${i + 1}`,
      dateLabel: `Sunday, October ${i + 4}, 2026`,
      timeLabel: "10:45 AM – 12:00 PM",
      description: "Long description\nthat should not appear",
    }));
  }

  const eventOptions = {
    intervalMs: 1000,
    label: "Upcoming events",
    itemName: "event",
    moreHref: "/events/",
    moreLabel: "All events",
    describe: (e) => ({ meta: `${e.dateLabel} · ${e.timeLabel}`, title: e.title, body: e.location }),
  };

  it("Given_DescribeOption_When_Rendered_Then_ShowsDateTimeTitleAndLocation", () => {
    rotator = createRotator(container, events(3), eventOptions);
    expect(container.querySelector(".notice-bar__meta").textContent).toBe("Sunday, October 4, 2026 · 10:45 AM – 12:00 PM");
    expect(shownTitle()).toBe("Event 1");
    expect(container.querySelector(".notice-bar__body").textContent).toBe("Room 1");
    expect(container.textContent).not.toContain("Long description");
  });

  it("Given_EventLabels_When_Rendered_Then_ControlsAndRegionNameEvents", () => {
    rotator = createRotator(container, events(3), eventOptions);
    expect(container.getAttribute("aria-label")).toBe("Upcoming events");
    expect(container.querySelector(".notice-bar__prev").getAttribute("aria-label")).toBe("Previous event");
    expect(container.querySelector(".notice-bar__next").getAttribute("aria-label")).toBe("Next event");
    expect(container.querySelector(".notice-bar__dot").getAttribute("aria-label")).toBe("Event 1 of 3");
    const more = container.querySelector(".notice-bar__more");
    expect(more.textContent).toBe("All events");
    expect(more.getAttribute("href")).toBe("/events/");
  });

  it("Given_EventRotator_When_IntervalElapses_Then_AdvancesAndUpdatesMeta", () => {
    rotator = createRotator(container, events(3), eventOptions);
    vi.advanceTimersByTime(1000);
    expect(shownTitle()).toBe("Event 2");
    expect(container.querySelector(".notice-bar__meta").textContent).toContain("October 5");
  });

  it("Given_NoMeta_When_Rendered_Then_MetaElementHidden", () => {
    rotator = createRotator(container, items(2), { intervalMs: 1000 });
    expect(container.querySelector(".notice-bar__meta").hidden).toBe(true);
  });

  it("Given_DefaultOptions_When_Rendered_Then_StillLabelledAsAnnouncements", () => {
    rotator = createRotator(container, items(2), { intervalMs: 1000 });
    expect(container.getAttribute("aria-label")).toBe("Announcements");
    expect(container.querySelector(".notice-bar__next").getAttribute("aria-label")).toBe("Next announcement");
    expect(container.querySelector(".notice-bar__more").textContent).toBe("Read more");
  });
});

describe("createRotator with no limit", () => {
  it("Given_LimitInfinity_When_Created_Then_EveryItemGetsADot", () => {
    rotator = createRotator(container, items(12), { intervalMs: 1000, limit: Infinity });
    expect(container.querySelectorAll(".notice-bar__dot").length).toBe(12);
    rotator.goTo(11);
    expect(shownTitle()).toBe("Notice 12");
  });
});
