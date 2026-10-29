// Parrotice: open sign, fitted shout, lit flavours, melt meter on live weather, pint order by email.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TZ = "America/Grand_Turk";
  const OPEN = 11, CLOSE = 17;

  // Time on North Caicos, whatever the visitor's clock says.
  function islandNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute };
  }

  // Open sign in the nav and in the visit section.
  function openSign() {
    const t = islandNow(), mins = t.h * 60 + t.min;
    let short, long, open = false;
    if (mins >= OPEN * 60 && mins < CLOSE * 60) {
      open = true;
      const left = CLOSE * 60 - mins;
      short = left <= 60 ? `Open now, closing at 5pm` : `Open now, until 5pm`;
      long = left <= 60 ? `Open now, but only until 5pm. Hurry.` : `Open right now, until 5pm.`;
    } else if (mins < OPEN * 60) {
      short = "Opens today at 11am";
      long = "Opens today at 11am.";
    } else {
      short = "Closed now, open tomorrow at 11am";
      long = "Closed for today. Open again tomorrow at 11am.";
    }
    const chip = $("[data-open]");
    if (chip) { chip.textContent = short; chip.classList.toggle("is-open", open); }
    const l = $("[data-open-long]");
    if (l) l.textContent = long;
  }
  openSign();
  setInterval(openSign, 60000);

  // Fit the shout and the giant words to their measure, never past it.
  function fitAll() {
    const shout = $(".shout");
    if (shout) {
      const lines = $$("[data-fit]", shout);
      const cs = getComputedStyle(shout);
      const room = shout.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      lines.forEach(l => (l.style.fontSize = "100px"));
      const widest = Math.max(...lines.map(l => l.getBoundingClientRect().width));
      const size = Math.min(230, Math.floor((100 * room) / widest * 0.99));
      lines.forEach(l => (l.style.fontSize = size + "px"));
    }
    $$("[data-fit-word]").forEach(w => {
      const box = w.parentElement;
      const cs = getComputedStyle(box);
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      w.style.fontSize = "100px";
      const width = w.getBoundingClientRect().width;
      const cap = w.classList.contains("menu-word") ? 220 : 340;
      w.style.fontSize = Math.min(cap, Math.floor((100 * room) / width * 0.99)) + "px";
    });
  }
  fitAll();
  if (document.fonts) {
    document.fonts.ready.then(fitAll);
    document.fonts.addEventListener?.("loadingdone", fitAll);
  }
  let rz;
  addEventListener("resize", () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(fitAll); });

  // The shutter opens on the hero cone once the page is ready.
  requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.add("is-ready")));

  // Flavours: one name lit at a time, and the drawn scoop takes its colour.
  const flavours = $(".flavours");
  const names = $$(".fl");
  let lit = 0, flavTimer = null;
  function light(i) {
    names.forEach((n, k) => n.classList.toggle("is-lit", k === i));
    flavours.style.setProperty("--scoop", names[i].dataset.col);
  }
  if (names.length) {
    light(0);
    if (!still) {
      new IntersectionObserver(([e]) => {
        clearInterval(flavTimer);
        if (e.isIntersecting) flavTimer = setInterval(() => { lit = (lit + 1) % names.length; light(lit); }, 2000);
      }, { threshold: 0.25 }).observe(flavours);
    }
  }

  // ---------- Melt meter ----------
  // Typical afternoon air temperature on North Caicos by month, used until (or if) the live reading fails.
  const TYPICAL = [26, 26, 27, 28, 29, 30, 31, 31, 31, 30, 28, 27];
  const PLACES = { 0: "here", 19: "the ferry landing", 20: "Mudjin Harbour", 40: "Bambarra Beach" };
  const melt = $(".melt");
  let temp = TYPICAL[islandNow().m - 1], live = false;
  let shown = 0, raf = 0;

  function lifeOf(what) {
    const cone = Math.max(4, Math.min(22, Math.round(48 - 1.3 * temp)));
    return what === "cone" ? cone : what === "cup" ? Math.round(cone * 1.6) : cone * 4;
  }
  function f2c(c) { return Math.round(c * 9 / 5 + 32); }

  function paint(f, what) {
    // f: 0 = fresh scoop, 1 = gone
    const k = Math.max(0, Math.min(1, f));
    const scoop = $("[data-scoop]");
    if (what === "pint") {
      scoop.style.transform = "scaleY(0)";
      $$("[data-drips] path").forEach(d => (d.style.transform = "scaleY(0)"));
      $("[data-puddle]").style.transform = `scale(${(k * 0.7).toFixed(3)})`;
    } else {
      scoop.style.transform = `translateY(${(k * 40).toFixed(1)}px) scaleY(${(1 - k * 0.6).toFixed(3)})`;
      $$("[data-drips] path").forEach((d, i) => (d.style.transform = `scaleY(${Math.min(1, k * (1.2 + i * 0.25)).toFixed(3)})`));
      $("[data-puddle]").style.transform = `scale(${(what === "cup" ? k * 0.45 : k).toFixed(3)})`;
    }
    $("[data-pupil]").style.transform = `translate(${(-0.6 - k * 1.2).toFixed(2)}px, ${(k * 1.6).toFixed(2)}px)`;
    $("[data-brow]").style.transform = `rotate(${(k * 22).toFixed(1)}deg)`;
  }

  function verdict(what, mins, life) {
    const name = what === "cone" ? "a cone" : what === "cup" ? "a cup" : "a pint";
    const place = PLACES[mins];
    const t = `${Math.round(temp)}°`;
    if (mins === 0) {
      return what === "pint"
        ? `Straight home to the freezer? A pint keeps about ${life} minutes in a bag at ${t}.`
        : "Perfect. Find a seat under the palms and take your time.";
    }
    const r = mins / life;
    if (r < 0.6) return `You'll make it. At ${t}, ${name} lasts about ${life} minutes, and ${place} is ${mins} minutes away.`;
    if (r < 1) return what === "pint"
      ? `Close call: a pint keeps about ${life} minutes in a bag, and ${place} is ${mins} minutes away. A cooler makes it safe.`
      : `Close call: about ${life} minutes of ice cream for ${mins} minutes of road. Eat it on the way.`;
    return what === "pint"
      ? `Not without a cooler. A pint keeps about ${life} minutes at ${t}, and ${place} is ${mins} minutes away.`
      : `It won't make it. At ${t}, ${name} lasts about ${life} minutes, and ${place} is ${mins} minutes away. Eat it here, then go.`;
  }

  function run() {
    if (!melt) return;
    const what = $("input[name=what]:checked").value;
    const where = $("input[name=where]:checked");
    const mins = +where.value;
    const life = lifeOf(what);
    const target = mins / life;

    $("[data-cone]").classList.toggle("is-off", what !== "cone");
    $("[data-cup]").classList.toggle("is-off", what !== "cup");
    $("[data-pint]").classList.toggle("is-off", what !== "pint");
    $("[data-scoop]").classList.toggle("is-off", what === "pint");
    $("[data-to]").textContent = where.dataset.place;
    $("[data-verdict]").textContent = verdict(what, mins, life);

    const track = $(".trip-track"), car = $("[data-car]");
    const span = Math.max(0, track.clientWidth - car.offsetWidth);
    cancelAnimationFrame(raf);
    if (still || mins === 0) {
      shown = target;
      paint(target, what);
      car.style.setProperty("--x", (mins === 0 ? 0 : span) + "px");
      return;
    }
    const t0 = performance.now(), dur = 1800;
    paint(0, what);
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      car.style.setProperty("--x", (span * e).toFixed(1) + "px");
      paint(target * e, what);
      if (p < 1) raf = requestAnimationFrame(step);
      else shown = target;
    };
    raf = requestAnimationFrame(step);
  }

  function weatherLine(feels) {
    const w = $("[data-weather]");
    if (!w) return;
    const t = Math.round(temp);
    w.textContent = live
      ? `It's ${t}°C (${f2c(temp)}°F) at Major Hill right now${feels != null && Math.round(feels) > t ? `, and it feels like ${Math.round(feels)}°` : ""}. Pick what you're having and where you're driving next.`
      : `Afternoons on North Caicos are usually about ${t}°C (${f2c(temp)}°F) this month. Pick what you're having and where you're driving next.`;
  }

  if (melt) {
    $$("input", melt).forEach(i => i.addEventListener("change", run));
    weatherLine();
    run();
    fetch("https://api.open-meteo.com/v1/forecast?latitude=21.9&longitude=-71.94&current=temperature_2m,apparent_temperature&timezone=America%2FGrand_Turk")
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => {
        const c = d && d.current;
        if (!c || typeof c.temperature_2m !== "number") return;
        temp = c.temperature_2m; live = true;
        weatherLine(c.apparent_temperature);
        const what = $("input[name=what]:checked").value, mins = +$("input[name=where]:checked").value;
        $("[data-verdict]").textContent = verdict(what, mins, lifeOf(what));
        paint(mins / lifeOf(what), what);
      })
      .catch(() => {});
    addEventListener("resize", () => {
      const where = $("input[name=where]:checked");
      if (+where.value) $("[data-car]").style.setProperty("--x", Math.max(0, $(".trip-track").clientWidth - $("[data-car]").offsetWidth) + "px");
    });
  }

  // ---------- Pints for tomorrow ----------
  const t = islandNow();
  const tomorrow = new Date(Date.UTC(t.y, t.m - 1, t.d + 1, 12));
  const dayName = tomorrow.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  $$("[data-tomorrow]").forEach(s => (s.textContent = `tomorrow, ${dayName}`));
  const send = $("[data-send]");
  function mail() {
    const flavour = $("[data-flavour]").value, size = $("[data-size]").value;
    const subject = `Order for tomorrow: ${size} of ${flavour.toLowerCase()}`;
    const body = `Hello Parrotice,\n\nI'd like to order ${size} of ${flavour.toLowerCase()} ice cream, to pick up tomorrow, ${dayName}.\n\nName:\nPhone:\nTime I'll come by:\n\nThank you!`;
    send.href = `mailto:pdtx58@yahoo.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  if (send) { $$("[data-order] select").forEach(s => s.addEventListener("change", mail)); mail(); }

  // ---------- Picture strip: doubled so the loop never shows a gap ----------
  const strip = $("[data-strip]");
  if (strip) strip.append(...[...strip.children].map(n => n.cloneNode(true)));

  // ---------- Entrances: each section's parts, staggered, once ----------
  if (!still && "IntersectionObserver" in window) {
    const groups = [
      [".stairs", ".stair-text span, .stair-photos img, .stair-note"],
      [".flavours", ".flav-scoop, .flav-sentence, .flav-note"],
      [".two", ".two h2, .two-head p, .two-word"],
      [".melt", ".melt h2, .melt-weather, .pick, .melt-stage"],
      [".menu", ".menu-word, .bar, .menu-note, .menu-photo"],
      [".made", ".made-pin h2, .made-pin p"],
      [".guests", ".tower, .guests h2, .scores p, .review-title, .guests-ask, .leave, .source"],
      [".visit", ".visit h2, .visit-lead, .cell, .visit-grid > div"],
      [".foot", ".foot-menu a, .foot-blocks"],
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
    $$(".maker").forEach(m => { m.classList.add("rv"); io.observe(m); });
    // Safety: never leave content hidden if the observer is late.
    setTimeout(() => $$(".rv:not(.in)").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
    }), 2500);
  }
})();
