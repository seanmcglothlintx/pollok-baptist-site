import { describe, it, expect } from "vitest";
import { announcementsCsvUrl, calendarEventsUrl, withBase } from "../src/assets/js/lib/data-urls.js";

describe("withBase", () => {
  it("Given_RootBase_When_Applied_Then_PathUnchanged", () => {
    expect(withBase("/assets/data/a.csv", "/")).toBe("/assets/data/a.csv");
  });

  it("Given_MissingBase_When_Applied_Then_PathUnchanged", () => {
    expect(withBase("/announcements/", undefined)).toBe("/announcements/");
  });

  it("Given_SubfolderBase_When_Applied_Then_RootRelativePathIsPrefixed", () => {
    expect(withBase("/assets/data/a.csv", "/pollok-baptist-site/")).toBe("/pollok-baptist-site/assets/data/a.csv");
  });

  it("Given_SubfolderBaseWithoutTrailingSlash_When_Applied_Then_NoDoubleOrMissingSlash", () => {
    expect(withBase("/announcements/", "/pollok-baptist-site")).toBe("/pollok-baptist-site/announcements/");
  });

  it("Given_AbsoluteOrProtocolRelativeUrl_When_Applied_Then_LeftAlone", () => {
    expect(withBase("https://docs.google.com/x", "/sub/")).toBe("https://docs.google.com/x");
    expect(withBase("//cdn.example.com/x", "/sub/")).toBe("//cdn.example.com/x");
  });
});

const PUB_ID = "2PACX-1vSt7Tnx1fpXbOo5XpTVmAWiLG_Hs8YdsUa2N8KLWAVts9T6_8qXn_tOPCDzs1knOozghsniWUgLHvO1";

describe("announcementsCsvUrl", () => {
  it("Given_FixtureSource_When_Built_Then_ReturnsFixturePath", () => {
    const url = announcementsCsvUrl({ source: "fixture", fixtureUrl: "/assets/data/a.csv", publishedId: PUB_ID, gid: "1" });
    expect(url).toBe("/assets/data/a.csv");
  });

  it("Given_LiveSourceWithPublishedId_When_Built_Then_UsesPublishToWebCsvEndpoint", () => {
    const url = announcementsCsvUrl({ source: "live", publishedId: PUB_ID, gid: "960850324" });
    expect(url).toBe(`https://docs.google.com/spreadsheets/d/e/${PUB_ID}/pub?gid=960850324&single=true&output=csv`);
  });

  it("Given_LiveSourceWithoutGid_When_Built_Then_DefaultsToFirstTab", () => {
    const url = announcementsCsvUrl({ source: "live", publishedId: PUB_ID });
    expect(url).toContain("gid=0");
  });

  it("Given_LiveSourceWithoutPublishedId_When_Built_Then_Throws", () => {
    expect(() => announcementsCsvUrl({ source: "live", publishedId: "" })).toThrow(/publishedId/);
  });
});

describe("calendarEventsUrl", () => {
  const now = new Date("2026-10-01T12:00:00Z");

  it("Given_FixtureSource_When_Built_Then_ReturnsFixturePath", () => {
    const url = calendarEventsUrl({ source: "fixture", fixtureUrl: "/assets/data/c.json" }, now);
    expect(url).toBe("/assets/data/c.json");
  });

  it("Given_LiveSource_When_Built_Then_CallsCalendarApiWithKeyAndTimeMin", () => {
    const url = new URL(calendarEventsUrl({ source: "live", calendarId: "abc@group.calendar.google.com", apiKey: "KEY123" }, now));
    expect(url.origin + url.pathname).toBe("https://www.googleapis.com/calendar/v3/calendars/abc%40group.calendar.google.com/events");
    expect(url.searchParams.get("key")).toBe("KEY123");
    expect(url.searchParams.get("timeMin")).toBe("2026-10-01T12:00:00.000Z");
    expect(url.searchParams.get("singleEvents")).toBe("true");
    expect(url.searchParams.get("orderBy")).toBe("startTime");
  });

  it("Given_LiveSourceMissingKeyOrId_When_Built_Then_Throws", () => {
    expect(() => calendarEventsUrl({ source: "live", calendarId: "", apiKey: "k" }, now)).toThrow(/calendarId/);
    expect(() => calendarEventsUrl({ source: "live", calendarId: "id", apiKey: "" }, now)).toThrow(/apiKey/);
  });
});
