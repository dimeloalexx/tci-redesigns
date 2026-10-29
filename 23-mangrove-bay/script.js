// Mangrove Bay: live board in island time, snapper picker, stage that follows the page, fitted name.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TZ = "America/Grand_Turk";
  const PHONE = "16492461735";
  // Opening hours by weekday (0 = Sunday), in minutes; null = closed.
  const HOURS = [null, [660, 1320], [660, 1320], [660, 1320], [660, 1320], [660, 1320], [480, 1320]];
  const HAPPY = [1020, 1140];
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Time on Providenciales, whatever the visitor's clock says.
  function islandNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "short", month: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
    return { wd, month: +p.month, mins: +p.hour * 60 + +p.minute };
  }
  const clock = m => {
    const h = Math.floor(m / 60), min = m % 60, h12 = ((h + 11) % 12) + 1;
    return `${h12}${min ? ":" + String(min).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}`;
  };
  const span = m => {
    const h = Math.floor(m / 60), min = m % 60;
    if (!h) return `${min} min`;
    return min ? `${h} h ${min} min` : `${h} h`;
  };
  // The next day that opens, after today.
  function nextOpen(wd) {
    for (let i = 1; i <= 7; i++) {
      const d = (wd + i) % 7;
      if (HOURS[d]) return { name: i === 1 ? "tomorrow" : DAYS[d], at: HOURS[d][0] };
    }
  }

  function board() {
    const t = islandNow(), today = HOURS[t.wd];
    let open = false, status, line;
    if (today && t.mins >= today[0] && t.mins < today[1]) {
      open = true;
      status = `Open now until ${clock(today[1])}`;
      line = today[1] - t.mins <= 60 ? `Open now, but only until ${clock(today[1])}.` : `Open right now, until ${clock(today[1])}.`;
    } else if (today && t.mins < today[0]) {
      status = `Opens today at ${clock(today[0])}`;
      line = `Opens today at ${clock(today[0])}, in ${span(today[0] - t.mins)}.`;
    } else {
      const n = nextOpen(t.wd);
      status = `Closed now, open ${n.name} at ${clock(n.at)}`;
      line = t.wd === 0 ? `Closed on Sundays. Open ${n.name} at ${clock(n.at)}.` : `Closed for the night. Open ${n.name} at ${clock(n.at)}.`;
    }

    let happy;
    if (!today) happy = "No happy hour on Sunday. Back Monday at 5 pm.";
    else if (t.mins < HAPPY[0]) happy = `Happy hour starts at 5 pm, in ${span(HAPPY[0] - t.mins)}.`;
    else if (t.mins < HAPPY[1]) happy = `Happy hour right now, until 7 pm.`;
    else {
      const n = nextOpen(t.wd);
      happy = `Happy hour is over for today. Back ${n.name} at 5 pm.`;
    }

    // Lobster closed season in the Turks and Caicos: 1 April to 31 July.
    const lobster = t.month >= 4 && t.month <= 7
      ? "Lobster season is closed until August. It's back on the menu then."
      : "It's lobster season, so ask for the grilled tail.";

    const s = $("[data-status]");
    if (s) { s.textContent = status; s.classList.toggle("is-open", open); }
    const o = $("[data-board-open]"); if (o) o.textContent = line;
    const h = $("[data-board-happy]"); if (h) h.textContent = happy;
    const l = $("[data-board-lobster]"); if (l) l.textContent = lobster;
    $$(".hours tr").forEach(r => r.classList.toggle("is-today", r.dataset.days.split(",").includes(String(t.wd))));
  }
  board();
  setInterval(board, 60000);

  // ---------- The name, fitted to its line and never past it ----------
  function fit() {
    $$("[data-fit-word]").forEach(w => {
      const box = w.parentElement, cs = getComputedStyle(box);
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      w.style.fontSize = "100px";
      const width = w.getBoundingClientRect().width;
      w.style.fontSize = Math.min(260, Math.floor((100 * room) / width * 0.98)) + "px";
    });
  }
  fit();
  if (document.fonts) {
    document.fonts.ready.then(fit);
    document.fonts.addEventListener?.("loadingdone", fit);
  }
  let rz;
  addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { fit(); follow(); }); });

  // ---------- Snapper: the way and two sides ----------
  const NOTES = {
    fried: "The whole fish, scored and fried until the skin is crisp and golden.",
    steamed: "The whole fish, steamed soft. The VisitTCI editors' favourite here.",
    grilled: "The whole fish, cooked over the grill until it lifts off the bone.",
    blackened: "The whole fish, coated in dark spices and seared hot.",
  };
  const PHOTOS = {
    fried: ["assets/fried.jpg", 1600, 1067, "Fried fish with rice, fried plantains and cabbage in a takeout box"],
    steamed: ["assets/steamed.jpg", 1600, 1200, "Steamed white fish with greens on a blue plate"],
    grilled: ["assets/grilled.jpg", 1600, 1022, "A whole grilled fish with vegetables on a white plate"],
    blackened: ["assets/blackened.jpg", 1600, 1063, "A whole dark-seared fish with potatoes and salad"],
  };
  let way = "fried";
  const sides = ["peas 'n' rice", "fried plantains"];
  const sideButtons = $$("[data-side]");

  function plate() {
    const list = sides.length === 2 ? `${sides[0]} and ${sides[1]}` : sides.length === 1 ? sides[0] : "";
    const text = `Whole snapper, ${way}${list ? `, with ${list}` : ""}.`;
    const p = $("[data-plate]"); if (p) p.textContent = text;
    const note = $("[data-way-note]"); if (note) note.textContent = NOTES[way];
    const img = $("[data-snap-photo]");
    if (img) {
      const [src, w, h, alt] = PHOTOS[way];
      img.src = src; img.width = w; img.height = h; img.alt = alt + " (sample photo)";
    }
    const msg = `Hi Mangrove Bay! I'd like to order a whole snapper, ${way}${list ? `, with ${list}` : ""}, to take out.\n\nName:\nPick-up time:`;
    const wa = $("[data-wa]"); if (wa) wa.href = `https://wa.me/${PHONE}?text=${encodeURIComponent(msg)}`;
    sideButtons.forEach(b => b.setAttribute("aria-pressed", String(sides.includes(b.dataset.side))));
    follow();
  }
  $$('input[name="way"]').forEach(r => r.addEventListener("change", () => { way = r.value; plate(); }));
  sideButtons.forEach(b => b.addEventListener("click", () => {
    const s = b.dataset.side, i = sides.indexOf(s);
    if (i >= 0) sides.splice(i, 1);
    else { sides.push(s); if (sides.length > 2) sides.shift(); }
    plate();
  }));

  // ---------- The stage follows the page ----------
  const stage = $("[data-stage]");
  const shots = stage ? $$(".shot", stage) : [];
  const marks = $$("[data-shot-at]");
  const hero = $(".hero");
  let current = "mangrove";
  function show(name) {
    if (name === "snapper") name = way;
    if (name === current) return;
    current = name;
    shots.forEach(s => s.classList.toggle("is-on", s.dataset.shot === name));
  }
  function follow() {
    if (!stage) return;
    const line = innerHeight * 0.45;
    let pick = "mangrove";
    marks.forEach(m => { if (m.getBoundingClientRect().top < line) pick = m.dataset.shotAt; });
    // Past the split, keep the last picture rather than jumping.
    show(pick);
    if (hero) stage.classList.toggle("is-hero", hero.getBoundingClientRect().bottom > innerHeight * 0.6);
  }

  // ---------- The name settles as the first screen leaves ----------
  const mark = $(".mark");
  function settle() {
    if (!mark || still || !hero) return;
    const r = hero.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.8)));
    mark.style.transform = `scale(${1 - k * 0.06})`;
  }

  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { follow(); settle(); ticking = false; });
  }, { passive: true });
  plate();

  // ---------- Entrances: each section's parts, staggered, once ----------
  if (!still && "IntersectionObserver" in window) {
    const groups = [
      [".today", ".today h2, .board-line, .hours"],
      [".snapper", ".snapper h2, .snap-lead, .ways, .way-note, .sides, .plate, .cells"],
      [".menu", ".menu h2, .menu-lead, .group, .menu-photos"],
      [".creek", ".check, .stub"],
      [".reviews", ".reviews h2, .scores p, .quotes blockquote, .leave, .source"],
      [".visit", ".visit-say, .visit-photo, .visit-ways"],
    ];
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    groups.forEach(([sec, parts]) => {
      const root = $(sec);
      if (!root) return;
      $$(parts, root).forEach((el, i) => {
        el.classList.add("rv");
        el.style.setProperty("--d", Math.min(i, 8) * 75 + "ms");
        io.observe(el);
      });
    });
    // Safety: never leave content hidden if the observer is late.
    setTimeout(() => $$(".rv:not(.in)").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
    }), 2500);
  }
})();
