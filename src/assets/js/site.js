// Browser entry point. Wires the mobile nav and fills any events / announcements
// mount points found on the page. All logic that can be unit tested lives in ./lib.

import { toEventViewModels, groupByDate } from "./lib/calendar-model.js";
import { csvToObjects } from "./lib/sheet-csv.js";
import { toAnnouncements } from "./lib/announcements-model.js";
import { renderEventGroups, renderAnnouncements, renderMessage } from "./lib/render.js";
import { announcementsCsvUrl, calendarEventsUrl, withBase } from "./lib/data-urls.js";
import { createRotator } from "./lib/rotator.js";

function readConfig() {
  const node = document.getElementById("site-config");
  if (node === null) {
    return null;
  }
  try {
    return JSON.parse(node.textContent);
  } catch (err) {
    console.error("site-config is not valid JSON", err);
    return null;
  }
}

function setupNavToggle() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (toggle === null || nav === null) {
    return;
  }
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.text();
}

function limitOf(mount) {
  const value = Number(mount.dataset.limit);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return Infinity;
}

async function loadEvents(config) {
  const realNow = new Date();
  const text = await fetchText(withBase(calendarEventsUrl(config.calendar, realNow), config.basePath));
  const payload = JSON.parse(text);
  // Fixtures carry an "asOf" so the sample data never goes stale.
  let now = realNow;
  if (config.calendar.source === "fixture" && payload.asOf) {
    now = new Date(payload.asOf);
  }
  const viewModels = toEventViewModels(payload.items, { now, timeZone: config.timeZone });
  return groupByDate(viewModels);
}

async function loadAnnouncements(config) {
  const text = await fetchText(withBase(announcementsCsvUrl(config.announcements), config.basePath));
  const rows = csvToObjects(text);
  return toAnnouncements(rows, { now: new Date(), timeZone: config.timeZone });
}

async function fillEvents(config, mounts) {
  if (mounts.length === 0) {
    return;
  }
  try {
    const groups = await loadEvents(config);
    for (const mount of mounts) {
      renderEventGroups(mount, groups, { limit: limitOf(mount) });
    }
  } catch (err) {
    console.error("events failed to load", err);
    for (const mount of mounts) {
      renderMessage(mount, "We could not load the events calendar right now. Please try again later.", "error");
    }
  }
}

function prefersReducedMotion() {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function fillAnnouncements(config, mounts, noticeBar) {
  if (mounts.length === 0 && noticeBar === null) {
    return;
  }
  try {
    const items = await loadAnnouncements(config);
    for (const mount of mounts) {
      renderAnnouncements(mount, items, { limit: limitOf(mount) });
    }
    if (noticeBar !== null) {
      createRotator(noticeBar, items, {
        limit: limitOf(noticeBar),
        moreHref: withBase("/announcements/", config.basePath),
        reducedMotion: prefersReducedMotion(),
      });
    }
  } catch (err) {
    console.error("announcements failed to load", err);
    for (const mount of mounts) {
      renderMessage(mount, "We could not load announcements right now. Please try again later.", "error");
    }
    // The notice bar simply stays hidden when the feed is unavailable.
  }
}

function main() {
  setupNavToggle();
  const config = readConfig();
  if (config === null) {
    return;
  }
  const eventMounts = ["events-list", "home-events"].map((id) => document.getElementById(id)).filter(Boolean);
  const announcementMounts = ["announcements-list"].map((id) => document.getElementById(id)).filter(Boolean);
  const noticeBar = document.getElementById("notice-bar");
  fillEvents(config, eventMounts);
  fillAnnouncements(config, announcementMounts, noticeBar);
}

main();
