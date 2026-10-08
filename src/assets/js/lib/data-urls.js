// Builds the URLs the browser fetches for each data feed. Each feed has its own
// `source`: "fixture" reads a local sample file, "live" reads Google.

function require(value, name, feed) {
  if (!value) {
    throw new Error(`${feed}.${name} is required when ${feed}.source is "live"`);
  }
  return value;
}

// Google Sheets "File > Share > Publish to web" gives a link containing
// /d/e/<publishedId>/pubhtml. The same id serves CSV from /pub?output=csv, and
// that endpoint sends CORS headers, unlike the /export URL for the raw sheet id.
export function announcementsCsvUrl(config) {
  if (config.source === "fixture") {
    return config.fixtureUrl;
  }
  const publishedId = require(config.publishedId, "publishedId", "announcements");
  const gid = config.gid || "0";
  return `https://docs.google.com/spreadsheets/d/e/${encodeURIComponent(publishedId)}/pub?gid=${encodeURIComponent(gid)}&single=true&output=csv`;
}

export function calendarEventsUrl(config, now) {
  if (config.source === "fixture") {
    return config.fixtureUrl;
  }
  const calendarId = require(config.calendarId, "calendarId", "calendar");
  const apiKey = require(config.apiKey, "apiKey", "calendar");
  const params = new URLSearchParams({
    key: apiKey,
    timeMin: now.toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "50",
  });
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
}
