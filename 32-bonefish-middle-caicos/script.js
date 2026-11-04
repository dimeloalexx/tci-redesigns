// Bonefish Middle Caicos: the header that takes each chapter's colours, the hero waterline sized to the screen,
// "Ten o'clock, forty feet" (the guide calls a fish, you lead it with the fly), the catch log, the day planner
// and the contact lines fitted to the width.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = n => "$" + Math.round(n).toLocaleString("en-US");
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- header: slides up as the concept strip scrolls away, then takes the colours of the chapter beneath ---------- */
  const top = $("[data-top]");
  const chapters = $$("main > section, body > footer.end");
  let under = null, queued = false;
  const paint = () => {
    queued = false;
    const off = Math.max(0, 28 - scrollY);
    top.style.setProperty("--off", off + "px");
    const y = off + top.offsetHeight / 2;
    const now = chapters.find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }) || chapters[0];
    if (now && now !== under) {
      under = now;
      const cs = getComputedStyle(now);
      top.style.setProperty("--hdr-bg", cs.backgroundColor);
      top.style.setProperty("--hdr-ink", cs.color);
    }
  };
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);
  paint();

  const menu = $("[data-menu]");
  const closeMenu = () => { menu.setAttribute("aria-expanded", "false"); top.classList.remove("is-open"); };
  menu.addEventListener("click", () => {
    const open = menu.getAttribute("aria-expanded") !== "true";
    menu.setAttribute("aria-expanded", String(open));
    top.classList.toggle("is-open", open);
  });
  $$("#nav a").forEach(a => a.addEventListener("click", closeMenu));
  addEventListener("keydown", e => { if (e.key === "Escape" && top.classList.contains("is-open")) { closeMenu(); menu.focus(); } });

  /* ---------- hero: the headline as large as the screen allows, never cut by an edge ---------- */
  const hero = $(".hero"), heroTitle = $(".hero-title");
  const fitHero = () => {
    if (!hero) return;
    const cs = getComputedStyle(hero);
    const k = parseFloat(cs.getPropertyValue("--k")) || 1.26;
    const sea = (parseFloat(cs.getPropertyValue("--sea")) || 52) / 100;
    const m = parseFloat(getComputedStyle(heroTitle).left) || 16;
    const avail = hero.clientWidth - 2 * m;
    hero.style.setProperty("--F", "100px");
    const w = Math.max(...$$(".ht-air .ht-line", hero).map(l => l.getBoundingClientRect().width));
    let F = 100 * avail * 0.97 / w;
    F = Math.min(F, (hero.clientHeight * sea - (top.offsetHeight + 44)) / k, 300);
    hero.style.setProperty("--F", Math.max(52, Math.floor(F)) + "px");
  };

  /* ---------- contact lines: fill the width, one line each ---------- */
  const fitLines = () => $$("[data-fit]").forEach(a => {
    const box = a.parentElement.clientWidth;
    a.style.fontSize = "100px";
    const parts = a.children.length ? [...a.children] : [a];
    const w = Math.max(...parts.map(p => p.getBoundingClientRect().width));
    a.style.fontSize = Math.min(100 * box * 0.985 / w, a.classList.contains("end-big") ? 260 : 170).toFixed(1) + "px";
  });

  const fitAll = () => { fitHero(); fitLines(); };
  fitAll();
  if (document.fonts) { document.fonts.ready.then(fitAll); document.fonts.addEventListener?.("loadingdone", fitAll); }
  let fitW = innerWidth, fitT = 0;
  addEventListener("resize", () => { if (innerWidth === fitW) return; fitW = innerWidth; clearTimeout(fitT); fitT = setTimeout(fitAll, 120); });

  /* ---------- the boat films: play only while on screen ---------- */
  const films = $$("video[data-loop]");
  if (reduce) films.forEach(v => { v.pause(); v.removeAttribute("autoplay"); if (v.closest(".boat-film")) v.controls = true; });
  else if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => {
      const v = e.target;
      if (e.isIntersecting) { if (v.preload === "none") v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
    }), { rootMargin: "160px 0px" });
    films.forEach(v => vio.observe(v));
  }

  /* ---------- entrances ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$(".reveal", e.target).forEach((el, i) => { el.style.setProperty("--d", Math.min(i, 6) * 80 + "ms"); el.classList.add("is-in"); });
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    chapters.forEach(s => io.observe(s));
  } else $$(".reveal").forEach(el => el.classList.add("is-in"));

  /* ---------- the log: every catch opens at size ---------- */
  const CATCH = [
    ["assets/own-10lb-craig.jpg", "Craig kneeling in the water with a 10 lb bonefish", "10 lb bonefish caught by Craig, 6 January 2026"],
    ["assets/own-9lb-east-caicos.jpg", "An angler in a sun hood kneeling in pale water with a 9 lb bonefish", "9 lb bonefish on uninhabited East Caicos, 14 July 2023"],
    ["assets/own-38lb-cuda-bob-risica.jpg", "Bob Risica holding a long barracuda in shallow water, a Chiquita behind him", "Bob Risica with a 38 lb barracuda, East Caicos, 5 May 2024"],
    ["assets/own-34lb-cuda-sand-dollar.jpg", "An angler holding up a barracuda on a sandy flat", "34 lb barracuda on Sand Dollar Flat, Middle Caicos, on a topwater popper plug"],
    ["assets/own-32lb-cuda-john-gill.jpg", "John Gill holding a barracuda in front of the mangroves", "John Gill with a 32 lb barracuda, 9 May 2024"],
    ["assets/own-5lb-east-caicos-april.jpg", "An angler in a sun hood holding a bonefish", "5 lb bonefish, East Caicos, 27 April 2024"],
    ["assets/own-bob-risica-bonefish.jpg", "Bob Risica kneeling in the water with a bonefish", "Bob Risica at the end of Middle Caicos with a bonefish, 4 May 2024"],
    ["assets/own-5lb-east-caicos-may.jpg", "One angler standing and one kneeling with a bonefish on a wide flat", "5 lb bonefish on East Caicos, 8 May 2024"],
    ["assets/own-20lb-cuda-teeth.jpg", "A barracuda's open jaw held up to the camera", "20 lb barracuda, East Caicos, February 2024"],
  ];
  const view = $("[data-view]"), vImg = $("[data-view-img]"), vCap = $("[data-view-cap]");
  const viewer = $("[data-viewer]"), wImg = $("[data-viewer-img]"), wCap = $("[data-viewer-cap]");
  const wide = matchMedia("(min-width: 900px)");
  const entries = $$("[data-entry]");
  const pick = i => entries.forEach(a => a.setAttribute("aria-current", String(Number(a.dataset.entry) === i)));
  const showSide = i => {
    const [src, alt, cap] = CATCH[i];
    if (vImg.getAttribute("src") === src) return;
    view.classList.add("is-swap");
    const img = new Image();
    img.src = src;
    const swap = () => { vImg.src = src; vImg.alt = alt; vCap.textContent = cap; requestAnimationFrame(() => view.classList.remove("is-swap")); };
    (img.decode ? img.decode() : Promise.resolve()).then(swap, swap);
  };
  entries.forEach(a => {
    const i = Number(a.dataset.entry);
    a.addEventListener("click", e => {
      e.preventDefault();
      pick(i);
      if (wide.matches) { showSide(i); return; }
      const [src, alt, cap] = CATCH[i];
      wImg.src = src; wImg.alt = alt; wCap.textContent = cap;
      if (viewer.showModal) viewer.showModal(); else location.href = src;
    });
    a.addEventListener("mouseenter", () => { if (wide.matches) { pick(i); showSide(i); } });
    a.addEventListener("focus", () => { if (wide.matches) { pick(i); showSide(i); } });
  });
  pick(0);
  $("[data-viewer-close]").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", e => { if (e.target === viewer) viewer.close(); });

  /* ---------- plan the day: ferry, dock, flats and the cost ---------- */
  const form = $("[data-plan]");
  if (form) {
    const RATE = 950, TAX = 0.12, FERRY = 65;
    const state = { date: "", days: 1, anglers: 2, launch: "bellefield", from: "provo" };
    try { Object.assign(state, JSON.parse(localStorage.getItem("bf-plan") || "{}")); } catch {}
    const save = () => { try { localStorage.setItem("bf-plan", JSON.stringify(state)); } catch {} };
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const dateIn = form.elements.date;
    dateIn.min = iso(today);
    if (!state.date || new Date(state.date + "T12:00:00") < today) {
      const d = new Date(today); d.setDate(d.getDate() + 21);
      if (d.getDay() === 0) d.setDate(d.getDate() + 1);
      state.date = iso(d);
    }
    dateIn.value = state.date;
    ["days", "anglers", "launch", "from"].forEach(n => { const r = form.querySelector(`input[name="${n}"][value="${state[n]}"]`); if (r) r.checked = true; });
    const err = $("[data-date-err]"), msg = $("[data-send-msg]");
    const long = d => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

    const sheet = () => {
      const d = state.date ? new Date(state.date + "T12:00:00") : null;
      const sunday = d && d.getDay() === 0;
      const month = d ? d.getMonth() + 1 : 0;
      const provo = state.from === "provo", lorimers = state.launch === "lorimers";
      const times = [];
      if (provo) {
        times.push([sunday ? "8:00am" : "7:30am", sunday ? "First Sunday ferry from Leeward, Providenciales" : "Ferry from Leeward, Providenciales"]);
        times.push([sunday ? "8:30am" : "8:00am", "Bellefield Landing, North Caicos: your captain meets you off the ferry, boat moored alongside"]);
        times.push(lorimers ? ["", "A 45-minute run to the launch at Lorimer’s, at the far end of Middle Caicos, then the flats toward uninhabited East Caicos"]
                            : ["", "Fishing the creeks of the North Caicos south shore within 20 minutes"]);
      } else {
        times.push(["8:00am", lorimers ? "Meet your captain at Lorimer’s, at the far end of Middle Caicos" : "Meet your captain at Bellefield Landing, North Caicos"]);
        times.push(["", lorimers ? "Out to the flats between Middle and uninhabited East Caicos" : "Fishing the creeks of the North Caicos south shore"]);
      }
      times.push(["4:00pm", "Back at the dock"]);
      if (provo) times.push(["4:30pm", month >= 4 && month <= 8 ? "Ferry back to Provo (from April to August there is also a 5:00 and a 5:30)" : "Ferry back to Provo"]);
      const guide = RATE * state.days, tax = guide * TAX, total = guide + tax;
      const rows = [
        [`Guide and boat, ${state.days} ${state.days > 1 ? "days" : "day"}`, money(guide)],
        ["Turks and Caicos tax, 12%", money(tax)],
        ["Total", money(total), true],
        ["Deposit to confirm, 50%", money(total / 2)],
      ];
      if (provo) rows.push([`Ferry, ${state.anglers} × $${FERRY} round trip${state.days > 1 ? ` × ${state.days} days` : ""}, no reservation needed`, money(FERRY * state.anglers * state.days)]);
      const notes = [
        state.anglers === 1 ? "The day rate is per boat, for one or two anglers." : "Up to two anglers on each boat.",
        "Everyone 16 and over needs a Turks and Caicos fishing licence.",
        "Bottled water is on board. Bring your lunch and soft drinks.",
      ];
      if (provo && state.days > 1) notes.push("Fishing two or three days? Stay on North or Middle Caicos and skip the ferry each morning. Ask us where.");
      if (sunday) notes.push("Sundays and holidays the first ferry leaves at 8:00am, so the day starts half an hour later.");
      return { d, times, rows, notes };
    };

    const render = () => {
      const s = sheet();
      $("[data-sheet-date]").textContent = s.d ? `${s.d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${state.days > 1 ? `, ${state.days} days` : ""}` : "Your day on the flats";
      $("[data-sheet-times]").innerHTML = s.times.map(([t, x]) => `<li><b>${t}</b><span>${x}</span></li>`).join("");
      $("[data-sheet-money]").innerHTML = s.rows.map(([k, v, tot]) => `<dt${tot ? ' class="tot"' : ""}>${k}</dt><dd${tot ? ' class="tot"' : ""}>${v}</dd>`).join("");
      $("[data-sheet-notes]").innerHTML = s.notes.map(n => `<li>${n}</li>`).join("");
    };

    form.addEventListener("change", e => {
      const t = e.target;
      if (t.name === "date") { state.date = t.value; if (t.value) err.hidden = true; }
      else if (t.name) state[t.name] = ["days", "anglers"].includes(t.name) ? Number(t.value) : t.value;
      save(); render();
    });
    dateIn.addEventListener("input", () => { state.date = dateIn.value; if (dateIn.value) err.hidden = true; save(); render(); });
    render();

    $("[data-send]").addEventListener("click", () => {
      if (!state.date) { err.hidden = false; dateIn.focus(); msg.textContent = ""; return; }
      const d = new Date(state.date + "T12:00:00");
      const body = [
        "Hello,", "",
        "We would like to book a guided bonefishing day.", "",
        `First day: ${long(d)}`,
        `Days: ${state.days}`,
        `Anglers: ${state.anglers}`,
        `Fishing from: ${state.launch === "lorimers" ? "Lorimer's, Middle Caicos" : "Bellefield Landing, North Caicos"}`,
        `Staying on: ${state.from === "provo" ? "Providenciales (coming over on the ferry)" : "North or Middle Caicos"}`, "",
        "Names:", "Fly or spinning tackle:", "Anything else you should know:", "",
        "Thank you!",
      ].join("\n");
      const href = `mailto:info@bonefishmiddlecaicos.com?subject=${encodeURIComponent(`Bonefishing request: ${long(d)}`)}&body=${encodeURIComponent(body)}`;
      $("[data-send]").dataset.lastMail = href;
      msg.textContent = "Opening your email app with the request for info@bonefishmiddlecaicos.com.";
      location.href = href;
    });
  }

  /* ---------- Ten o'clock, forty feet ---------- */
  const stage = $("[data-stage]");
  if (stage) {
    const svg = $("[data-svg]", stage);
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
    const callEl = $("[data-call]", stage), tallyEl = $("[data-tally]", stage), sayEl = $("[data-say]", stage);
    const panel = $("[data-panel]", stage), panelText = $("[data-panel-text]", stage), startBtn = $("[data-start]", stage), realBtn = $("[data-real]", stage);
    const HOUR = { "-2": "Ten", "-1": "Eleven", "0": "Twelve", "1": "One", "2": "Two" };
    const FEET = { 30: "thirty", 40: "forty", 50: "fifty", 60: "sixty" };
    const ROUND = 3, TIP = 3.2, TAU = Math.PI * 2;   // the rod tip is 3 ft off the bow
    let L = 7;   // the fish is drawn about 65 px long, larger than life, so it reads on a phone

    const defs = mk("defs", {}, svg);
    const soft = mk("filter", { id: "bf-soft", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
    mk("feGaussianBlur", { stdDeviation: "0.45" }, soft);
    const gStatic = mk("g", {}, svg);
    const gDyn = mk("g", {}, svg);
    const shade = mk("path", { class: "fish-shade", filter: "url(#bf-soft)" }, gDyn);
    const fishG = mk("g", {}, gDyn);
    const body = mk("path", { class: "fish-body" }, fishG);
    const spine = mk("path", { class: "fish-line" }, fishG);
    const eyes = [mk("circle", { class: "fish-eye" }, fishG), mk("circle", { class: "fish-eye" }, fishG)];
    const line = mk("path", { class: "fly-line" }, gDyn);
    const fly = mk("circle", { class: "fly" }, gDyn);
    const splash = mk("circle", { class: "splash" }, gDyn);
    const aim = mk("circle", { class: "aim" }, gDyn);
    const hide = (...n) => n.forEach(x => { x.style.display = "none"; });
    const show = (...n) => n.forEach(x => { x.style.display = ""; });
    hide(shade, fishG, line, fly, splash, aim);

    /* the bonefish, seen from above: a slim spindle that swims with a travelling wave, a forked tail and two pectorals */
    const PROFILE = [[0, 0], [0.04, 0.032], [0.1, 0.056], [0.2, 0.072], [0.3, 0.077], [0.42, 0.071], [0.55, 0.057], [0.68, 0.04], [0.8, 0.023], [0.9, 0.018], [1, 0.017]];
    const halfW = u => {
      for (let i = 1; i < PROFILE.length; i++) {
        const [u1, w1] = PROFILE[i], [u0, w0] = PROFILE[i - 1];
        if (u <= u1) return (w0 + (w1 - w0) * (u - u0) / (u1 - u0)) * L;
      }
      return PROFILE[PROFILE.length - 1][1] * L;
    };
    const N = 16;
    const f2 = n => n.toFixed(3);
    const shape = (phase, amp) => {
      const LB = 0.84 * L, pts = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, a = amp * (0.004 + 0.05 * Math.pow(u, 2.6)) * L;
        pts.push([-u * LB, a * Math.sin(TAU * u / 1.1 - phase)]);
      }
      const left = [], right = [], nrm = [];
      for (let i = 0; i <= N; i++) {
        const q = pts[Math.min(N, i + 1)], o = pts[Math.max(0, i - 1)];
        const dx = q[0] - o[0], dy = q[1] - o[1], len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len, w = halfW(i / N);
        nrm.push([nx, ny]);
        left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
        right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
      }
      const e = pts[N], f = pts[N - 1], ang = Math.atan2(e[1] - f[1], e[0] - f[0]);
      const at = (x, y) => [e[0] + x * Math.cos(ang) - y * Math.sin(ang), e[1] + x * Math.sin(ang) + y * Math.cos(ang)];
      const lobeA = at(0.17 * L, 0.082 * L), notch = at(0.075 * L, 0), lobeB = at(0.17 * L, -0.082 * L);
      let outline = `M${f2(pts[0][0])} ${f2(pts[0][1])}`;
      for (let i = 1; i <= N; i++) outline += `L${f2(left[i][0])} ${f2(left[i][1])}`;
      outline += `L${f2(lobeA[0])} ${f2(lobeA[1])}L${f2(notch[0])} ${f2(notch[1])}L${f2(lobeB[0])} ${f2(lobeB[1])}`;
      for (let i = N; i >= 1; i--) outline += `L${f2(right[i][0])} ${f2(right[i][1])}`;
      outline += "Z";
      let fins = "";
      const k = 4;
      [[left[k], nrm[k], 1], [right[k], nrm[k], -1]].forEach(([b, n, s]) => {
        const tip = [b[0] - 0.085 * L + n[0] * s * 0.034 * L, b[1] + n[1] * s * 0.034 * L];
        fins += `M${f2(b[0])} ${f2(b[1])}Q${f2(b[0] - 0.03 * L + n[0] * s * 0.03 * L)} ${f2(b[1] + n[1] * s * 0.03 * L)} ${f2(tip[0])} ${f2(tip[1])}L${f2(b[0] - 0.055 * L)} ${f2(b[1])}Z`;
      });
      let sp = `M${f2(pts[2][0])} ${f2(pts[2][1])}`;
      for (let i = 3; i <= 11; i++) sp += `L${f2(pts[i][0])} ${f2(pts[i][1])}`;
      const ew = halfW(1.25 / N) * 0.5, ex = -0.07 * L;
      return { outline, body: outline + fins, spine: sp, eyes: [[ex, pts[1][1] + nrm[1][1] * ew], [ex, pts[1][1] - nrm[1][1] * ew]] };
    };

    /* geometry: feet on the flat. The angler stands at 0,0 looking up the screen; svg y = -forward */
    let g = null, px = 0.1;
    const layout = () => {
      const W = stage.clientWidth, H = stage.clientHeight;
      if (!W || !H) return;
      const hud = W > 600 ? 72 : 92;   // the call and the tally sit in a band above the flat
      const Yb = 6, Yf = W > H ? 64 : 52, s = (H - hud) / (Yf + Yb), X = W / 2 / s, Yt = Yf + hud / s;
      g = { W, H, s, X, Yf, Yb }; px = 1 / s;
      L = clamp(66 * px, 6, 9.5);
      svg.setAttribute("viewBox", `${f2(-X)} ${f2(-Yt)} ${f2(2 * X)} ${f2(Yt + Yb)}`);
      drawStatic();
      line.style.strokeWidth = 2.6 * px;
      fly.setAttribute("r", 5 * px); fly.style.strokeWidth = 1.6 * px;
      splash.style.strokeWidth = 2 * px;
      aim.setAttribute("r", 13 * px); aim.style.strokeWidth = 2 * px;
      spine.style.strokeWidth = 0.032 * L;
      body.style.strokeWidth = 0.018 * L;
      eyes.forEach(e => e.setAttribute("r", 0.011 * L));
    };
    const drawStatic = () => {
      gStatic.textContent = "";
      const { X, Yf } = g;
      [20, 40, 60].forEach(r => {
        if (r > Yf - 5) return;
        const a0 = r > X - 1 ? Math.asin((X - 1) / r) : Math.PI / 2;
        const x0 = -r * Math.sin(a0), y0 = -r * Math.cos(a0);
        mk("path", { class: "ring", d: `M${f2(x0)} ${f2(y0)} A${r} ${r} 0 0 1 ${f2(-x0)} ${f2(y0)}`, "stroke-width": f2(1.6 * px), "stroke-dasharray": `${f2(6 * px)} ${f2(7 * px)}` }, gStatic);
        const la = 0.2;
        mk("text", { class: "ring-label", x: f2(r * Math.sin(la) + 8 * px), y: f2(-r * Math.cos(la) - 4 * px), "font-size": f2(15 * px) }, gStatic).textContent = `${r} ft`;
      });
      for (let h = -3; h <= 3; h++) {
        const th = h * Math.PI / 6, sx = Math.sin(th), cy = Math.cos(th), inset = 24 * px;
        let r = Infinity;
        if (cy > 0.01) r = Math.min(r, (Yf - inset) / cy);
        if (Math.abs(sx) > 0.01) r = Math.min(r, (X - inset) / Math.abs(sx));
        const x = sx * r, y = Math.abs(h) === 3 ? -2.4 : -cy * r;
        mk("circle", { class: "hour-dot", cx: f2(x), cy: f2(y), r: f2(17 * px) }, gStatic);
        mk("text", { class: "hour-num", x: f2(x), y: f2(y), "font-size": f2(18 * px), "text-anchor": "middle", "dominant-baseline": "central" }, gStatic).textContent = String(h <= 0 ? 12 + h : h);
      }
      mk("path", { class: "bow-hull", d: "M0 -4.6C1.7 -3.7 3.2 -1.6 3.7 1.6L3.9 7L-3.9 7L-3.7 1.6C-3.2 -1.6 -1.7 -3.7 0 -4.6Z" }, gStatic);
      mk("path", { class: "bow-deck", d: "M0 -3.7C1.3 -2.9 2.5 -1.2 2.9 1.6L3 7L-3 7L-2.9 1.6C-2.5 -1.2 -1.3 -2.9 0 -3.7Z" }, gStatic);
    };

    /* game state */
    let fish = null, phase = "idle", count = 0, landed = 0, raf = 0, last = 0, cast = null, ring = null, keyAim = null, timers = [];
    const later = (ms, fn) => timers.push(setTimeout(fn, ms));
    const say = (text, hold = 2400) => {
      sayEl.textContent = text; sayEl.classList.add("is-on");
      clearTimeout(say.t); say.t = setTimeout(() => sayEl.classList.remove("is-on"), hold);
    };
    const setCall = text => { callEl.textContent = text; callEl.classList.remove("is-fresh"); void callEl.offsetWidth; callEl.classList.add("is-fresh"); };
    const setTally = () => { tallyEl.textContent = `Fish to hand: ${landed} of ${ROUND}`; };
    const turn = (from, to, max) => { let d = Math.atan2(Math.sin(to - from), Math.cos(to - from)); return from + clamp(d, -max, max); };

    const newFish = (x, y, dir, v, idle) => ({ x, y, dir, v, t: 0, age: 0, wave: 0, amp: 1, alpha: 0, mode: idle ? "idle" : "swim", seed: Math.random() * 10, fade: 0 });

    const spawn = () => {
      const { X, Yf } = g;
      let h = 0, d = 30, x = 0, y = 30, tries = 0;
      do {
        h = [-2, -1, 0, 1, 2][Math.floor(Math.random() * 5)];
        d = [30, 40, 50, 60][Math.floor(Math.random() * 4)];
        const th = h * Math.PI / 6; x = d * Math.sin(th); y = d * Math.cos(th); tries++;
      } while ((Math.abs(x) > X - 8 || y > Yf - 8 || y < 12) && tries < 80);
      if (tries >= 80) { h = 0; d = 30; x = 0; y = 30; }
      const r = Math.random();
      let dir, move;
      if (r < 0.18) { dir = Math.atan2(-y, -x); move = "coming at you"; }
      else if (r < 0.26 && d <= 40) { dir = Math.atan2(y, x); move = "going away"; }
      else {
        const left = x > 6 ? Math.random() < 0.8 : x < -6 ? Math.random() < 0.2 : Math.random() < 0.5;
        dir = left ? Math.PI : 0; move = left ? "moving left" : "moving right";
      }
      dir += (Math.random() - 0.5) * 0.4;
      fish = newFish(x, y, dir, 2.5 + Math.random() * 0.8, false);
      show(shade, fishG);
      hide(line, fly);
      phase = "wait";
      setCall(`${HOUR[h]} o’clock, ${FEET[d]} feet, ${move}.`);
      loop();
    };

    const finish = got => {
      count++; if (got) landed++;
      setTally();
      phase = "between";
      later(1500, () => {
        hide(line, fly);
        if (count >= ROUND) return endRound();
        setCall("Watch the flat…");
        later(1100, spawn);
      });
    };
    const endRound = () => {
      phase = "idle";
      const lines = [
        "None to hand this time. Lead them more: two to eight feet in front of the nose.",
        "One to hand. Lead the next one a little more.",
        "Two to hand. That is a good morning on the flats.",
        "Three for three. You are ready for the real thing.",
      ];
      panelText.textContent = lines[landed];
      startBtn.textContent = "Go again";
      realBtn.hidden = false;
      panel.hidden = false;
      setCall("Bonefish on the flat");
      startIdle();
    };

    /* the fly goes out: a loop of orange line unrolling from the rod tip */
    const castTo = (fx, fy) => {
      if (phase !== "wait" || !fish) return;
      phase = "cast";
      hide(aim);
      const sx = 0, sy = -TIP, tx = fx, ty = -fy;
      const len = Math.hypot(tx - sx, ty - sy) || 1, nx = -(ty - sy) / len, ny = (tx - sx) / len;
      const cx = (sx + tx) / 2 + nx * len * 0.14, cy = (sy + ty) / 2 + ny * len * 0.14;
      line.setAttribute("d", `M${sx} ${sy}Q${f2(cx)} ${f2(cy)} ${f2(tx)} ${f2(ty)}`);
      show(line); hide(fly);
      const total = line.getTotalLength();
      line.style.strokeDasharray = `${total}`; line.style.strokeDashoffset = `${total}`;
      cast = { t0: performance.now(), dur: 320, total, fx, fy };
      loop();
    };
    const land = (fx, fy) => {
      line.style.strokeDasharray = "none";
      fly.setAttribute("cx", f2(fx)); fly.setAttribute("cy", f2(-fy)); show(fly);
      ring = { t0: performance.now(), x: fx, y: fy }; show(splash);
      judge(fx, fy);
    };

    /* where did it land, in the fish's own frame: ahead (along) and off his line (side) */
    const judge = (fx, fy) => {
      const f = fish, c = Math.cos(f.dir), s = Math.sin(f.dir);
      const dx = fx - f.x, dy = fy - f.y;
      const along = dx * c + dy * s, side = Math.abs(-dx * s + dy * c), dist = Math.hypot(dx, dy);
      f.fly = [fx, fy];
      if (dist < 1.7 || (along < 0 && dist < 3.2)) {
        say("Right on his head. He spooked.");
        f.mode = "spook"; f.dir = Math.atan2(f.y - fy, f.x - fx); f.v = 15; finish(false);
      } else if (along < 0) { say("Behind him. He never saw it."); f.mode = "pass"; f.fade = 1.4; finish(false); }
      else if (side > 5) { say("Too wide. He swam right past it."); f.mode = "pass"; f.fade = 1.6; finish(false); }
      else if (along > 10) { say("Too far ahead. He turned off before he found it."); f.mode = "pass"; f.dir += (Math.random() < 0.5 ? -1 : 1) * 0.9; f.fade = 1.4; finish(false); }
      else { f.mode = "chase"; f.eat = side <= 3.6 && along >= 1.2 && along <= 9; phase = "fight"; }
    };

    const moveFish = dt => {
      const f = fish;
      f.age += dt; f.t += dt;
      let beat = 9;
      switch (f.mode) {
        case "idle": {
          f.dir += Math.sin(f.t * 0.6 + f.seed) * 0.5 * dt;
          const { X, Yf } = g;
          if (Math.abs(f.x) > X - 10 || f.y > Yf - 10 || f.y < 14) f.dir = turn(f.dir, Math.atan2(32 - f.y, -f.x), 1.2 * dt);
          f.alpha = Math.min(0.55, f.alpha + dt * 0.5);
          break;
        }
        case "swim": {
          f.dir += Math.sin(f.t * 0.9 + f.seed) * 0.12 * dt;
          f.alpha = Math.min(0.9, f.alpha + dt * 0.8);
          const near = Math.hypot(f.x, f.y);
          if (near < 9) { say("Too late. He saw the boat and blew out."); f.mode = "spook"; f.dir = Math.atan2(f.y, f.x); f.v = 15; finish(false); }
          else if (f.age > 14 || Math.abs(f.x) > g.X + 4 || f.y > g.Yf + 4 || f.y < -3) { say("Gone. Get the fly out quicker next time."); f.mode = "pass"; f.fade = 0.8; finish(false); }
          break;
        }
        case "pass": f.fade -= dt; if (f.fade < 0) f.alpha = Math.max(0, f.alpha - dt * 1.4); break;
        case "spook": beat = 26; f.alpha = Math.max(0, f.alpha - dt * 1.1); break;
        case "chase": {
          const [tx, ty] = f.fly, want = Math.atan2(ty - f.y, tx - f.x), dd = Math.hypot(tx - f.x, ty - f.y);
          f.dir = turn(f.dir, want, 3.5 * dt); f.v = 4.2; beat = 14;
          if (!f.eat && dd < 1.6) { say("He looked at it… and refused. Lead him a touch more."); f.mode = "pass"; f.dir += 2.3; f.v = 3.4; f.fade = 1.2; finish(false); }
          else if (f.eat && dd < 0.5) {
            say("He ate it! Strip set… fish on.", 1800);
            f.mode = "run"; f.runFor = 1.4; f.dir = Math.atan2(f.y, f.x) + (Math.random() - 0.5) * 0.8; f.v = 13; hide(fly);
          }
          break;
        }
        case "run": beat = 24; f.runFor -= dt; if (f.runFor <= 0) { say("Into the backing… and back to the boat.", 1800); f.mode = "fight"; f.v = 9; f.fightFor = 3.2; } break;
        case "fight": {
          beat = 16; f.fightFor -= dt; f.dir = turn(f.dir, Math.atan2(-f.y, -f.x), 2.6 * dt);
          if (Math.hypot(f.x, f.y) < 14 || f.fightFor <= 0) { say("Released. Fish to hand!", 2000); f.mode = "pass"; f.dir = Math.atan2(f.y, f.x); f.v = 5; f.fade = 0.6; hide(line); finish(true); }
          break;
        }
      }
      f.x += Math.cos(f.dir) * f.v * dt; f.y += Math.sin(f.dir) * f.v * dt;
      f.wave += beat * dt;
      if (f.mode !== "idle" && f.alpha <= 0 && (f.mode === "pass" || f.mode === "spook")) { fish = null; hide(shade, fishG); }
    };

    const drawFish = () => {
      if (!fish) return;
      const s = shape(fish.wave, fish.mode === "run" || fish.mode === "spook" ? 1.5 : 1);
      const deg = f2(-fish.dir * 180 / Math.PI);
      body.setAttribute("d", s.body); spine.setAttribute("d", s.spine);
      s.eyes.forEach((p, i) => { eyes[i].setAttribute("cx", f2(p[0])); eyes[i].setAttribute("cy", f2(p[1])); });
      fishG.setAttribute("transform", `translate(${f2(fish.x)} ${f2(-fish.y)}) rotate(${deg})`);
      shade.setAttribute("d", s.outline);
      shade.setAttribute("transform", `translate(${f2(fish.x + 0.9)} ${f2(-fish.y + 1.3)}) rotate(${deg})`);
      fishG.style.opacity = shade.style.opacity = f2(fish.alpha);
      if (fish.mode === "run" || fish.mode === "fight") {
        const ex = fish.x, ey = -fish.y, mx = ex / 2 + 1.2, my = (ey - TIP) / 2;
        line.setAttribute("d", `M0 ${-TIP}Q${f2(mx)} ${f2(my)} ${f2(ex)} ${f2(ey)}`);
      }
    };

    const step = now => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (cast) {
        const k = Math.min(1, (now - cast.t0) / cast.dur), e = 1 - Math.pow(1 - k, 3);
        line.style.strokeDashoffset = `${cast.total * (1 - e)}`;
        if (k >= 1) { const { fx, fy } = cast; cast = null; land(fx, fy); }
      }
      if (ring) {
        const k = Math.min(1, (now - ring.t0) / 650);
        splash.setAttribute("cx", f2(ring.x)); splash.setAttribute("cy", f2(-ring.y));
        splash.setAttribute("r", f2(0.4 + k * 3.2)); splash.style.opacity = f2(1 - k);
        if (k >= 1) { ring = null; hide(splash); }
      }
      if (fish) { moveFish(dt); drawFish(); }
      if (fish || cast || ring || phase !== "idle") raf = requestAnimationFrame(step);
    };
    const loop = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } };

    /* before you start: one fish cruising slowly behind the panel */
    const startIdle = () => {
      if (reduce || !g) return;
      fish = newFish(-g.X * 0.35, 34, 0.2, 1.6, true);
      show(shade, fishG); loop();
    };

    startBtn.addEventListener("click", () => {
      timers.forEach(clearTimeout); timers = [];
      count = 0; landed = 0; setTally();
      panel.hidden = true; realBtn.hidden = true;
      fish = null; hide(shade, fishG, line, fly, splash);
      phase = "between";
      setCall("Watch the flat…");
      stage.focus({ preventScroll: true });
      later(1000, spawn);
      loop();
    });

    const toFlat = e => {
      const m = svg.getScreenCTM();
      if (!m) return null;
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
      return [p.x, -p.y];
    };
    const showAim = (x, y) => { aim.setAttribute("cx", f2(x)); aim.setAttribute("cy", f2(-y)); show(aim); };
    stage.addEventListener("pointerdown", e => {
      if (e.target.closest(".stage-panel") || phase !== "wait") return;
      const p = toFlat(e);
      if (p) castTo(p[0], p[1]);
    });
    stage.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse" || phase !== "wait" || e.target.closest(".stage-panel")) return;
      const p = toFlat(e);
      if (p) showAim(p[0], p[1]);
    });
    stage.addEventListener("pointerleave", () => { if (!keyAim) hide(aim); });
    stage.addEventListener("keydown", e => {
      if (!g || (phase !== "wait" && phase !== "between")) return;
      const k = e.key, stepFt = e.shiftKey ? 6 : 2;
      if (k.startsWith("Arrow")) {
        e.preventDefault();
        keyAim = keyAim || [0, 30];
        if (k === "ArrowUp") keyAim[1] += stepFt;
        if (k === "ArrowDown") keyAim[1] -= stepFt;
        if (k === "ArrowLeft") keyAim[0] -= stepFt;
        if (k === "ArrowRight") keyAim[0] += stepFt;
        keyAim[0] = clamp(keyAim[0], -g.X + 2, g.X - 2); keyAim[1] = clamp(keyAim[1], 6, g.Yf - 2);
        showAim(keyAim[0], keyAim[1]);
      } else if ((k === "Enter" || k === " ") && phase === "wait") {
        e.preventDefault();
        const a = keyAim || [0, 30];
        castTo(a[0], a[1]);
      }
    });

    layout();
    setTally();
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(stage);
    if ("IntersectionObserver" in window) {
      const sio = new IntersectionObserver(es => {
        if (phase !== "idle") return;
        if (es[0].isIntersecting) { if (!fish) startIdle(); }
        else if (fish) { fish = null; hide(shade, fishG); }
      }, { rootMargin: "100px" });
      sio.observe(stage);
    }
    stage.dataset.ready = "1";
  }
})();
