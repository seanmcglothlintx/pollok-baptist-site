// Date and time formatting helpers. Everything takes an explicit IANA time zone
// so the output is the same in the browser, in tests, and on a server.

const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function formatter(timeZone, options) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...options });
}

// Newer ICU builds put a narrow no-break space before AM/PM. Normalize it so the
// output is a plain space everywhere.
function normalizeSpaces(text) {
  return text.replace(/ /g, " ");
}

// "Sunday, October 4, 2026"
export function formatDateHeading(date, timeZone) {
  return formatter(timeZone, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(date);
}

// "October 4, 2026"
export function formatLongDate(date, timeZone) {
  return formatter(timeZone, { month: "long", day: "numeric", year: "numeric" }).format(date);
}

// "Sunday, November 22"
export function formatWeekdayMonthDay(date, timeZone) {
  return formatter(timeZone, { weekday: "long", month: "long", day: "numeric" }).format(date);
}

// "10:30 AM"
export function formatTime(date, timeZone) {
  return normalizeSpaces(formatter(timeZone, { hour: "numeric", minute: "2-digit", hour12: true }).format(date));
}

// Calendar-date parts of an instant as seen in the given zone.
export function zonedParts(date, timeZone) {
  const parts = formatter(timeZone, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const result = {};
  for (const part of parts) {
    if (part.type !== "literal") {
      result[part.type] = Number(part.value);
    }
  }
  return result;
}

// "2026-10-04" for the calendar date of the instant in the given zone.
export function toDateKey(date, timeZone) {
  const p = zonedParts(date, timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

// A Date at noon UTC on the given calendar date. Format it with timeZone "UTC"
// to get labels for date-only values without any zone drift.
export function dateKeyToNoonUtc(dateKey) {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (match === null) {
    return null;
  }
  const [, y, m, d] = match;
  return new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12));
}

// Midnight at the start of the given calendar date in the given zone, as a UTC instant.
export function zonedMidnight(dateKey, timeZone) {
  const match = DATE_KEY_PATTERN.exec(dateKey);
  if (match === null) {
    return null;
  }
  const [, y, m, d] = match;
  const guess = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 0, 0, 0));
  const p = zonedParts(guess, timeZone);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  const offsetMs = asIfUtc - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
}

// Add whole days to a "YYYY-MM-DD" key.
export function addDaysToKey(dateKey, days) {
  const noon = dateKeyToNoonUtc(dateKey);
  if (noon === null) {
    return null;
  }
  noon.setUTCDate(noon.getUTCDate() + days);
  return noon.toISOString().slice(0, 10);
}
