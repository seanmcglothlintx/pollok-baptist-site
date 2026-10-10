import { describe, it, expect, beforeAll } from "vitest";
import Eleventy from "@11ty/eleventy";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const EXPECTED_PAGES = ["/", "/about/", "/events/", "/announcements/", "/contact/", "/give/", "/404.html"];
const NAV_LABELS = ["Home", "About", "Events", "Announcements", "Contact", "Give"];
const PLACEHOLDERS = ["$address$", "$phone$", "$email$", "Click to edit", "twitterforreplacement", "Link caption"];

function siteConfigOf(html) {
  const match = html.match(/<script type="application\/json" id="site-config">([\s\S]*?)<\/script>/);
  return JSON.parse(match[1]);
}

// Every root-relative URL in an href/src/content attribute or a CSS url(...),
// skipping protocol-relative "//host" URLs.
function rootRelativeUrls(html) {
  const found = [];
  const patterns = [/\s(?:href|src|content)="(\/(?!\/)[^"]*)"/g, /url\(['"]?(\/(?!\/)[^'")]*)/g];
  for (const pattern of patterns) {
    for (const m of html.matchAll(pattern)) {
      found.push(m[1]);
    }
  }
  return found;
}

describe("site build under a GitHub Pages subfolder", () => {
  const PREFIX = "/pollok-baptist-site/";
  let prefixed;
  // Uses the CLI flag, exactly as the GitHub Pages workflow does; the programmatic
  // constructor ignores a pathPrefix option.
  beforeAll(() => {
    const cli = fileURLToPath(new URL("../node_modules/@11ty/eleventy/cmd.cjs", import.meta.url));
    const json = execFileSync(process.execPath, [cli, `--pathprefix=${PREFIX}`, "--to=json", "--quiet"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    prefixed = new Map(JSON.parse(json).map((r) => [r.url, r.content]));
  }, 60000);

  it("Given_PathPrefix_When_Built_Then_EveryRootRelativeUrlCarriesThePrefix", () => {
    for (const url of EXPECTED_PAGES) {
      const urls = rootRelativeUrls(prefixed.get(url));
      expect(urls.length, `${url} has no root-relative urls to check`).toBeGreaterThan(0);
      for (const u of urls) {
        expect(u.startsWith(PREFIX), `${url} has unprefixed ${u}`).toBe(true);
      }
    }
  });

  it("Given_PathPrefix_When_Built_Then_SiteConfigCarriesBasePathForScripts", () => {
    expect(siteConfigOf(prefixed.get("/")).basePath).toBe(PREFIX);
  });
});

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

  it("Given_GivePage_When_Built_Then_GiveOnlineButtonSitsAboveTheTable", () => {
    const html = pages.get("/give/");
    const main = html.slice(html.indexOf('id="main"'), html.indexOf('id="footer"'));
    const button = main.indexOf('href="https://app.easytithe.com/App/Giving/pollokbaptistchurch"');
    expect(button).toBeGreaterThan(-1);
    expect(main).toMatch(/href="https:\/\/app\.easytithe\.com\/App\/Giving\/pollokbaptistchurch"[^>]*>Give online</);
    expect(button).toBeLessThan(main.indexOf("<table"));
  });

  it("Given_GivePage_When_Built_Then_IsTheGivingPlatformComparisonTable", () => {
    const html = pages.get("/give/");
    const main = html.slice(html.indexOf('id="main"'), html.indexOf('id="footer"'));
    expect(main.match(/<table/g)?.length).toBe(1);
    const head = main.slice(main.indexOf("<thead"), main.indexOf("</thead>"));
    for (const platform of ["EasyTithe (current)", "Zeffy", "Tithe.ly", "Givelify"]) {
      expect(head, platform).toContain(platform);
    }
    for (const row of ["Monthly fee", "Card fee", "ACH fee", "Who pays", "Text giving", "Donor mobile app", "Rough yearly cost", "Admin rating", "Donor rating", "Common complaints"]) {
      expect(main, row).toContain(`<th scope="row">${row}</th>`);
    }
    expect(main).not.toContain("Ways to give");
  });

  it("Given_EventsAndAnnouncementsPages_When_Built_Then_HaveMountPointsAndModuleScripts", () => {
    expect(pages.get("/events/")).toContain('id="events-list"');
    expect(pages.get("/events/")).toContain('type="module"');
    expect(pages.get("/announcements/")).toContain('id="announcements-list"');
    expect(pages.get("/announcements/")).toContain('type="module"');
  });

  it("Given_HomePage_When_Built_Then_OnlyRotatorIsTheComingUpEvents", () => {
    const html = pages.get("/");
    expect(html).not.toContain('id="notice-bar"');
    expect(html).not.toContain('class="notice"');
    expect(html.indexOf('id="home-events"')).toBeGreaterThan(html.indexOf("Coming Up"));
    expect(html).toMatch(/id="home-events"[^>]*data-limit="4"/);
    expect(html).toMatch(/id="home-events"[^>]*class="[^"]*notice-bar[^"]*event-rotator/);
    expect(html).not.toContain("upcoming-events");
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

  it("Given_HomePage_When_Built_Then_IntroCarriesNameServiceTimeAndVisitCall", () => {
    const html = pages.get("/");
    const intro = html.slice(html.indexOf('id="intro"'), html.indexOf('id="header"'));
    expect(intro).toContain("Pollok Baptist");
    expect(intro).toContain("10:45 AM");
    expect(intro).toContain("Plan your visit");
    expect(intro).toContain('href="/contact/"');
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

  it("Given_AnnouncementsPage_When_Built_Then_TextOnlyHeaderWithIntroLine", () => {
    const html = pages.get("/announcements/");
    expect(html).not.toContain('class="image main"');
    expect(html).toContain("church office");
  });


  it("Given_EveryPage_When_Built_Then_UsesTheMassivelyLayout", () => {
    for (const url of EXPECTED_PAGES) {
      const html = pages.get(url);
      for (const id of ["wrapper", "header", "nav", "main", "footer", "copyright"]) {
        expect(html, `${url} lacks #${id}`).toContain(`id="${id}"`);
      }
      expect(html, url).toContain('href="/assets/css/main.css"');
      expect(html.indexOf('href="/assets/css/main.css"'), url).toBeLessThan(html.indexOf('href="/assets/css/site.css"'));
      expect(html, url).toContain('src="/assets/js/massively/main.js"');
    }
  });

  it("Given_EveryPage_When_Built_Then_NavIconsStartWithFacebookBeforePhone", () => {
    for (const url of EXPECTED_PAGES) {
      const html = pages.get(url);
      const icons = html.slice(html.indexOf('<ul class="icons">'), html.indexOf("</nav>"));
      const facebook = icons.indexOf('href="https://www.facebook.com/pollokchurch"');
      expect(facebook, `${url} lacks the Facebook icon`).toBeGreaterThan(-1);
      expect(facebook, url).toBeLessThan(icons.indexOf('href="tel:'));
      expect(icons, url).toMatch(/href="https:\/\/www\.facebook\.com\/pollokchurch"[^>]*class="icon brands fa-facebook-f"/);
      expect(icons, url).toContain('<span class="label">Facebook</span>');
    }
  });

  it("Given_EveryPage_When_Built_Then_FooterCreditsHtml5UpAsTheLicenceRequires", () => {
    for (const url of EXPECTED_PAGES) {
      const html = pages.get(url);
      const copyright = html.slice(html.indexOf('id="copyright"'));
      expect(copyright, url).toContain('Design: <a href="https://html5up.net">HTML5 UP</a>');
    }
  });

  it("Given_EveryPage_When_Built_Then_FooterHasServiceTimeAndChurchContacts", () => {
    for (const url of EXPECTED_PAGES) {
      const html = pages.get(url);
      const footer = html.slice(html.indexOf('id="footer"'), html.indexOf('id="copyright"'));
      expect(footer, url).toContain("10:45 AM");
      expect(footer, url).toContain("(936) 287-1033");
      expect(footer, url).toContain("emily@pollokbaptist.org");
      expect(footer, url).toContain("PO Box 85");
    }
  });

  it("Given_HomePage_When_Built_Then_OnlyItHasTheIntro", () => {
    for (const url of EXPECTED_PAGES) {
      expect(pages.get(url).includes('id="intro"'), url).toBe(url === "/");
    }
  });

  it("Given_InnerPages_When_Built_Then_EachOpensWithAPostHeaderH1", () => {
    for (const url of EXPECTED_PAGES.filter((u) => u !== "/")) {
      expect(pages.get(url), url).toMatch(/<header class="major">\s*<h1>[^<]+<\/h1>/);
    }
  });

  it("Given_EveryPage_When_Built_Then_NoFontsCopiedFromTheOldSite", () => {
    for (const url of EXPECTED_PAGES) {
      expect(pages.get(url), url).not.toContain("play-regular.css");
      expect(pages.get(url), url).not.toContain("open-sans.css");
    }
  });

  it("Given_EveryPage_When_Built_Then_NoImagesCarriedOverFromTheOldSiteBuilder", () => {
    // AI images generated by the old site builder, plus a stock photo of unknown licence.
    const OLD = ["worship.jpg", "banner-gathering.jpg", "hero-contact.jpg"];
    for (const url of EXPECTED_PAGES) {
      for (const name of OLD) {
        expect(pages.get(url), `${url} still uses ${name}`).not.toContain(name);
      }
    }
  });

  it("Given_DefaultBuild_When_Built_Then_SiteConfigBasePathIsRoot", () => {
    expect(siteConfigOf(pages.get("/")).basePath).toBe("/");
  });

  it("Given_EveryPage_When_Built_Then_HasTitleAndMetaDescription", () => {
    for (const url of EXPECTED_PAGES) {
      const html = pages.get(url);
      expect(html, url).toMatch(/<title>[^<]+<\/title>/);
      expect(html, url).toMatch(/<meta name="description" content="[^"]+"/);
    }
  });
});
