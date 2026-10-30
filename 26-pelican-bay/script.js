// Pelican Bay: open line in TCI time, hero crossfade, menu tabs, and "Which nights are you here?"
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TZ = "America/Grand_Turk";
  const EMAIL = "info@pelicanbaytci.com";

  // ----- Time on the island -----
  function tciParts() {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = t => Number(p.find(x => x.type === t).value);
    return { h: get("hour"), m: get("minute") };
  }
  const tciToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

  // ----- Open line: 7:30 am to 10 pm daily, happy hour 5 to 7 -----
  const openEl = $("[data-open]");
  function paintOpen() {
    if (!openEl) return;
    const { h, m } = tciParts();
    const t = h * 60 + m;
    let text, closed = false;
    if (t < 450) { text = "Opens today at 7:30 am"; closed = true; }
    else if (t >= 1320) { text = "Closed now, opens tomorrow at 7:30 am"; closed = true; }
    else if (t >= 1020 && t < 1140) text = "Happy hour now: half price until 7 pm";
    else text = "Open now until 10 pm";
    openEl.textContent = text;
    openEl.classList.toggle("is-closed", closed);
  }
  paintOpen();
  setInterval(paintOpen, 60000);

  // ----- Hero: slow crossfade -----
  const frames = $$(".hero-photos img");
  if (frames.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      frames[i].classList.remove("is-on");
      i = (i + 1) % frames.length;
      frames[i].classList.add("is-on");
    }, 6000);
  }

  // ----- Entrances -----
  const rv = $$(".rv");
  rv.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains("rv"));
    el.style.setProperty("--d", (Math.min(sibs.indexOf(el), 5) * 80) + "ms");
  });
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(el => io.observe(el));
    // Safety: anything already on screen shows even if the observer is late
    setTimeout(() => rv.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }), 2500);
  } else rv.forEach(el => el.classList.add("in"));

  // ----- Menu tabs -----
  const tabs = $$('[role="tab"]');
  const pic = $("[data-menu-pic]");
  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (pic && pic.getAttribute("src") !== tab.dataset.pic) {
      pic.classList.add("is-swapping");
      setTimeout(() => { pic.src = tab.dataset.pic; pic.alt = tab.dataset.alt; pic.classList.remove("is-swapping"); }, reduce ? 0 : 200);
    }
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", e => {
      const k = e.key;
      let n = null;
      if (k === "ArrowRight") n = (i + 1) % tabs.length;
      else if (k === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      else if (k === "Home") n = 0;
      else if (k === "End") n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); selectTab(tabs[n], true); }
    });
  });
  if (tabs.length) {
    const { h } = tciParts();
    selectTab(tabs[h < 11 ? 0 : h < 17 ? 1 : 2]);
  }

  // ----- Which nights are you here? -----
  const datesForm = $("[data-dates]");
  const daysEl = $("[data-days]");
  const sumEl = $("[data-sum]");
  const ask = $("[data-ask]");
  const askTitle = $("[data-ask-title]");
  const partyEl = $("[data-party]");
  const timeEl = $("[data-time]");
  const whoEl = $("[data-who]");
  const gratuity = $("[data-gratuity]");
  const askMsg = $("[data-ask-msg]");
  const KEY = "pb-stay";
  const MAX_NIGHTS = 21;

  const parse = s => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const iso = d => d.toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const fmt = (d, o) => d.toLocaleDateString("en-US", { timeZone: "UTC", ...o });

  function nightOf(d) {
    const dow = d.getUTCDay();
    const month = d.getUTCMonth() + 1;
    const lobsterSeason = month >= 8 || month <= 3;
    if (dow === 3) return lobsterSeason
      ? { k: "lobster", name: "Lobster Extravaganza", what: "All-you-can-eat lobster", theme: true }
      : { k: "bbq", name: "Caribbean BBQ Cookout", what: "All-you-can-eat BBQ Cookout", theme: true };
    if (dow === 5) return { k: "tapas", name: "Friday Tapas", what: "Friday Tapas", theme: true };
    if (dow === 0) return { k: "jerk", name: "Jerk Fiesta", what: "Jerk Fiesta", theme: true };
    return { k: "menu", name: "dinner from the menu", what: "Dinner from the menu", theme: false };
  }

  let state = { party: 2, time: "7:00 pm", who: "", sel: "" };
  try { Object.assign(state, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage blocked */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ } };

  function listJoin(a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; }

  function renderDays() {
    if (!datesForm) return;
    const aIn = datesForm.elements.namedItem("arrive");
    const lIn = datesForm.elements.namedItem("leave");
    const today = tciToday();
    aIn.min = today;
    if (!aIn.value || aIn.value < today) aIn.value = today;
    lIn.min = iso(addDays(parse(aIn.value), 1));
    if (!lIn.value) lIn.value = iso(addDays(parse(aIn.value), 6));

    const a = parse(aIn.value), l = parse(lIn.value);
    let n = Math.round((l - a) / 86400000);
    daysEl.textContent = "";
    if (!(n >= 1)) {
      sumEl.textContent = "Pick a leaving date after the day you arrive.";
      ask.hidden = true;
      return;
    }
    const capped = n > MAX_NIGHTS;
    if (capped) n = MAX_NIGHTS;

    const seen = new Map();
    for (let i = 0; i < n; i++) {
      const d = addDays(a, i);
      const night = nightOf(d);
      if (night.theme) seen.set(night.name, (seen.get(night.name) || 0) + 1);
      const weekend = d.getUTCDay() === 6 || d.getUTCDay() === 0;
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day day-" + night.k + (reduce ? "" : " day-in");
      b.style.setProperty("--i", i);
      b.dataset.date = iso(d);
      b.setAttribute("aria-pressed", state.sel === iso(d));
      b.innerHTML =
        `<span class="day-dow">${fmt(d, { weekday: "short" })} · ${fmt(d, { month: "short" })}</span>` +
        `<span class="day-date">${d.getUTCDate()}</span>` +
        `<span class="day-what">${night.what}</span>` +
        `<span class="day-hh">Happy hour 5 to 7${weekend ? ", lobster Benedict at breakfast" : ""}</span>`;
      b.setAttribute("aria-label", `${fmt(d, { weekday: "long", month: "long", day: "numeric" })}: ${night.what}. Happy hour 5 to 7.${weekend ? " Lobster Benedict at weekend breakfast." : ""} Ask for a table.`);
      b.addEventListener("click", () => choose(iso(d)));
      li.append(b);
      daysEl.append(li);
    }

    const names = [...seen.keys()];
    const nights = n === 1 ? "1 night" : n + " nights";
    sumEl.textContent = names.length
      ? `${nights} with us, and you'll catch ${listJoin(names)}. Plus ${n === 1 ? "a happy hour" : n + " happy hours"}. Tap a night to ask for a table.${capped ? " Showing your first 21 nights." : ""}`
      : `No theme night in ${nights}, but happy hour runs 5 to 7 every evening. Tap a night to ask for a table.`;

    if (state.sel && (state.sel < iso(a) || state.sel >= iso(addDays(a, n)))) { state.sel = ""; }
    if (state.sel) showAsk(); else ask.hidden = true;
    state.arrive = aIn.value; state.leave = lIn.value;
    save();
  }

  function choose(date) {
    state.sel = date;
    $$(".day", daysEl).forEach(b => b.setAttribute("aria-pressed", b.dataset.date === date));
    save();
    showAsk(true);
  }

  function showAsk(scroll) {
    const d = parse(state.sel);
    const night = nightOf(d);
    askTitle.textContent = `A table on ${fmt(d, { weekday: "long", month: "long", day: "numeric" })}` + (night.theme ? `, ${night.name}` : "");
    ask.hidden = false;
    askMsg.textContent = "";
    askMsg.classList.remove("is-error");
    paintParty();
    if (scroll) ask.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
  }

  function paintParty() {
    partyEl.textContent = state.party;
    gratuity.hidden = state.party < 8;
  }

  if (datesForm) {
    const aIn = datesForm.elements.namedItem("arrive");
    const lIn = datesForm.elements.namedItem("leave");
    if (state.arrive && state.arrive >= tciToday()) aIn.value = state.arrive;
    if (state.leave && state.arrive && state.leave > state.arrive) lIn.value = state.leave;
    aIn.addEventListener("change", () => {
      if (lIn.value && lIn.value <= aIn.value) lIn.value = iso(addDays(parse(aIn.value), 6));
      renderDays();
    });
    lIn.addEventListener("change", renderDays);
    timeEl.value = state.time;
    whoEl.value = state.who || "";
    timeEl.addEventListener("change", () => { state.time = timeEl.value; save(); });
    whoEl.addEventListener("input", () => { state.who = whoEl.value; save(); });
    $$("[data-step]").forEach(btn => btn.addEventListener("click", () => {
      state.party = Math.min(30, Math.max(1, state.party + Number(btn.dataset.step)));
      paintParty();
      save();
    }));
    ask.addEventListener("submit", e => {
      e.preventDefault();
      const who = whoEl.value.trim();
      if (!who) {
        askMsg.textContent = "Add your name so the restaurant knows who's coming.";
        askMsg.classList.add("is-error");
        whoEl.focus();
        return;
      }
      const d = parse(state.sel);
      const night = nightOf(d);
      const day = fmt(d, { weekday: "long", month: "long", day: "numeric" });
      const people = state.party === 1 ? "1 person" : state.party + " people";
      const body = `Hi Pelican Bay,\n\nI'd like a table for ${people} on ${day} at ${timeEl.value}${night.theme ? " for the " + night.name : ""}.\n\nName: ${who}\n\nThank you!`;
      const href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Table for ${people} on ${day}`)}&body=${encodeURIComponent(body)}`;
      askMsg.classList.remove("is-error");
      askMsg.textContent = "Your email app should open with the request written. Rather talk? Call 649 941 2365.";
      ask.dataset.lastMail = href;
      location.href = href;
    });
    renderDays();
  }

  // ----- Phone bar: away while the hero or the planner is on screen -----
  const bar = $("[data-bar]");
  const hero = $(".hero");
  const stay = $("#stay");
  if (bar && "IntersectionObserver" in window) {
    bar.classList.add("is-away");
    bar.hidden = false;
    const vis = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => vis.set(e.target, e.isIntersecting));
      bar.classList.toggle("is-away", [...vis.values()].some(Boolean));
    });
    [hero, stay].forEach(el => el && io.observe(el));
  }
})();
