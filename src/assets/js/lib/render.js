// DOM rendering for events and announcements. Builds elements with
// createElement/textContent only, so sheet or calendar text can never inject markup.

const EMPTY_EVENTS = "No upcoming events are scheduled right now. Check back soon.";
const EMPTY_ANNOUNCEMENTS = "No announcements right now. Check back soon.";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined && text !== null && text !== "") {
    node.textContent = text;
  }
  return node;
}

function clear(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function appendParagraphs(parent, text, className) {
  const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
  for (const line of lines) {
    parent.appendChild(el("p", className, line));
  }
}

export function renderMessage(container, text, kind) {
  clear(container);
  container.appendChild(el("p", `data-message data-message--${kind}`, text));
}

function eventElement(event) {
  const article = el("article", "event");
  article.appendChild(el("div", "event__time", event.timeLabel));

  const body = el("div", "event__body");
  const heading = el("h4", "event__title");
  if (event.link) {
    const link = el("a", null, event.title);
    link.setAttribute("href", event.link);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener");
    heading.appendChild(link);
  } else {
    heading.textContent = event.title;
  }
  body.appendChild(heading);
  if (event.location) {
    body.appendChild(el("p", "event__location", event.location));
  }
  appendParagraphs(body, event.description, "event__description");
  article.appendChild(body);
  return article;
}

// groups: [{ dateKey, dateLabel, events: [...] }]; options.limit caps total events shown.
export function renderEventGroups(container, groups, options = {}) {
  clear(container);
  const limit = Number.isFinite(options.limit) ? options.limit : Infinity;
  let shown = 0;

  for (const group of groups) {
    if (shown >= limit) {
      break;
    }
    const section = el("section", "event-day");
    section.appendChild(el("h3", "event-day__date", group.dateLabel));
    for (const event of group.events) {
      if (shown >= limit) {
        break;
      }
      section.appendChild(eventElement(event));
      shown += 1;
    }
    container.appendChild(section);
  }

  if (shown === 0) {
    renderMessage(container, EMPTY_EVENTS, "empty");
  }
}

function announcementElement(item) {
  let className = "announcement";
  if (item.pinned) {
    className += " announcement--pinned";
  }
  const article = el("article", className);
  const header = el("header", "announcement__header");
  header.appendChild(el("h3", "announcement__title", item.title));
  if (item.dateLabel) {
    header.appendChild(el("time", "announcement__date", item.dateLabel));
  }
  article.appendChild(header);
  appendParagraphs(article, item.body, "announcement__body");
  return article;
}

export function renderAnnouncements(container, items, options = {}) {
  clear(container);
  const limit = Number.isFinite(options.limit) ? options.limit : Infinity;
  const toShow = items.slice(0, limit);
  if (toShow.length === 0) {
    renderMessage(container, EMPTY_ANNOUNCEMENTS, "empty");
    return;
  }
  for (const item of toShow) {
    container.appendChild(announcementElement(item));
  }
}
