# Content still needed from the church

The rebuilt site ships with the text from the old site plus placeholders where the old
site had nothing real. Each item below maps to a spot in `src/_data/site.json` or a page.

## Contact details (conflicting on the old site)

- [ ] **Phone.** Old site shows both (936) 287-1033 and (936) 899-4590. Site currently uses 287-1033.
      Fix in `site.json` → `phone` and `phoneHref`.
- [ ] **Email.** Old site shows both emily@pollokbaptist.org and keith@pollokbaptist.org. Site uses emily@.
      Fix in `site.json` → `email`.
- [ ] **Street address** for the map: 1053 Paul Townsend Rd, Pollok, TX 75969 (Sean, from
      Google Maps, 2026-10-01). Not yet applied; fix in `site.json` → `location`,
      `mapEmbedUrl`, `mapLinkUrl`.
- [x] **Service times.** Sunday Worship 10:45 AM (Sean, 2026-09-30). Set in `site.json` → `serviceTimes`.

## About page

- [ ] Church history
- [ ] Pastor and staff (names, roles, photo optional)
- [ ] What we believe / affiliation (SBC directory lists the church)

## Photos

- [x] Old site-builder AI images replaced (2026-10-09) with Unsplash photos and a blurred
      church fellowship-meal photo. Sources are in `CREDITS.md`.
- [ ] More real photos of the sanctuary and congregation, to replace the Unsplash ones
      over time.
- [ ] Photographer and link for the Unsplash Bible-study photo (`about-bible-study.jpg`).
- [ ] Church to confirm the logo is its own (not made with the old builder's logo tool).

## Integrations (needed before go-live, not for local work)

- [ ] **Google Calendar**: create or share a public calendar; put its ID in `site.json` →
      `calendar.calendarId`, its public link in `calendar.publicUrl`. Create an API key in
      Google Cloud restricted to the Calendar API and to the site's domain; put it in
      `calendar.apiKey`. Then set `calendar.source` to `"live"`.
- [x] **Google Sheet** for announcements is published and live as of 2026-09-30
      (`announcements.publishedId` / `gid` in `site.json`). Columns
      `Title, Date, Body, ExpiresOn, Pinned`. Still to do: share edit access with the church office.
- [ ] **Formspree** (or similar) form endpoint: `contactForm.formspreeId`.
- [ ] **Social links** if the church has a Facebook page or YouTube channel.
