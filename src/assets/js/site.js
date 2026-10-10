// Browser entry point. Fills any events / announcements mount points found on the
// page. The mobile nav panel comes from Massively's main.js. All logic that can be unit tested lives in ./lib.

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

function prefersReducedMotion() {
  if (typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// "Coming Up" on the home page: one event at a time.
function startEventRotator(config, mount, groups) {
  const events = groups.flatMap((group) => group.events);
  if (events.length === 0) {
    renderMessage(mount, "No upcoming events are scheduled right now. Check back soon.", "empty");
    return;
  }
  createRotator(mount, events, {
    limit: limitOf(mount),
    label: "Upcoming events",
    itemName: "event",
    moreHref: withBase("/events/", config.basePath),
    moreLabel: "All events",
    reducedMotion: prefersReducedMotion(),
    describe: (event) => ({
      meta: `${event.dateLabel} · ${event.timeLabel}`,
      title: event.title,
      body: event.location,
    }),
  });
}

async function fillEvents(config, list, rotator) {
  if (list === null && rotator === null) {
    return;
  }
  try {
    const groups = await loadEvents(config);
    if (list !== null) {
      renderEventGroups(list, groups, { limit: limitOf(list) });
    }
    if (rotator !== null) {
      startEventRotator(config, rotator, groups);
    }
  } catch (err) {
    console.error("events failed to load", err);
    for (const mount of [list, rotator].filter(Boolean)) {
      renderMessage(mount, "We could not load the events calendar right now. Please try again later.", "error");
    }
  }
}

async function fillAnnouncements(config, mount) {
  if (mount === null) {
    return;
  }
  try {
    const items = await loadAnnouncements(config);
    renderAnnouncements(mount, items, { limit: limitOf(mount) });
  } catch (err) {
    console.error("announcements failed to load", err);
    renderMessage(mount, "We could not load announcements right now. Please try again later.", "error");
  }
}

function main() {
  const config = readConfig();
  if (config === null) {
    return;
  }
  fillEvents(config, document.getElementById("events-list"), document.getElementById("home-events"));
  fillAnnouncements(config, document.getElementById("announcements-list"));
}

main();
