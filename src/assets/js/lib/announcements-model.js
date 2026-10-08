// Turns rows from the announcements sheet into sorted, filtered view models.
// Expected columns: Title, Date, Body, ExpiresOn, Pinned.

import { formatLongDate, dateKeyToNoonUtc, zonedMidnight, addDaysToKey } from "./format-date.js";

const ISO_DATE = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
const US_DATE = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/;
const PINNED_VALUES = /^(y|yes|true|1|x)$/i;

function pad(n) {
  return String(n).padStart(2, "0");
}

// Accepts "2026-09-28", "9/28/2026" or "9/28/26"; returns "YYYY-MM-DD" or null.
export function parseSheetDate(text) {
  const value = (text || "").trim();
  let match = ISO_DATE.exec(value);
  if (match !== null) {
    return `${match[1]}-${pad(match[2])}-${pad(match[3])}`;
  }
  match = US_DATE.exec(value);
  if (match !== null) {
    let year = Number(match[3]);
    if (year < 100) {
      year += 2000;
    }
    return `${year}-${pad(match[1])}-${pad(match[2])}`;
  }
  return null;
}

function isExpired(expiresKey, now, timeZone) {
  if (expiresKey === null) {
    return false;
  }
  const hiddenFrom = zonedMidnight(addDaysToKey(expiresKey, 1), timeZone);
  return now.getTime() >= hiddenFrom.getTime();
}

function compareAnnouncements(a, b) {
  if (a.pinned !== b.pinned) {
    if (a.pinned) {
      return -1;
    }
    return 1;
  }
  if (a.dateKey === b.dateKey) {
    return 0;
  }
  if (a.dateKey === null) {
    return 1;
  }
  if (b.dateKey === null) {
    return -1;
  }
  if (a.dateKey > b.dateKey) {
    return -1;
  }
  return 1;
}

export function toAnnouncements(rows, { now = new Date(), timeZone = "America/Chicago" } = {}) {
  const result = [];
  for (const row of rows || []) {
    const title = (row.Title || "").trim();
    if (title === "") {
      continue;
    }
    const expiresKey = parseSheetDate(row.ExpiresOn);
    if (isExpired(expiresKey, now, timeZone)) {
      continue;
    }
    const dateKey = parseSheetDate(row.Date);
    let dateLabel = "";
    if (dateKey !== null) {
      dateLabel = formatLongDate(dateKeyToNoonUtc(dateKey), "UTC");
    }
    result.push({
      title,
      body: (row.Body || "").trim(),
      dateKey,
      dateLabel,
      pinned: PINNED_VALUES.test((row.Pinned || "").trim()),
    });
  }
  result.sort(compareAnnouncements);
  return result;
}
