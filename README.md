# Pollok Baptist Church website

Static site built with [Eleventy](https://www.11ty.dev/). Events come from a public Google
Calendar and announcements from a published Google Sheet, both fetched in the browser, so the
site never needs a rebuild when the church posts something new.

## Commands

```
npm install        # once
npm test           # vitest: unit specs + a build smoke test
npm run serve      # dev server at http://localhost:8080 with live reload
npm run build      # writes the site to _site/
```

## Where things are

| Path | Purpose |
|---|---|
| `src/_data/site.json` | Name, contact details, service times, calendar/sheet/form IDs, `dataSource` |
| `src/_includes/base.njk` | Massively layout: head, home intro, header, nav, footer, scripts |
| `src/_includes/post-header.njk` | Opens an inner page as a Massively "post" (title, tagline, photo) |
| `src/*.njk` | One file per page |
| `src/assets/css/main.css`, `noscript.css`, `fontawesome-all.min.css` | Massively by HTML5 UP, unmodified apart from image paths in `noscript.css` |
| `src/assets/css/site.css` | Church overrides and components Massively lacks (notice bar, events, announcements, contact cards) |
| `src/assets/js/massively/` | Massively scripts (jQuery, Scrollex, nav panel, parallax background) |
| `src/assets/js/site.js` | Browser entry: loads events and announcements |
| `src/assets/js/lib/` | Modules under test: date formatting, calendar model, CSV, announcements, feed URLs, DOM render, notice-bar rotator |
| `src/assets/data/` | Fixture data used while a feed's `source` is `"fixture"` |
| `tests/` | Vitest specs, Given_When_Then naming |
| `CONTENT-NEEDED.md` | Checklist of content the church still has to supply |

## Design

The look is [Massively](https://html5up.net/massively) by HTML5 UP, under CC BY 3.0
(`licenses/massively-CC-BY-3.0.txt`). The licence requires the "Design: HTML5 UP" credit in
the footer; a build test keeps it there. The background photo is set in `site.css`
(`#wrapper > .bg`). The untouched download is in `..\templates\massively\` for reference.

## Data feeds

Each feed has its own `source` in `site.json`: `"fixture"` reads the sample file under
`src/assets/data/`, `"live"` reads Google.

- **Announcements** are live. `announcements.publishedId` is the id from the sheet's
  File > Share > Publish to web link (the part after `/d/e/`), and `gid` is the tab id from
  that same link. The site fetches `/pub?output=csv`, which Google serves with CORS headers.
- **Calendar** is still on the fixture. Fill in `calendar.calendarId` and `calendar.apiKey`
  and set `calendar.source` to `"live"`. See `CONTENT-NEEDED.md`.

## Home page notice bar

The home page shows the top five announcements (pinned first, then newest) one at a time in a
bar at the top of the main panel, just under the intro. It advances every 8 seconds, pauses on hover, keyboard focus and hidden
tabs, never auto-advances for visitors with reduced motion enabled, and has previous/next
buttons plus dots. Change the count with `data-limit` on `#notice-bar` in `src/index.njk`
and the interval via `intervalMs` in `src/assets/js/lib/rotator.js`.

## Announcements sheet format

| Title | Date | Body | ExpiresOn | Pinned |
|---|---|---|---|---|
| Fall Revival | 2026-09-28 | Guest speaker each evening… | 2026-11-23 | yes |

Dates accept `2026-09-28` or `9/28/2026`. Rows disappear the day after `ExpiresOn`.
Pinned rows (`yes`, `y`, `true`, `1`, `x`) sort to the top. Line breaks in Body become paragraphs.
