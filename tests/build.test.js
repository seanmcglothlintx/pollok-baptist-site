import { describe, it, expect, beforeAll } from "vitest";
import Eleventy from "@11ty/eleventy";

const EXPECTED_PAGES = ["/", "/about/", "/events/", "/announcements/", "/contact/", "/give/", "/404.html"];
const NAV_LABELS = ["Home", "About", "Events", "Announcements", "Contact", "Give"];
const PLACEHOLDERS = ["$address$", "$phone$", "$email$", "Click to edit", "twitterforreplacement", "Link caption"];

let pages;
beforeAll(async () => {
  const elev = new Eleventy("src", "_site", { configPath: ".eleventy.js", quietMode: true });
  const results = await elev.toJSON();
  pages = new Map(results.map((r) => [r.url, r.content]));
}, 60000);

describe("site build", () => {
  it("Given_TheSource_When_Built_Then_EveryExpectedPageExists", () => {
    for (const url of EXPECTED_PAGES) {
      expect(pages.has(url), `missing ${url}`).toBe(true);
    }
  });

  it("Given_EveryPage_When_Built_Then_NavHasAllLabels", () => {
    for (const url of EXPECTED_PAGES) {
      for (const label of NAV_LABELS) {
        expect(pages.get(url), `${url} lacks nav "${label}"`).toContain(`>${label}<`);
      }
    }
  });

  it("Given_EveryPage_When_Built_Then_NoBuilderPlaceholderText", () => {
    for (const url of EXPECTED_PAGES) {
      for (const p of PLACEHOLDERS) {
        expect(pages.get(url), `${url} contains "${p}"`).not.toContain(p);
      }
    }
  });

  it("Given_GivePage_When_Built_Then_LinksToEasyTithe", () => {
    expect(pages.get("/give/")).toContain("https://app.easytithe.com/App/Giving/pollokbaptistchurch");
  });

  it("Given_EventsAndAnnouncementsPages_When_Built_Then_HaveMountPointsAndModuleScripts", () => {
    expect(pages.get("/events/")).toContain('id="events-list"');
    expect(pages.get("/events/")).toContain('type="module"');
    expect(pages.get("/announcements/")).toContain('id="announcements-list"');
    expect(pages.get("/announcements/")).toContain('type="module"');
  });

  it("Given_HomePage_When_Built_Then_HasNoticeBarUnderHeroAndEventsOnlyComingUp", () => {
    const html = pages.get("/");
    expect(html).toContain('id="notice-bar"');
    expect(html.indexOf('id="notice-bar"')).toBeLessThan(html.indexOf("Coming Up"));
    expect(html.indexOf('id="notice-bar"')).toBeGreaterThan(html.indexOf('class="hero'));
    expect(html).toMatch(/id="home-events"[^>]*data-limit="4"/);
    expect(html).not.toContain('id="home-announcements"');
    expect(html).not.toContain("Latest announcements");
  });

  it("Given_HomeAndContactPages_When_Built_Then_ShowTheSingleSundayServiceTime", () => {
    for (const url of ["/", "/contact/"]) {
      const html = pages.get(url);
      expect(html, url).toContain("10:45 AM");
      expect(html, url).not.toContain("Time to be confirmed");
      expect(html.toLowerCase(), url).not.toContain("evening worship");
    }
  });

  it("Given_HomePage_When_Built_Then_HeroCarriesServiceTimeAndVisitCall", () => {
    const html = pages.get("/");
    const hero = html.slice(html.indexOf('class="hero'), html.indexOf("</section>"));
    expect(hero).toContain("10:45 AM");
    expect(hero).toContain("Plan your visit");
    expect(hero).toContain('href="/contact/"');
  });

  it("Given_HomePage_When_Built_Then_GeneratedMarketingSectionsAreGone", () => {
    const html = pages.get("/");
    expect(html).not.toContain("Join Us This Sunday");
    expect(html).not.toContain(">Services<");
    expect(html).not.toContain(">Our Mission<");
    expect(html).not.toContain(">Grateful Giving<");
    expect(html).not.toContain("mission.jpg");
    expect(html).not.toContain("giving.jpg");
    expect(html).toContain("Coming Up");
  });

  it("Given_EveryPage_When_Built_Then_GiveNavLinkIsStyledAsButton", () => {
    for (const url of EXPECTED_PAGES) {
      expect(pages.get(url), url).toMatch(/<a href="\/give\/"[^>]*class="nav-cta"/);
    }
  });

  it("Given_AnnouncementsPage_When_Built_Then_PlainHeroWithIntroLine", () => {
    const html = pages.get("/announcements/");
    expect(html).toContain("hero--plain");
    expect(html).toContain("church office");
  });

  it("Given_GivePage_When_Built_Then_WaysToGiveUsesCenteredNarrowLayout", () => {
    expect(pages.get("/give/")).toContain("two-col--centered");
  });

  it("Given_EveryPage_When_Built_Then_HasTitleAndMetaDescription", () => {
    for (const url of EXPECTED_PAGES) {
      const html = pages.get(url);
      expect(html, url).toMatch(/<title>[^<]+<\/title>/);
      expect(html, url).toMatch(/<meta name="description" content="[^"]+"/);
    }
  });
});
