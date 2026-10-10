// Text-only rotator for the home page: the announcements notice bar and the
// "Coming Up" events. Shows one item at a time, auto-advances on a timer, pauses on
// hover or keyboard focus, never auto-advances under reduced motion, and always offers
// previous/next buttons plus one dot per item so people can move at their own pace.
// `describe(item)` maps an item to { meta, title, body, pinned }; the default reads an
// announcement.

function firstLine(text) {
  const lines = (text || "").split(/\r?\n/).map((l) => l.trim()).filter((l) => l !== "");
  if (lines.length === 0) {
    return "";
  }
  return lines[0];
}

const DEFAULTS = {
  intervalMs: 8000,
  limit: 5,
  label: "Announcements",
  itemName: "announcement",
  moreHref: "/announcements/",
  moreLabel: "Read more",
  reducedMotion: false,
  describe: (item) => ({ title: item.title, body: firstLine(item.body), pinned: Boolean(item.pinned) }),
};

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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

export function createRotator(container, allItems, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const items = (allItems || []).slice(0, opts.limit);

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (items.length === 0) {
    container.hidden = true;
    return { destroy() {}, get index() { return -1; } };
  }

  container.hidden = false;
  container.setAttribute("aria-roledescription", "carousel");
  container.setAttribute("aria-label", opts.label);

  const hasMany = items.length > 1;
  let index = 0;
  let timer = null;
  let paused = false;

  // Structure
  const row = el("div", "notice-bar__row");
  let prevButton = null;
  let nextButton = null;
  if (hasMany) {
    prevButton = el("button", "notice-bar__nav notice-bar__prev", "‹");
    prevButton.type = "button";
    prevButton.setAttribute("aria-label", `Previous ${opts.itemName}`);
    row.appendChild(prevButton);
  }

  const live = el("div", "notice-bar__item");
  live.setAttribute("aria-live", "polite");
  live.setAttribute("aria-atomic", "true");
  const meta = el("span", "notice-bar__meta");
  const title = el("span", "notice-bar__title");
  const body = el("span", "notice-bar__body");
  const more = el("a", "notice-bar__more", opts.moreLabel);
  more.setAttribute("href", opts.moreHref);
  live.appendChild(meta);
  live.appendChild(title);
  live.appendChild(body);
  live.appendChild(more);
  row.appendChild(live);

  if (hasMany) {
    nextButton = el("button", "notice-bar__nav notice-bar__next", "›");
    nextButton.type = "button";
    nextButton.setAttribute("aria-label", `Next ${opts.itemName}`);
    row.appendChild(nextButton);
  }
  container.appendChild(row);

  const dots = [];
  if (hasMany) {
    const dotRow = el("div", "notice-bar__dots");
    dotRow.setAttribute("role", "tablist");
    items.forEach((_, i) => {
      const dot = el("button", "notice-bar__dot", String(i + 1));
      dot.type = "button";
      dot.setAttribute("role", "tab");
      dot.setAttribute("aria-label", `${capitalize(opts.itemName)} ${i + 1} of ${items.length}`);
      dot.addEventListener("click", () => {
        goTo(i);
        restartTimer();
      });
      dotRow.appendChild(dot);
      dots.push(dot);
    });
    container.appendChild(dotRow);
  }

  function show(i) {
    index = i;
    const slide = opts.describe(items[index]);
    meta.textContent = slide.meta || "";
    meta.hidden = !slide.meta;
    title.textContent = slide.title || "";
    body.textContent = slide.body || "";
    live.classList.toggle("notice-bar__item--pinned", Boolean(slide.pinned));
    dots.forEach((dot, d) => {
      if (d === index) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  }

  function goTo(i) {
    const n = items.length;
    show(((i % n) + n) % n);
  }

  function stopTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (!hasMany || opts.reducedMotion || paused || document.hidden) {
      return;
    }
    timer = setInterval(() => goTo(index + 1), opts.intervalMs);
  }

  // Do not rotate while the tab is in the background, so a returning visitor
  // sees the same notice they left.
  function onVisibilityChange() {
    if (document.hidden) {
      stopTimer();
    } else {
      startTimer();
    }
  }

  function restartTimer() {
    startTimer();
  }

  function onPause() {
    paused = true;
    stopTimer();
  }

  function onResume() {
    paused = false;
    startTimer();
  }

  if (prevButton) {
    prevButton.addEventListener("click", () => {
      goTo(index - 1);
      restartTimer();
    });
  }
  if (nextButton) {
    nextButton.addEventListener("click", () => {
      goTo(index + 1);
      restartTimer();
    });
  }
  container.addEventListener("mouseenter", onPause);
  container.addEventListener("mouseleave", onResume);
  container.addEventListener("focusin", onPause);
  container.addEventListener("focusout", onResume);
  document.addEventListener("visibilitychange", onVisibilityChange);

  show(0);
  startTimer();

  return {
    get index() {
      return index;
    },
    next() {
      goTo(index + 1);
      restartTimer();
    },
    prev() {
      goTo(index - 1);
      restartTimer();
    },
    goTo(i) {
      goTo(i);
      restartTimer();
    },
    destroy() {
      stopTimer();
      container.removeEventListener("mouseenter", onPause);
      container.removeEventListener("mouseleave", onResume);
      container.removeEventListener("focusin", onPause);
      container.removeEventListener("focusout", onResume);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    },
  };
}
