// Provo Ponies: the tide at Long Bay on the name, a planner that finds the low-tide ride, the ride request,
// tabs, the ride accordion, and the scroll moves. Everything readable works without this script.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = matchMedia("(max-width: 899px)");
  const TZ = "America/Grand_Turk";
  const EMAIL = "provoponiestci@gmail.com";
  const PHONE = "16492416350";
  // Long Bay, on the south side of Providenciales
  const TIDE_URL = "https://marine-api.open-meteo.com/v1/marine?latitude=21.775&longitude=-72.17&hourly=sea_level_height_msl&timezone=America%2FGrand_Turk&forecast_days=16";
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // ---------- Words fitted to their line ----------
  // Two-word names stack on a phone, so each word becomes its own span.
  $$("[data-fit]").forEach(el => {
    const words = el.textContent.trim().split(/\s+/);
    if (words.length > 1 && !el.querySelector(".w")) el.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(" ");
  });
  function fit() {
    $$("[data-fit]").forEach(el => {
      // Measure the section that holds the word, never the word's own (stretchable) box
      const box = el.closest(".hero-band, .herd-col, .foot") || el.parentElement;
      const cs = getComputedStyle(box);
      const room = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.classList.toggle("is-stacked", phone.matches);
      el.style.fontSize = "100px";
      const width = el.getBoundingClientRect().width;
      el.style.fontSize = Math.min(phone.matches ? 220 : 320, Math.floor((100 * room) / width * 0.985)) + "px";
    });
    // The address: one line on a wide screen, two on a phone, the same size for both parts
    const mail = $(".email");
    if (mail) {
      const room = mail.parentElement.clientWidth - parseFloat(getComputedStyle(mail.parentElement).paddingLeft) * 2;
      mail.style.fontSize = "100px";
      const parts = $$("span", mail).map(s => s.getBoundingClientRect().width);
      const width = phone.matches ? Math.max(...parts) : parts.reduce((a, b) => a + b, 0);
      mail.style.fontSize = Math.floor((100 * room) / width * 0.98) + "px";
    }
    const spread = $(".spread p");
    if (spread) {
      spread.style.fontSize = "100px";
      const room = spread.clientWidth;
      const need = Math.max(...$$(".line", spread).map(l => {
        const parts = $$(":scope > span", l);
        return parts.reduce((a, s) => a + s.getBoundingClientRect().width, 0) + (parts.length - 1) * 30;
      }));
      spread.style.fontSize = Math.min(phone.matches ? 64 : 150, Math.floor((100 * room) / need)) + "px";
    }
    level();
  }

  // ---------- Island time ----------
  function islandParts(date = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(date).map(x => [x.type, x.value]));
    return { key: `${p.year}-${p.month}-${p.day}`, mins: +p.hour * 60 + +p.minute };
  }
  // Winter hours (afternoon ride at 3 pm) while the islands are on standard time, UTC-5
  function isWinter(key) {
    const [y, m, d] = key.split("-").map(Number);
    const off = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "shortOffset" })
      .formatToParts(new Date(Date.UTC(y, m - 1, d, 17))).find(x => x.type === "timeZoneName").value;
    return off === "GMT-5";
  }
  const clock = m => {
    m = Math.round(m) % 1440;
    const h = Math.floor(m / 60), min = m % 60, h12 = ((h + 11) % 12) + 1;
    if (h === 12 && !min) return "noon";
    return `${h12}${min ? ":" + String(min).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}`;
  };
  const dayInfo = key => {
    const [y, m, d] = key.split("-").map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    return { wd, name: DAYS[wd], short: DAYS[wd].slice(0, 3), d, month: MONTHS[m - 1], long: `${DAYS[wd]} ${d} ${MONTHS[m - 1]}` };
  };
  // When each ride is down on the beach, in minutes after midnight
  const rideWindows = key => {
    const pm = isWinter(key) ? 900 : 930;
    return {
      morning: { start: 570, beach: [600, 675], label: "Morning, 9:30 am" },
      afternoon: { start: pm, beach: [pm + 30, pm + 105], label: `Afternoon, ${clock(pm)}` },
    };
  };

  // ---------- Tide data ----------
  let tide = null; // { keys: [...], hours: [values...], start: key }
  const at = h => { // sea level at fractional hour h from the start of the data (Catmull-Rom)
    const v = tide.hours, i = Math.floor(h), t = h - i;
    const p0 = v[Math.max(0, i - 1)], p1 = v[i], p2 = v[Math.min(v.length - 1, i + 1)], p3 = v[Math.min(v.length - 1, i + 2)];
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
  };
  const dayIndex = key => tide.keys.indexOf(key);
  // Lows and highs of one day, found every five minutes
  function turns(key) {
    const base = dayIndex(key) * 24, out = [];
    let prev = at(base - 1 / 12 < 0 ? 0 : base - 1 / 12), cur = at(base);
    for (let m = 5; m <= 1440; m += 5) {
      const next = at(base + m / 60);
      if (cur < prev && cur <= next) out.push({ kind: "low", mins: m - 5, v: cur });
      if (cur > prev && cur >= next) out.push({ kind: "high", mins: m - 5, v: cur });
      prev = cur; cur = next;
    }
    return out.filter(t => t.mins > 0 && t.mins < 1440);
  }

  // ---------- The water on the name ----------
  let waterN = null; // 0 = lowest of the day, 1 = highest
  function level() {
    const mark = $("[data-mark]");
    if (!mark) return;
    const dry = $(".mark-dry [data-fit]", mark);
    const fs = parseFloat(dry.style.fontSize) || 100;
    const pad = parseFloat(getComputedStyle(mark).paddingBottom);
    const lines = phone.matches ? 2 : 1;
    const capTop = mark.clientHeight - pad - fs * 0.86 * (lines - 1) - fs * 0.76;
    const n = waterN == null ? 0.45 : waterN;
    // From a quarter of the bottom line's letters at low water to two thirds at high water
    const cover = fs * 0.72 * (0.22 + 0.46 * n);
    const y = mark.clientHeight - pad - fs * 0.05 - cover;
    mark.style.setProperty("--dry", Math.max(capTop, y) + "px");
  }
  function heroTide() {
    const now = islandParts();
    const i = dayIndex(now.key);
    if (i < 0) return;
    const h = i * 24 + now.mins / 60;
    const vals = [];
    for (let k = -12; k <= 12; k += 0.25) vals.push(at(Math.max(0, h + k)));
    const lo = Math.min(...vals), hi = Math.max(...vals), v = at(h);
    waterN = hi > lo ? (v - lo) / (hi - lo) : 0.5;
    level();
    const rising = at(h + 0.25) > v;
    // Next low or high after now
    let next = null;
    for (const key of tide.keys.slice(i, i + 2)) {
      const day = dayIndex(key) - i;
      const t = turns(key).find(t => day > 0 || t.mins > now.mins);
      if (t) { next = { ...t, tomorrow: day > 0 }; break; }
    }
    const say = $("[data-hero-tide]");
    if (say && next) {
      say.textContent = `The water on our name is Long Bay right now: the tide is ${rising ? "rising" : "falling"}, ${next.kind} tide ${next.tomorrow ? "tomorrow " : ""}at ${clock(next.mins)}.`;
    }
  }

  // ---------- Planner: days, chart, verdict ----------
  const strip = $("[data-days]");
  let chosen = null;
  function bestRide(key) {
    const lows = turns(key).filter(t => t.kind === "low");
    const w = rideWindows(key);
    let best = null;
    for (const name of ["morning", "afternoon"]) {
      const [a, b] = w[name].beach, mid = (a + b) / 2;
      for (const l of lows) {
        const gap = l.mins < a ? a - l.mins : l.mins > b ? l.mins - b : 0;
        if (!best || gap < best.gap || (gap === best.gap && Math.abs(l.mins - mid) < Math.abs(best.low.mins - mid))) best = { name, gap, low: l };
      }
    }
    return { lows, best, meets: best && best.gap <= 45, w };
  }
  function buildDays(keys) {
    strip.innerHTML = "";
    strip.style.setProperty("--n", keys.length);
    keys.forEach(key => {
      const d = dayInfo(key);
      let note = ["", ""];
      if (d.wd === 0) note = ["Rest day", "Rest"];
      else if (d.wd === 6) note = ["Lessons", "Kids"];
      else if (tide) {
        const r = bestRide(key);
        note = r.meets ? (r.best.name === "morning" ? ["Low am", "am"] : ["Low pm", "pm"]) : ["Mid tide", "mid"];
      }
      const label = document.createElement("label");
      label.className = "day" + (d.wd === 0 || d.wd === 6 ? " is-off" : "");
      label.innerHTML = `<input type="radio" name="day" value="${key}"><span>${d.short}<b>${d.d}</b><small><span class="n-long">${note[0]}</span><span class="n-short">${note[1]}</span></small></span>`;
      strip.append(label);
    });
    $$('input[name="day"]', strip).forEach(r => r.addEventListener("change", () => choose(r.value)));
    // Start on the next weekday
    const first = keys.find(k => ![0, 6].includes(dayInfo(k).wd)) || keys[0];
    const r = $(`input[value="${first}"]`, strip);
    if (r) { r.checked = true; choose(first, true); }
  }
  function choose(key, quiet) {
    chosen = key;
    const d = dayInfo(key);
    const verdict = $("[data-verdict]");
    const w = rideWindows(key);
    $('[data-time-label="afternoon"]').textContent = w.afternoon.label;
    $$(".best").forEach(b => b.remove());
    if (!tide) {
      verdict.textContent = `${d.long}. The tide forecast didn't load, so ask for either ride and the guides will tell you which meets low water.`;
      compose();
      return;
    }
    const r = bestRide(key);
    const lows = r.lows.map(l => clock(l.mins));
    const lowText = lows.length > 1 ? `${lows.slice(0, -1).join(", ")} and ${lows.at(-1)}` : lows[0];
    let text;
    if (d.wd === 0) text = `${d.long}: Sunday is the horses' day off. Low tide is at ${lowText}.`;
    else if (d.wd === 6) text = `${d.long}: Saturday mornings are for the local children's lessons, so private rides only by special request. Low tide is at ${lowText}.`;
    else if (r.meets) text = `${d.long}: low tide at ${clock(r.best.low.mins)}, while the ${r.best.name} ride is on the beach. Ask for the ${r.best.name} ride if you'd like to canter.`;
    else text = `${d.long}: low tide at ${lowText}, away from both rides. The ${r.best.name} ride comes closest. You'll still ride into the sea.`;
    verdict.textContent = text;
    if (r.best && d.wd !== 0) {
      const radio = $(`input[name="time"][value="${r.best.name}"]`);
      if (radio) radio.checked = true;
      const span = $(`[data-time-label="${r.best.name}"]`);
      if (span && r.meets) span.insertAdjacentHTML("beforeend", ' <span class="best">closest to low tide</span>');
    }
    draw(key, r);
    compose();
  }
  function draw(key, r) {
    const svg = $("[data-chart-svg]");
    if (!svg) return;
    const W = Math.max(300, Math.round(svg.getBoundingClientRect().width)), H = phone.matches ? 220 : 260;
    const top = 34, bottom = H - 30, x0 = 6 * 60, x1 = 20 * 60;
    const lo = Math.min(...tide.hours) - 0.05, hi = Math.max(...tide.hours) + 0.05;
    const X = m => ((m - x0) / (x1 - x0)) * W;
    const Y = v => bottom - ((v - lo) / (hi - lo)) * (bottom - top);
    const base = dayIndex(key) * 24;
    let line = "";
    for (let m = x0; m <= x1; m += 10) line += `${m === x0 ? "M" : "L"}${X(m).toFixed(1)} ${Y(at(base + m / 60)).toFixed(1)} `;
    const area = `${line}L${W} ${bottom} L0 ${bottom} Z`;
    const bands = ["morning", "afternoon"].map(n => {
      const [a, b] = r.w[n].beach;
      const lx = X(a), bw = X(b) - X(a);
      const lab = W < 520 ? (n === "morning" ? "Morning" : "Afternoon") : (n === "morning" ? "Morning ride" : "Afternoon ride");
      return `<rect class="c-band" x="${lx}" y="0" width="${bw}" height="${bottom}"/><text class="c-band-label" x="${lx + 6}" y="18">${lab}</text>`;
    }).join("");
    const hours = [6, 8, 10, 12, 14, 16, 18, 20].filter((h, i) => W >= 520 || i % 2 === 0).map(h => {
      const x = X(h * 60), anchor = h === 6 ? "start" : h === 20 ? "end" : "middle";
      return `<text class="c-hour" x="${x}" y="${H - 8}" text-anchor="${anchor}">${clock(h * 60)}</text>`;
    }).join("");
    const dots = r.lows.filter(l => l.mins >= x0 && l.mins <= x1).map(l => {
      const x = X(l.mins), y = Y(l.v);
      const anchor = x < 70 ? "start" : x > W - 70 ? "end" : "middle";
      return `<circle class="c-dot" cx="${x}" cy="${y}" r="5"/><text class="c-dot-label" x="${x}" y="${y + 24}" text-anchor="${anchor}">Low ${clock(l.mins)}</text>`;
    }).join("");
    const title = $("[data-chart-title]").outerHTML;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.innerHTML = `${title}${bands}<path class="c-area" d="${area}"/><path class="c-line" d="${line}"/><line class="c-base" x1="0" x2="${W}" y1="${bottom}" y2="${bottom}"/>${dots}${hours}`;
    const highs = r.lows.length ? turns(key).filter(t => t.kind === "high").map(t => clock(t.mins)) : [];
    $("[data-chart-title]").textContent = `Tide at Long Bay on ${dayInfo(key).long}: low at ${r.lows.map(l => clock(l.mins)).join(" and ")}${highs.length ? `, high at ${highs.join(" and ")}` : ""}.`;
  }

  // ---------- The ride request ----------
  const form = $("[data-ask]");
  const list = $("[data-riders]");
  const template = list.firstElementChild.cloneNode(true);
  function compose() {
    const val = n => (form.querySelector(`[name="${n}"]:checked`) || {}).value;
    const riders = $$("[data-rider]", list);
    const lines = [];
    let issue = "";
    riders.forEach((li, i) => {
      const w = +$('[name="weight"]', li).value, lvl = $('[name="level"]', li).value, age = +$('[name="age"]', li).value;
      const msg = $("[data-rider-msg]", li), wIn = $('[name="weight"]', li), aIn = $('[name="age"]', li);
      let m = "";
      if (w > 215) m = "Our biggest horse carries up to 215 lb, so we can't take this rider.";
      else if (age && age < 7) m = "Riders must be 7 or older.";
      else if (age && age < 12) m = "Under 12 rides with an adult on the same ride.";
      msg.textContent = m;
      wIn.setAttribute("aria-invalid", String(w > 215));
      aIn.setAttribute("aria-invalid", String(!!age && age < 7));
      if ((w > 215 || (age && age < 7)) && !issue) issue = `Rider ${i + 1} can't ride: ${w > 215 ? "over 215 lb" : "under 7"}.`;
      lines.push(`- Rider ${i + 1}: ${w ? w + " lb" : "weight to confirm"}, ${lvl}${age ? `, age ${age}` : ""}`);
    });
    $("[data-drop-rider]").hidden = riders.length < 2;
    const d = chosen ? dayInfo(chosen) : null;
    const time = val("time") === "afternoon" ? rideWindows(chosen || islandParts().key).afternoon.label : "Morning, 9:30 am";
    const ride = val("ride"), pickup = val("pickup");
    const name = $('[name="name"]', form).value.trim(), stay = $('[name="stay"]', form).value.trim();
    const dayText = d ? d.long : "(our dates)";
    const body = [
      "Hi Provo Ponies!", "", "We'd like to ask for a ride at Long Bay.", "",
      `Day: ${dayText}`, `Ride: ${ride}`, `Time: ${time}`, `Riders: ${riders.length}`, ...lines,
      `Getting there: ${pickup}`, stay ? `Staying at: ${stay}` : "", "", name ? `Thanks,\n${name}` : "Thanks!",
    ].filter((l, i, a) => l !== "" || a[i - 1] !== "").join("\n");
    $("[data-mail]").href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Ride request for ${dayText}`)}&body=${encodeURIComponent(body)}`;
    $("[data-wa]").href = `https://wa.me/${PHONE}?text=${encodeURIComponent(body)}`;
    const rideShort = ride.split(" (")[0].toLowerCase();
    // Only touch the live summary when it really changes, so screen readers don't repeat it on every key
    const sum = issue || `${d ? d.long + ", " : ""}${time.toLowerCase()}: ${rideShort} for ${riders.length} ${riders.length === 1 ? "rider" : "riders"}.`;
    const out = $("[data-ask-sum]");
    if (out.textContent !== sum) out.textContent = sum;
  }
  form.addEventListener("input", compose);
  form.addEventListener("change", compose);
  $("[data-add-rider]").addEventListener("click", () => {
    if (list.children.length >= 10) return;
    const li = template.cloneNode(true);
    $$("input", li).forEach(i => (i.value = ""));
    list.append(li);
    $('[name="weight"]', li).focus();
    compose();
  });
  $("[data-drop-rider]").addEventListener("click", () => {
    if (list.children.length > 1) list.lastElementChild.remove();
    $("[data-add-rider]").focus();
    compose();
  });

  // ---------- Rides: tabs ----------
  const tabs = $$('[role="tab"]');
  function pick(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(t));
    t.addEventListener("keydown", e => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (k) { e.preventDefault(); pick(tabs[(i + k + tabs.length) % tabs.length], true); }
      if (e.key === "Home") { e.preventDefault(); pick(tabs[0], true); }
      if (e.key === "End") { e.preventDefault(); pick(tabs.at(-1), true); }
    });
  });

  // ---------- The ride: one stage open at a time ----------
  const stages = $$("[data-stage]");
  stages.forEach(st => $("[data-stage-btn]", st).addEventListener("click", () => {
    stages.forEach(o => {
      const on = o === st;
      o.classList.toggle("is-open", on);
      $("[data-stage-btn]", o).setAttribute("aria-expanded", String(on));
      $(".stage-body", o).hidden = !on;
    });
  }));

  // ---------- The names settle and arrive with the scroll ----------
  const mark = $("[data-mark]"), hero = $("[data-hero]"), footMark = $(".foot-mark");
  function settle() {
    if (still) return;
    if (mark && hero) {
      const r = hero.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.7)));
      mark.style.transform = `scale(${1 - k * 0.06})`;
    }
    if (footMark) {
      const r = footMark.getBoundingClientRect();
      const k = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * 0.6)));
      footMark.style.transform = `scale(${0.94 + k * 0.06})`;
    }
  }
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { settle(); ticking = false; });
  }, { passive: true });

  let rz, lastW = innerWidth;
  addEventListener("resize", () => {
    cancelAnimationFrame(rz);
    rz = requestAnimationFrame(() => {
      fit();
      if (tide && chosen && innerWidth !== lastW) choose(chosen, true);
      lastW = innerWidth;
    });
  });

  fit();
  if (document.fonts) {
    document.fonts.ready.then(fit);
    document.fonts.addEventListener?.("loadingdone", fit);
  }
  compose();

  // Load the tide; without it the planner still lists the days
  const fallbackKeys = () => {
    const out = [], start = islandParts();
    const [y, m, d] = start.key.split("-").map(Number);
    for (let i = 1; i <= 14; i++) {
      const t = new Date(y, m - 1, d + i);
      out.push(`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`);
    }
    return out;
  };
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), 9000);
  fetch(TIDE_URL, { signal: ctrl.signal })
    .then(r => (r.ok ? r.json() : Promise.reject(r.status)))
    .then(j => {
      const times = j.hourly.time, vals = j.hourly.sea_level_height_msl;
      const keys = [...new Set(times.map(t => t.slice(0, 10)))].filter(k => vals.slice(times.indexOf(k + "T00:00"), times.indexOf(k + "T00:00") + 24).every(v => v != null));
      tide = { keys, hours: vals.map(v => (v == null ? 0 : v)) };
      const today = islandParts().key;
      const from = Math.max(0, keys.indexOf(today) + 1);
      buildDays(keys.slice(from, from + 14));
      heroTide();
      setInterval(heroTide, 5 * 60 * 1000);
    })
    .catch(() => {
      $("[data-chart]").hidden = true;
      buildDays(fallbackKeys());
    });

  // ---------- Entrances: each section's parts, staggered, once ----------
  if (!still && "IntersectionObserver" in window) {
    const groups = [
      [".tide", ".tide-head h2, .tide-lead, .days, .chart, .verdict"],
      [".ask", ".ask h3, .ask-lead, .ask > fieldset, .ask > .field"],
      [".rides", ".rides-photo img, .tabs, .panels, .rides-small, .rides .cells"],
      [".ride", ".ride-intro h2, .ride-intro p, .stage"],
      [".herd", ".giant, .herd-lead, .bar, .herd-photo"],
      [".story", ".facts, .story-p, .story-word, .records ul, .story-photo"],
      [".reviews", ".spread .line, .spread-by, .score, .quotes blockquote, .leave"],
      [".faq", ".faq h2, .qs details"],
      [".contact", ".contact-say, .email, .contact-foot"],
      [".foot", ".foot-cols > div"],
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
    setTimeout(() => $$(".rv:not(.in)").forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight && r.bottom > 0) el.classList.add("in");
    }), 2500);
  }
})();
