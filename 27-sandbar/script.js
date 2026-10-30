// The Sandbar: what's on the board today, ship time, sunset tonight and the week, the coupon, and the name fitted to the board.
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TZ = "America/Grand_Turk";
  const LAT = 21.4612, LON = -71.1419; // Cockburn Town, Grand Turk
  const KITCHEN_OPEN = 12 * 60, KITCHEN_CLOSE = 15 * 60;
  const TAXI_AND_SPARE = 45;
  const EMAIL = "info@grandturk-mantahouse.com";
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---------- Time on Grand Turk ----------
  function parts(date) {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(date).map(x => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, min: (+p.hour % 24) * 60 + +p.minute };
  }
  const clock = min => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };
  const dayOf = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

  // Sunset for a calendar day (NOAA general solar position equations), minutes after local midnight
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

  let now = parts(new Date());
  let today = dayOf(now.y, now.m, now.d);
  const sunsetOn = date => sunset(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());

  // ---------- The board: what's happening today ----------
  const nowEl = $("[data-now]");
  function paintNow() {
    if (!nowEl) return;
    const dow = today.getUTCDay();
    const set = sunsetOn(today);
    let text, open = false;
    if (dow === 6) text = "Closed today, Saturday. Back tomorrow at noon.";
    else if (now.min < KITCHEN_OPEN) text = `Opens at noon. Kitchen until 3, drinks until sunset at ${clock(set)}.`;
    else if (now.min < KITCHEN_CLOSE) { open = true; text = `Kitchen open now until 3. Drinks until sunset at ${clock(set)}.`; }
    else if (now.min < set) { open = true; text = `Kitchen closed at 3. Drinks until sunset at ${clock(set)}.`; }
    else text = dow === 5 ? "Closed for the night. Saturday off, back Sunday at noon." : "Closed for the night. Back tomorrow at noon.";
    nowEl.textContent = text;
    nowEl.classList.toggle("is-open", open);
  }
  paintNow();

  // ---------- The name fills the board, whatever the font does ----------
  const name = $(".board-name span:last-child");
  function fitName() {
    if (!name) return;
    name.style.fontSize = "";
    const avail = name.parentElement.clientWidth;
    const w = name.scrollWidth;
    if (w > avail) name.style.fontSize = (parseFloat(getComputedStyle(name).fontSize) * avail / w * 0.98) + "px";
  }
  fitName();
  if (document.fonts) { document.fonts.ready.then(fitName); document.fonts.addEventListener?.("loadingdone", fitName); }
  if ("ResizeObserver" in window && name) new ResizeObserver(fitName).observe(name.parentElement);

  // ---------- Entrances ----------
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
    setTimeout(() => rv.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }), 2500);
  } else rv.forEach(el => el.classList.add("in"));

  // ---------- The clock over the photograph ----------
  const ticks = $(".clock-ticks");
  if (ticks) for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", 100 + 72 * Math.sin(a)); c.setAttribute("cy", 100 - 72 * Math.cos(a)); c.setAttribute("r", i % 3 ? 3 : 5);
    ticks.append(c);
  }
  const handH = $("[data-hand-h]"), handM = $("[data-hand-m]");
  function setClock(min) {
    if (!handH) return;
    handH.style.transform = `rotate(${((min / 60) % 12) * 30}deg)`;
    handM.style.transform = `rotate(${(min % 60) * 6}deg)`;
  }

  // ---------- Ship time / staying here / this week ----------
  const tabs = $$('.ship-tabs [role="tab"]');
  const pic = $("[data-ship-pic]");
  const PICS = {
    "t-ship": ["assets/ships.jpg", "Two cruise ships at the Grand Turk cruise pier"],
    "t-stay": ["assets/whale.jpg", "A humpback whale breaching"],
    "t-week": ["assets/seawall.jpg", "Clear water along the Cockburn Town sea wall"],
  };
  let active = "t-ship";
  function selectTab(tab, focus) {
    active = tab.id;
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      $("#" + t.getAttribute("aria-controls")).hidden = !on;
    });
    const [src, alt] = PICS[active];
    if (pic && pic.getAttribute("src") !== src) {
      pic.classList.add("is-swapping");
      setTimeout(() => { pic.src = src; pic.alt = alt; pic.classList.remove("is-swapping"); }, reduce ? 0 : 220);
    }
    $("[data-copied]").textContent = "";
    paintPlan();
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", e => {
      const n = { ArrowRight: (i + 1) % tabs.length, ArrowLeft: (i - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 }[e.key];
      if (n !== undefined) { e.preventDefault(); selectTab(tabs[n], true); }
    });
  });

  const daySel = $("[data-day]"), aboardSel = $("[data-aboard]"), arriveSel = $("[data-arrive]");
  const leaveEl = $("[data-leave]"), shipSay = $("[data-ship-say]");
  const KEY = "sb-plan";
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { /* storage blocked */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ aboard: aboardSel.value, arrive: arriveSel.value })); } catch (e) { /* storage blocked */ } };

  function fillTimes(sel, from, to, def) {
    for (let t = from; t <= to; t += 15) sel.add(new Option(clock(t), t));
    sel.value = String(def);
  }
  function fillDays() {
    daySel.textContent = "";
    for (let i = 0; i < 7; i++) {
      const d = new Date(today.getTime() + i * 864e5);
      const label = (i === 0 ? "Today, " : i === 1 ? "Tomorrow, " : "") + `${DAYS[d.getUTCDay()].slice(0, 3)} ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
      daySel.add(new Option(label, i));
    }
  }
  if (daySel) {
    fillDays();
    fillTimes(aboardSel, 13 * 60, 20 * 60, saved.aboard && +saved.aboard >= 780 ? +saved.aboard : 16 * 60 + 30);
    fillTimes(arriveSel, 9 * 60, 16 * 60, saved.arrive && +saved.arrive >= 540 ? +saved.arrive : 11 * 60 + 30);
    [daySel, aboardSel, arriveSel].forEach(s => s.addEventListener("change", () => { save(); paintPlan(); }));
  }

  const dur = m => { const h = Math.floor(m / 60), r = m % 60; return (h ? `${h} h` : "") + (h && r ? " " : "") + (r ? `${r} min` : ""); };
  let planText = "";

  function paintPlan() {
    if (!daySel) return;
    if (active === "t-ship") {
      const d = new Date(today.getTime() + +daySel.value * 864e5);
      const dayName = DAYS[d.getUTCDay()];
      const aboard = +aboardSel.value, arrive = +arriveSel.value;
      const leave = aboard - TAXI_AND_SPARE;
      const set = sunsetOn(d);
      const close = Math.min(leave, set);
      let big, say;
      if (d.getUTCDay() === 6) {
        big = "Closed Saturday";
        say = "The Sandbar rests on Saturdays. The beach in Cockburn Town is still there for a swim, and the bar is back Sunday at noon.";
        planText = `The Sandbar is closed on Saturdays.`;
        setClock(KITCHEN_OPEN);
      } else if (close - arrive < 30) {
        big = "Too tight";
        say = `With all aboard at ${clock(aboard)}, you'd need to leave by ${clock(leave)}. Stay close to the ship this time, and come back on your next visit.`;
        planText = `All aboard ${clock(aboard)}: too tight for the Sandbar.`;
        setClock(leave);
      } else {
        big = `Leave by ${clock(close)}`;
        const parts2 = [];
        const start = Math.max(arrive, KITCHEN_OPEN);
        parts2.push(`That's ${dur(close - arrive)} on the beach at the Sandbar.`);
        if (arrive < KITCHEN_OPEN) parts2.push("It opens at noon, so swim first.");
        const orderBy = Math.min(KITCHEN_CLOSE, close) - 15;
        if (orderBy >= start) parts2.push(`Order food by ${clock(orderBy)}${KITCHEN_CLOSE <= close ? ": the kitchen closes at 3." : "."}`);
        else parts2.push("The kitchen will have closed, so it's cold drinks and the beach.");
        if (close === set && set < leave) parts2.push(`The bar closes at sunset, ${clock(set)}.`);
        say = parts2.join(" ");
        planText = `Sandbar plan for ${dayName}: arrive ${clock(arrive)}, ${orderBy >= start ? "order food by " + clock(orderBy) + ", " : ""}leave by ${clock(close)} for all aboard at ${clock(aboard)}. The Sandbar, Duke Street, Cockburn Town. 649 243 2666.`;
        setClock(close);
      }
      leaveEl.textContent = big;
      shipSay.textContent = say;
    } else if (active === "t-stay") {
      const set = sunsetOn(today);
      const whales = now.m >= 1 && now.m <= 4;
      $("[data-sunset-big]").textContent = clock(set);
      const sat = today.getUTCDay() === 6;
      $("[data-stay-say]").textContent = (sat
        ? "The Sandbar is closed today, Saturday, but the sunset still happens over the same water."
        : `The bar stays open until then: get a rum punch at about ${clock(set - 30)} and face west.`) +
        (whales ? " Humpbacks are passing Grand Turk now, so watch the water too." : " From January to April, watch the water for humpbacks too.");
      planText = `Sunset in Cockburn Town today: ${clock(set)}. The Sandbar pours until then (closed Saturdays).`;
      setClock(set);
    } else {
      const list = $("[data-week]");
      list.textContent = "";
      const lines = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today.getTime() + i * 864e5);
        const sat = d.getUTCDay() === 6;
        const set = sunsetOn(d);
        const li = document.createElement("li");
        if (sat) li.className = "is-closed";
        const label = i === 0 ? "Today" : i === 1 ? "Tomorrow" : DAYS[d.getUTCDay()];
        li.innerHTML = `<span class="w-day">${label}</span><span class="w-k">${sat ? "Closed" : "Kitchen 12 to 3, bar till sunset"}</span><span class="w-set" aria-label="Sunset ${clock(set)}">${clock(set)}</span>`;
        list.append(li);
        lines.push(`${label}: ${sat ? "closed" : "kitchen 12-3, sunset " + clock(set)}`);
      }
      planText = "The Sandbar this week. " + lines.join("; ") + ".";
      setClock(sunsetOn(today));
    }
  }
  paintPlan();

  const copyBtn = $("[data-copy]"), copied = $("[data-copied]");
  copyBtn?.addEventListener("click", async () => {
    let ok = false;
    try { await navigator.clipboard.writeText(planText); ok = true; } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = planText; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.append(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove();
    }
    copyBtn.dataset.copied = planText;
    copied.textContent = ok ? "Copied. Paste it in your notes or send it to your group." : "Couldn't copy here: " + planText;
  });

  // ---------- Coupon: private events by email ----------
  const coupon = $("[data-coupon]"), cMsg = $("[data-coupon-msg]");
  if (coupon) {
    const el = n => coupon.elements.namedItem(n);
    const iso = d => d.toISOString().slice(0, 10);
    el("date").min = iso(today);
    coupon.addEventListener("submit", e => {
      e.preventDefault();
      const who = el("name").value.trim(), date = el("date").value, size = parseInt(el("size").value, 10), note = el("note").value.trim();
      const fail = (m, f) => { cMsg.textContent = m; el(f).focus(); };
      if (!who) return fail("Add your name so they know who's asking.", "name");
      if (!date) return fail("Pick a date for the party.", "date");
      if (date < iso(today)) return fail("Pick a date from today on.", "date");
      if (!(size >= 1)) return fail("Say roughly how many guests are coming.", "size");
      const d = new Date(date + "T12:00:00Z");
      const day = `${DAYS[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
      const sat = d.getUTCDay() === 6 ? "\n\n(I know you're usually closed on Saturdays.)" : "";
      const body = `Hi Sandbar,\n\nWe'd like to hold a private event with you on ${day} for about ${size} guests.${note ? "\n\nWhat we have in mind: " + note : ""}${sat}\n\nName: ${who}\n\nThank you!`;
      const href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Private event on ${day}, ${size} guests`)}&body=${encodeURIComponent(body)}`;
      coupon.dataset.lastMail = href;
      cMsg.textContent = "Your email app should open with the request written.";
      location.href = href;
    });
    // On a phone the perforation runs across, between the two halves
    const perf = () => { if (innerWidth < 900) coupon.style.setProperty("--perf", ($(".coupon-say").offsetHeight / coupon.offsetHeight * 100) + "%"); };
    perf();
    addEventListener("resize", perf);
  }

  // ---------- Phone bar: away over the hero and the planner ----------
  const bar = $("[data-bar]");
  if (bar && "IntersectionObserver" in window) {
    bar.classList.add("is-away");
    bar.hidden = false;
    const vis = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => vis.set(e.target, e.isIntersecting));
      bar.classList.toggle("is-away", [...vis.values()].some(Boolean));
    });
    [$(".hero"), $("#ship"), $(".foot")].forEach(el => el && io.observe(el));
  }

  // Keep the day fresh if the page stays open
  setInterval(() => {
    now = parts(new Date());
    const t = dayOf(now.y, now.m, now.d);
    if (t.getTime() !== today.getTime()) { today = t; fillDays(); }
    paintNow();
    paintPlan();
  }, 60000);
})();
