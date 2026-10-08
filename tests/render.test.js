// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { renderEventGroups, renderAnnouncements, renderMessage } from "../src/assets/js/lib/render.js";

let container;
beforeEach(() => {
  document.body.innerHTML = '<div id="out"></div>';
  container = document.getElementById("out");
});

function event(overrides = {}) {
  return { id: "1", title: "Sunday Worship", timeLabel: "All day", location: "", description: "", link: "", ...overrides };
}

describe("renderEventGroups", () => {
  it("Given_EmptyGroups_When_Rendered_Then_ShowsEmptyState", () => {
    renderEventGroups(container, []);
    expect(container.textContent).toContain("No upcoming events");
  });

  it("Given_OneGroup_When_Rendered_Then_DateHeadingAndEventDetails", () => {
    renderEventGroups(container, [
      {
        dateKey: "2026-10-04",
        dateLabel: "Sunday, October 4, 2026",
        events: [event({ timeLabel: "10:30 AM – 12:00 PM", location: "Sanctuary", description: "Weekly", link: "https://example.com/e" })],
      },
    ]);
    expect(container.querySelector("h3").textContent).toBe("Sunday, October 4, 2026");
    expect(container.textContent).toContain("Sunday Worship");
    expect(container.textContent).toContain("10:30 AM – 12:00 PM");
    expect(container.textContent).toContain("Sanctuary");
    expect(container.textContent).toContain("Weekly");
    expect(container.querySelector("a").getAttribute("href")).toBe("https://example.com/e");
  });

  it("Given_TitleWithHtml_When_Rendered_Then_EscapedNotExecuted", () => {
    renderEventGroups(container, [
      { dateKey: "2026-10-04", dateLabel: "Sunday", events: [event({ title: "<img src=x onerror=alert(1)>" })] },
    ]);
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("Given_EventWithoutLink_When_Rendered_Then_TitleIsPlainText", () => {
    renderEventGroups(container, [{ dateKey: "2026-10-04", dateLabel: "Sunday", events: [event({ title: "Plain" })] }]);
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("Plain");
  });

  it("Given_LimitOption_When_Rendered_Then_OnlyThatManyEventsShown", () => {
    const events = [1, 2, 3, 4].map((n) => event({ id: String(n), title: `E${n}` }));
    renderEventGroups(container, [{ dateKey: "2026-10-04", dateLabel: "Sunday", events }], { limit: 3 });
    expect(container.querySelectorAll(".event").length).toBe(3);
  });

  it("Given_LimitAcrossGroups_When_Rendered_Then_LaterGroupsTrimmedOrDropped", () => {
    const groups = [
      { dateKey: "2026-10-04", dateLabel: "Sunday", events: [event({ id: "1" }), event({ id: "2" })] },
      { dateKey: "2026-10-05", dateLabel: "Monday", events: [event({ id: "3" }), event({ id: "4" })] },
      { dateKey: "2026-10-06", dateLabel: "Tuesday", events: [event({ id: "5" })] },
    ];
    renderEventGroups(container, groups, { limit: 3 });
    expect(container.querySelectorAll(".event").length).toBe(3);
    expect(container.querySelectorAll("h3").length).toBe(2);
  });
});

describe("renderAnnouncements", () => {
  it("Given_EmptyList_When_Rendered_Then_ShowsEmptyState", () => {
    renderAnnouncements(container, []);
    expect(container.textContent).toContain("No announcements");
  });

  it("Given_PinnedItem_When_Rendered_Then_HasPinnedClassAndDate", () => {
    renderAnnouncements(container, [{ title: "Pinned", body: "Body", dateLabel: "October 1, 2026", pinned: true }]);
    const item = container.querySelector(".announcement");
    expect(item.classList.contains("announcement--pinned")).toBe(true);
    expect(item.textContent).toContain("Pinned");
    expect(item.textContent).toContain("October 1, 2026");
  });

  it("Given_BodyWithLineBreaks_When_Rendered_Then_OneParagraphPerLine", () => {
    renderAnnouncements(container, [{ title: "T", body: "first\nsecond", dateLabel: "", pinned: false }]);
    expect(container.querySelectorAll(".announcement p").length).toBe(2);
  });

  it("Given_BodyWithHtml_When_Rendered_Then_Escaped", () => {
    renderAnnouncements(container, [{ title: "T", body: "<script>alert(1)</script>", dateLabel: "", pinned: false }]);
    expect(container.querySelector("script")).toBeNull();
  });

  it("Given_LimitOption_When_Rendered_Then_OnlyThatManyShown", () => {
    const items = [1, 2, 3, 4].map((n) => ({ title: `A${n}`, body: "", dateLabel: "", pinned: false }));
    renderAnnouncements(container, items, { limit: 3 });
    expect(container.querySelectorAll(".announcement").length).toBe(3);
  });
});

describe("renderMessage", () => {
  it("Given_ErrorKind_When_Rendered_Then_HasErrorClassAndText", () => {
    renderMessage(container, "Could not load events.", "error");
    const el = container.querySelector(".data-message");
    expect(el.classList.contains("data-message--error")).toBe(true);
    expect(el.textContent).toBe("Could not load events.");
  });
});
