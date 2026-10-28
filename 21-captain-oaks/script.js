(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TZ = "America/Grand_Turk";
  const WHATSAPP = "16492321517";
  const LAT = 21.775, LON = -72.18; // Long Bay, Providenciales
  const OPEN = 12 * 60;
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // ---------- Turks and Caicos time ----------
  function parts(date) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(date).map(x => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
  }
  const clock = min => { const h = Math.floor(min / 60), m = min % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`; };
  const fmtDay = d => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  const iso = d => d.toISOString().slice(0, 10);

  // Sunset at Long Bay for a calendar day (NOAA general solar position equations), as minutes after local midnight.
  function sunset(y, m, d) {
    const rad = Math.PI / 180;
    const n = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5);
    const g = 2 * Math.PI / 365 * (n - 1);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(LAT * rad) * Math.cos(decl)) - Math.tan(LAT * rad) * Math.tan(decl)) / rad;
    const utcMin = 720 - 4 * (LON - ha) - eq;
    return parts(new Date(Date.UTC(y, m - 1, d) + utcMin * 60000)).min;
  }

  let now = null, set = 18 * 60;
  try { now = parts(new Date()); set = sunset(now.y, now.m, now.d); } catch (e) { /* the static text stays */ }

  // ---------- Open now, sunset today, the sea at this hour ----------
  function status() {
    if (!now) return;
    const bar = $("[data-status]"), text = $("[data-status-text]");
    let state = "closed", line;
    if (now.min < OPEN) line = `Opens at noon. Sunset today ${clock(set)}`;
    else if (now.min < set) { state = "open"; line = `Open now, until sunset at ${clock(set)}`; }
    else line = "Closed for the night. Back tomorrow at noon";
    bar.dataset.state = state; text.textContent = line;
    $$("[data-sunset]").forEach(el => { el.textContent = clock(set); });

    const want = now.min < 6 * 60 || now.min >= set - 45 ? "sunset" : now.min >= 15 * 60 ? "afternoon" : "noon";
    $$("[data-sky-img]").forEach(img => img.classList.toggle("is-on", img.dataset.skyImg === want));

    const lob = $("[data-lobster]");
    if (lob) { const on = now.m >= 8 || now.m <= 3; lob.textContent = on ? "In season now" : "Back 1 August"; lob.classList.toggle("is-now", on); }
  }
  status();
  setInterval(() => { try { now = parts(new Date()); set = sunset(now.y, now.m, now.d); status(); } catch (e) {} }, 60000);

  // ---------- Where will the water reach you? ----------
  const tall = $("[data-tall]"), tallOut = $("[data-tall-out]"), person = $("[data-person]"), out = $("[data-gauge-out]"), unitsBtn = $("[data-units]");
  let metric = false;
  const LANDMARKS = [[0.28, "knees"], [0.4, "thighs"], [0.5, "hips"], [0.6, "waist"], [0.72, "chest"], [0.82, "shoulders"], [0.87, "chin"]];
  function reach(depthIn, heightIn) {
    const r = depthIn / heightIn;
    if (r >= 0.93) return "over";
    if (r >= 0.885) return "above-chin";
    return LANDMARKS.reduce((best, l) => Math.abs(l[0] - r) < Math.abs(best[0] - r) ? l : best)[1];
  }
  function gauge() {
    const h = +tall.value;
    tallOut.textContent = metric ? `${Math.round(h * 2.54)} cm` : `${Math.floor(h / 12)} ft ${h % 12} in`;
    person.setAttribute("transform", `translate(210 300) scale(${(h * 40 / 12).toFixed(2)})`);
    const lo = reach(36, h), hi = reach(60, h);
    let msg;
    if (lo === "over") msg = "It's over your head even at low water, so wear a life jacket and stay with a grown-up.";
    else if (lo === "above-chin") msg = "At low water it already comes above your chin, and at high water it's over your head, so wear a life jacket.";
    else if (hi === "over") msg = `At low water it comes to your ${lo}. At high water it's over your head, so wear a life jacket or bring a float.`;
    else if (hi === "above-chin") msg = `At low water it comes to your ${lo}. At high water it can reach above your chin, so a float or a noodle helps.`;
    else msg = `At low water it comes to your ${lo}; at high water, to your ${hi}.`;
    out.textContent = msg;
  }
  tall.addEventListener("input", gauge);
  unitsBtn.addEventListener("click", () => {
    metric = !metric;
    unitsBtn.setAttribute("aria-pressed", String(metric));
    unitsBtn.textContent = metric ? "Show feet" : "Show cm";
    gauge();
  });
  gauge();

  // ---------- Book the water taxi on WhatsApp ----------
  const dayIn = $("[data-day]"), whoIn = $("[data-who]"), pplOut = $("[data-ppl-out]"), total = $("[data-total]"), wa = $("[data-wa]");
  let ppl = 2;
  if (now) {
    const today = new Date(Date.UTC(now.y, now.m - 1, now.d));
    dayIn.min = iso(today);
    dayIn.value = iso(now.min < 16 * 60 ? today : new Date(today.getTime() + 864e5));
  }
  function booking() {
    const d = dayIn.value ? new Date(dayIn.value + "T00:00:00Z") : null;
    const day = d ? fmtDay(d) : "to confirm";
    pplOut.textContent = ppl;
    total.textContent = `${ppl} ${ppl === 1 ? "person" : "people"} × $20 = $${ppl * 20}, out and back`;
    const name = whoIn.value.trim();
    const msg = `Hi Captain Oak's! I'd like to book the water taxi.\n\nDay: ${day}\nPeople: ${ppl} ($${ppl * 20} round trip)${name ? `\nName: ${name}` : ""}\n\nWhat time can you pick us up at Heaving Down Rock?`;
    wa.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  }
  $$("[data-ppl]").forEach(b => b.addEventListener("click", () => { ppl = Math.max(1, Math.min(20, ppl + +b.dataset.ppl)); booking(); }));
  [dayIn, whoIn].forEach(x => x.addEventListener("input", booking));
  $("[data-taxi]").addEventListener("submit", e => { e.preventDefault(); wa.click(); });
  booking();

  // ---------- The beach from noon to sunset (signature crossfade) ----------
  const fade = $$("[data-fade] img");
  if (!reduce && fade.length > 1) {
    let i = 0, timer = 0;
    const tick = () => { fade[i].classList.remove("is-on"); i = (i + 1) % fade.length; fade[i].classList.add("is-on"); };
    const run = on => { clearInterval(timer); if (on && !document.hidden) timer = setInterval(tick, 5600); };
    let inView = false;
    new IntersectionObserver(es => { inView = es[0].isIntersecting; run(inView); }, { threshold: 0.2 }).observe($("[data-fade]"));
    document.addEventListener("visibilitychange", () => run(inView));
  }

  // ---------- Entrances ----------
  const rev = $$(".intro-line, .intro-sub, .ip, .deck h2, .panel, .band-cap, .sheet > *, .stage > *, .guests h2, .names ul, .leave, .card, .foot-menu a");
  rev.forEach(n => n.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(n => n.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, k) => {
      e.target.style.transitionDelay = `${Math.min(k, 5) * 75}ms`; e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.08 });
    rev.forEach(n => io.observe(n));
  }
})();
