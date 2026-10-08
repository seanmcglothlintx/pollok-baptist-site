// Turns Google Calendar API v3 event items into plain view models for rendering.
// Pure functions: no fetch, no DOM.

import {
  formatDateHeading,
  formatTime,
  formatWeekdayMonthDay,
  toDateKey,
  dateKeyToNoonUtc,
  zonedMidnight,
  addDaysToKey,
} from "./format-date.js";

const UNTITLED = "(Untitled event)";
const EN_DASH = "–";

function allDayViewModel(item, timeZone) {
  const startKey = item.start.date;
  const exclusiveEndKey = item.end && item.end.date ? item.end.date : addDaysToKey(startKey, 1);
  const lastDayKey = addDaysToKey(exclusiveEndKey, -1);

  let timeLabel = "All day";
  if (lastDayKey > startKey) {
    timeLabel = `All day, through ${formatWeekdayMonthDay(dateKeyToNoonUtc(lastDayKey), "UTC")}`;
  }

  return {
    isAllDay: true,
    dateKey: startKey,
    dateLabel: formatDateHeading(dateKeyToNoonUtc(startKey), "UTC"),
    timeLabel,
    startInstant: zonedMidnight(startKey, timeZone),
    endInstant: zonedMidnight(exclusiveEndKey, timeZone),
  };
}

function timedViewModel(item, timeZone) {
  const start = new Date(item.start.dateTime);
  const end = item.end && item.end.dateTime ? new Date(item.end.dateTime) : start;
  const startKey = toDateKey(start, timeZone);
  const endKey = toDateKey(end, timeZone);

  let timeLabel = formatTime(start, timeZone);
  if (end.getTime() !== start.getTime()) {
    if (endKey === startKey) {
      timeLabel = `${timeLabel} ${EN_DASH} ${formatTime(end, timeZone)}`;
    } else {
      timeLabel = `${timeLabel} ${EN_DASH} ${formatWeekdayMonthDay(end, timeZone)}, ${formatTime(end, timeZone)}`;
    }
  }

  return {
    isAllDay: false,
    dateKey: startKey,
    dateLabel: formatDateHeading(start, timeZone),
    timeLabel,
    startInstant: start,
    endInstant: end,
  };
}

function toViewModel(item, timeZone) {
  if (!item || !item.start) {
    return null;
  }

  let timing;
  if (item.start.date) {
    timing = allDayViewModel(item, timeZone);
  } else if (item.start.dateTime) {
    timing = timedViewModel(item, timeZone);
  } else {
    return null;
  }

  return {
    id: item.id || "",
    title: (item.summary || "").trim() || UNTITLED,
    location: (item.location || "").trim(),
    description: (item.description || "").trim(),
    link: item.htmlLink || "",
    ...timing,
  };
}

// items: the `items` array from the Calendar API (or a fixture shaped the same way).
// Drops events that have already ended, sorts by start.
export function toEventViewModels(items, { now = new Date(), timeZone = "America/Chicago" } = {}) {
  const result = [];
  for (const item of items || []) {
    const vm = toViewModel(item, timeZone);
    if (vm === null) {
      continue;
    }
    if (vm.endInstant.getTime() <= now.getTime()) {
      continue;
    }
    result.push(vm);
  }
  result.sort((a, b) => a.startInstant.getTime() - b.startInstant.getTime());
  return result;
}

// Groups already-sorted view models into [{ dateKey, dateLabel, events }].
export function groupByDate(viewModels) {
  const groups = [];
  let current = null;
  for (const vm of viewModels) {
    if (current === null || current.dateKey !== vm.dateKey) {
      current = { dateKey: vm.dateKey, dateLabel: vm.dateLabel, events: [] };
      groups.push(current);
    }
    current.events.push(vm);
  }
  return groups;
}
