(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "info@mangoreef.com";

  // ---------- Reveals ----------
  const rev = $$(".display, .lead, .folder, .sheet, .giant, .menu-note, .bar, .note > *, .head, .tile, .book, .quotes > *, .card, .back > *");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.08 });
    rev.forEach(el => io.observe(el));
  }

  // ---------- Turtle Cove time and today's sunset ----------
  const LAT = 21.7836, LON = -72.2662, TZ = "America/Grand_Turk";
  const OPEN = 11 * 60, CLOSE = 21 * 60;
  function tciNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23", weekday: "long" })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    const y = +p.year, m = +p.month, d = +p.day, mins = +p.hour * 60 + +p.minute;
    // offset of TCI from UTC in minutes, e.g. -240
    const now = new Date();
    const offset = Math.round((Date.UTC(y, m - 1, d, +p.hour, +p.minute) - Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes())) / 60000);
    return { y, m, d, mins, offset, weekday: p.weekday };
  }
  // NOAA solar position approximation: local minutes after midnight of sunset
  function sunsetMinutes(y, m, d, offset) {
    const start = Date.UTC(y, 0, 1), day = Math.floor((Date.UTC(y, m - 1, d) - start) / 864e5) + 1;
    const g = 2 * Math.PI / 365 * (day - 1 + (18 - 12) / 24);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const lat = LAT * Math.PI / 180;
    const ha = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(decl)) - Math.tan(lat) * Math.tan(decl)) * 180 / Math.PI;
    const utc = 720 - 4 * (LON - ha) - eq;
    return Math.round(utc + offset);
  }
  const clock = m => { const h = Math.floor(m / 60), mm = m % 60, h12 = ((h + 11) % 12) + 1; return `${h12}:${String(mm).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  const now = tciNow();
  const tomorrow = new Date(Date.UTC(now.y, now.m - 1, now.d + 1));
  const days = [
    { label: "tonight", name: "today", sunset: sunsetMinutes(now.y, now.m, now.d, now.offset) },
    { label: "tomorrow", name: new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(tomorrow),
      sunset: sunsetMinutes(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), now.offset) },
  ];
  days[0].name = "today, " + new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const scene = $("[data-scene]"), mood = $("[data-mood]"), sunsetOut = $("[data-sunset]"), count = $("[data-count]");
  const range = $("[data-arrive]"), timeOut = $("[data-time-out]"), hint = $("[data-hint]"), partyOut = $("[data-party-out]"), book = $("[data-book]");
  const title = $(".tn-title");
  let dayIdx = 0, party = 2;

  function countdown() {
    const n = tciNow().mins, s = days[0].sunset;
    if (dayIdx === 1) return "Turtle Cove time.";
    if (n < s) { const left = s - n, h = Math.floor(left / 60), m = left % 60; return `In ${h ? h + " h " : ""}${m} min, Turtle Cove time.`; }
    if (n < CLOSE) return "The sun is down and the dock lights are on now.";
    return "The kitchen has closed for tonight. Tomorrow from 11am.";
  }
  function render() {
    const d = days[dayIdx], t = +range.value;
    title.firstChild.textContent = dayIdx === 0 ? "Sunset tonight, " : "Sunset tomorrow, ";
    sunsetOut.textContent = clock(d.sunset);
    count.textContent = countdown();
    timeOut.textContent = clock(t);
    scene.style.setProperty("--night-o", smooth(d.sunset - 25, d.sunset + 5, t).toFixed(3));
    let m, h;
    if (t < 15 * 60) { m = "Lunch on the water"; h = "Midday sun: the covered patio is the cool spot."; }
    else if (t < d.sunset - 60) { m = "Afternoon on the cove"; h = "A late lunch or an early drink while the boats come in."; }
    else if (t < d.sunset + 10) { m = "Golden hour"; h = "Just before sunset: ask for a table on the edge of the dock."; }
    else { m = "Lights on"; h = "After dark the dock lights colour the whole marina."; }
    mood.textContent = m; hint.textContent = h;
    partyOut.textContent = party;
    const subject = `Table for ${party}, ${d.label} at ${clock(t)}`;
    const body = `Hello Mango Reef,\n\nWe'd like a table for ${party} ${d.label === "tonight" ? "tonight" : "tomorrow"} (${d.name}) at ${clock(t)}.${t >= d.sunset - 60 && t < d.sunset + 10 ? "\nIf possible, a table on the edge of the dock for the sunset." : ""}\n\nName:\nPhone:\n\nThank you!`;
    book.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  // start just after sunset, when the dock lights are on
  const round15 = x => Math.round(x / 15) * 15;
  range.value = Math.min(CLOSE, Math.max(OPEN, round15(days[0].sunset + 15)));
  if (now.mins > CLOSE - 15) { dayIdx = 1; }
  $$("[data-dayopt]").forEach(b => {
    b.setAttribute("aria-pressed", String(+b.dataset.dayopt === dayIdx));
    b.addEventListener("click", () => {
      dayIdx = +b.dataset.dayopt;
      $$("[data-dayopt]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      render();
    });
  });
  range.addEventListener("input", render);
  $$("[data-party]").forEach(b => b.addEventListener("click", () => { party = Math.max(1, Math.min(20, party + +b.dataset.party)); render(); }));
  render();
  setInterval(() => { count.textContent = countdown(); }, 30000);

  // ---------- Menu: point at a dish, see it in the frame ----------
  const frame = {}; $$("[data-prev]").forEach(img => (frame[img.dataset.prev] = img));
  const show = key => Object.entries(frame).forEach(([k, img]) => img.classList.toggle("on", k === key));
  $$(".items li[data-img]").forEach(li => {
    li.style.setProperty("--thumb", `url("${frame[li.dataset.img].getAttribute("src")}")`);
    li.addEventListener("pointerenter", e => {
      if (e.pointerType !== "mouse") return;
      show(li.dataset.img); li.classList.add("hot"); li.parentElement.classList.add("dim");
    });
    li.addEventListener("pointerleave", () => { show("dock"); li.classList.remove("hot"); li.parentElement.classList.remove("dim"); });
  });

  // ---------- Homemade ice cream: three scoops ----------
  const cone = $("[data-cone]"), flavours = $$("[data-flavours] button");
  let picked = [];
  flavours.forEach(b => b.addEventListener("click", () => {
    const f = b.textContent;
    if (picked.includes(f)) picked = picked.filter(x => x !== f);
    else { if (picked.length === 3) { const out = picked.shift(); flavours.find(x => x.textContent === out).setAttribute("aria-pressed", "false"); } picked.push(f); }
    b.setAttribute("aria-pressed", String(picked.includes(f)));
    const list = picked.length > 1 ? picked.slice(0, -1).join(", ") + " and " + picked.at(-1) : picked[0];
    cone.textContent = picked.length === 0 ? "Choose three flavours." : picked.length < 3 ? `${list}. ${3 - picked.length} more to go.` : `${list}: $12.`;
  }));
})();
