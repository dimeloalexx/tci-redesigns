(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const wide = () => window.matchMedia("(min-width: 760px)").matches;

  // ---------- Turks and Caicos time ----------
  function tciNow() {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
      return { day: p.weekday, min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
    } catch (e) { return null; }
  }
  const OPEN = 7 * 60 + 30, CLOSE = 15 * 60 + 30;

  function status() {
    const t = tciNow(); if (!t) return;
    let state = "closed", text;
    if (t.day === "Sun") text = "Closed today. Back Monday at 7:30am";
    else if (t.min >= OPEN && t.min < CLOSE) { state = "open"; text = CLOSE - t.min <= 60 ? "Open now, closing at 3:30pm" : "Open now, until 3:30pm"; }
    else if (t.min < OPEN) text = "Opens today at 7:30am. Come early";
    else text = t.day === "Sat" ? "Closed now. Back Monday at 7:30am" : "Closed now. Opens tomorrow at 7:30am";
    $$("[data-status]").forEach(s => { s.dataset.state = state; $("[data-status-text]", s).textContent = text; });
  }
  status(); setInterval(status, 60000);

  // ---------- The name always fits, whole ----------
  // One line on wide screens, one word per line on a phone; each step down until it really fits.
  // offset sizes ignore the scroll scale on the hero name, so the measure is always the real one
  function fitBlock(el) {
    const lines = $$("[data-fit-line]", el);
    const room = el.clientWidth;
    if (!room) return;
    const span = wide()
      ? () => lines[lines.length - 1].offsetLeft + lines[lines.length - 1].offsetWidth - lines[0].offsetLeft
      : () => Math.max(...lines.map(l => l.offsetWidth));
    el.style.fontSize = "100px";
    const w = span();
    if (!w) return;
    let size = Math.floor((room / w) * 100 * .97);
    el.style.fontSize = size + "px";
    while (span() > room && size > 12) el.style.fontSize = (size -= 2) + "px";
  }
  const fitEls = [$("[data-name]"), $("[data-wordmark]")];
  const fitAll = () => fitEls.forEach(fitBlock);
  fitAll();
  window.addEventListener("resize", fitAll);
  window.addEventListener("load", fitAll);
  if (document.fonts) { document.fonts.ready.then(fitAll); document.fonts.addEventListener("loadingdone", fitAll); }
  if ("ResizeObserver" in window) { const ro = new ResizeObserver(fitAll); fitEls.forEach(e => ro.observe(e)); }

  // ---------- Signature move: the name settles as the first screen leaves ----------
  const name = $("[data-name]"), hero = $(".hero");
  if (!reduce) {
    let ticking = false;
    const settle = () => {
      const p = Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
      name.style.transform = `scale(${1 - p * 0.06})`;
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(settle); } }, { passive: true });
  }

  // ---------- In the case: the row in front lights its photograph ----------
  const rows = $$("[data-rows] li"), caseImg = $("[data-case-img]");
  function activate(li) {
    if (li.classList.contains("is-on")) return;
    rows.forEach(r => { const on = r === li; r.classList.toggle("is-on", on); $("button", r).setAttribute("aria-expanded", String(on)); });
    caseImg.classList.add("swap");
    setTimeout(() => { caseImg.src = li.dataset.img; caseImg.onload = () => caseImg.classList.remove("swap"); if (caseImg.complete) caseImg.classList.remove("swap"); }, 160);
  }
  rows.forEach(li => {
    $("button", li).addEventListener("click", () => activate(li));
    $("button", li).addEventListener("mouseenter", () => { if (wide()) activate(li); });
  });
  rows.forEach(li => { const im = new Image(); im.src = li.dataset.img; });
  let rowTick = false;
  window.addEventListener("scroll", () => {
    if (rowTick || !wide()) return; rowTick = true;
    requestAnimationFrame(() => {
      rowTick = false;
      const mid = innerHeight / 2, list = $("[data-rows]").getBoundingClientRect();
      if (list.bottom < 0 || list.top > innerHeight) return;
      let best = null, d = Infinity;
      rows.forEach(r => { const b = $("button", r).getBoundingClientRect(), dd = Math.abs(b.top + b.height / 2 - mid); if (dd < d) { d = dd; best = r; } });
      if (best && d < 90) activate(best);
    });
  }, { passive: true });

  // ---------- The morning: the case empties as the clock moves ----------
  const svg = $("[data-case]");
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (parent) parent.appendChild(n); return n; };
  const crescent = (g, x, y, s, fill, lines) => {
    el("path", { d: `M${x - s} ${y} Q${x} ${y - s * 1.25} ${x + s} ${y} Q${x} ${y - s * .4} ${x - s} ${y} Z`, fill, stroke: "#8a5418", "stroke-width": 1.5, "stroke-linejoin": "round" }, g);
    if (lines) for (let k = -1; k <= 1; k++) el("line", { x1: x + k * s * .38, y1: y - s * .62, x2: x + k * s * .3, y2: y - s * .3, stroke: "#9a5f1c", "stroke-width": 1.6, "stroke-linecap": "round" }, g);
  };
  // [what, how it is drawn, minutes after opening it starts to go, minutes when it is usually gone, pieces that stay]
  const TRAYS = [
    ["Beignets", "beignet", 0, 90, 0], ["Almond croissants", "almond", 30, 135, 0], ["Croissants", "croissant", 60, 210, 0],
    ["Pain au chocolat", "pac", 45, 180, 0], ["Ham and cheese croissants", "hamcheese", 60, 240, 0], ["Éclairs", "eclair", 120, 330, 0],
    ["Quiche", "quiche", 150, 300, 0], ["Fruit tarts", "tart", 180, 390, 0], ["Bread", "boule", 240, 480, 2],
  ];
  const PER = 6;
  function drawPiece(g, kind, x, y) {
    if (kind === "beignet") {
      el("circle", { cx: x, cy: y - 14, r: 15, fill: "#d9a050", stroke: "#a86e2a", "stroke-width": 1.5 }, g);
      [[-6, -20], [4, -24], [7, -12], [-3, -10], [0, -17]].forEach(([a, b]) => el("circle", { cx: x + a, cy: y + b, r: 2.2, fill: "#ffffff" }, g));
    } else if (kind === "almond") {
      crescent(g, x, y - 4, 20, "#d49a42", false);
      [[-8, -13], [2, -16], [9, -11]].forEach(([a, b]) => el("ellipse", { cx: x + a, cy: y + b, rx: 4, ry: 2, fill: "#f5e6c6", transform: `rotate(${a * 3} ${x + a} ${y + b})` }, g));
      [[-4, -9], [5, -8], [0, -12]].forEach(([a, b]) => el("circle", { cx: x + a, cy: y + b, r: 1.6, fill: "#fff" }, g));
    } else if (kind === "croissant") crescent(g, x, y - 4, 21, "#e0a64a", true);
    else if (kind === "hamcheese") {
      crescent(g, x, y - 4, 21, "#c98536", true);
      [[-9, -6], [9, -6]].forEach(([a, b]) => el("rect", { x: x + a - 4, y: y + b - 3, width: 8, height: 5, rx: 1, fill: "#ffd25a" }, g));
    } else if (kind === "pac") {
      el("rect", { x: x - 21, y: y - 22, width: 42, height: 22, rx: 7, fill: "#cf8c3c", stroke: "#8a5418", "stroke-width": 1.5 }, g);
      [-13, 13].forEach(a => el("rect", { x: x + a - 2.5, y: y - 19, width: 5, height: 16, rx: 2, fill: "#4a2615" }, g));
    } else if (kind === "eclair") {
      el("rect", { x: x - 24, y: y - 16, width: 48, height: 16, rx: 8, fill: "#e3ad62", stroke: "#a86e2a", "stroke-width": 1.5 }, g);
      el("rect", { x: x - 22, y: y - 18, width: 44, height: 8, rx: 4, fill: "#6b3f22" }, g);
    } else if (kind === "quiche") {
      el("path", { d: `M${x - 20} ${y} L${x + 20} ${y} L${x + 4} ${y - 30} Z`, fill: "#f2d27a", stroke: "#c98a3c", "stroke-width": 3, "stroke-linejoin": "round" }, g);
      el("circle", { cx: x + 2, cy: y - 9, r: 3, fill: "#5a9a3e" }, g);
    } else if (kind === "tart") {
      el("ellipse", { cx: x, cy: y - 10, rx: 21, ry: 11, fill: "#d9a050", stroke: "#a86e2a", "stroke-width": 1.5 }, g);
      el("ellipse", { cx: x, cy: y - 12, rx: 16, ry: 7, fill: "#f6d77a" }, g);
      [["#e0442f", -8, -13], ["#6fb24a", 0, -15], ["#ff9f2e", 8, -12], ["#7a2a5a", 2, -10]].forEach(([c, a, b]) => el("circle", { cx: x + a, cy: y + b, r: 3.4, fill: c }, g));
    } else if (kind === "boule") {
      el("ellipse", { cx: x, cy: y - 15, rx: 22, ry: 16, fill: "#c78a46", stroke: "#8a5418", "stroke-width": 1.5 }, g);
      el("path", { d: `M${x - 10} ${y - 22} L${x + 10} ${y - 9} M${x + 10} ${y - 22} L${x - 10} ${y - 9}`, stroke: "#f2d9a8", "stroke-width": 3, "stroke-linecap": "round" }, g);
    }
  }
  const pieces = [];
  function drawCase() {
    // the case: frame, lamp, warm interior, three glass shelves
    el("rect", { x: 10, y: 10, width: 580, height: 420, rx: 10, fill: "#0f1b3d" }, svg);
    el("rect", { x: 26, y: 26, width: 548, height: 388, rx: 4, fill: "#fff3dc" }, svg);
    el("rect", { x: 26, y: 26, width: 548, height: 10, fill: "#ffffff" }, svg);
    const shelves = [148, 278, 408];
    shelves.forEach(y => el("rect", { x: 26, y, width: 548, height: 6, fill: "#d8c7a4" }, svg));
    TRAYS.forEach((t, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const tx = 40 + col * 180, base = shelves[row] - 4;
      el("rect", { x: tx, y: base - 3, width: 164, height: 6, rx: 3, fill: "#b9c0cc" }, svg);
      const list = [];
      for (let k = 0; k < PER; k++) {
        const back = k >= 3, x = tx + 32 + (k % 3) * 50, y = back ? base - 18 : base - 2;
        // the size lives on a wrapper so the piece's own CSS transform can shrink it away
        const wrap = el("g", { transform: `translate(${x} ${y}) scale(1.18) translate(${-x} ${-y})` }, svg);
        const g = el("g", { class: "piece" }, wrap);
        drawPiece(g, t[1], x, y);
        list.push(wrap);
      }
      // back row behind the front row
      list.slice(3).forEach(g => svg.insertBefore(g, list[0]));
      pieces.push(list);
    });
  }
  drawCase();

  const range = $("[data-arrive]"), out = $("[data-time-out]"), verdict = $("[data-verdict]");
  const fmt = m => { const h = Math.floor(m / 60), mm = m % 60, hh = ((h + 11) % 12) + 1; return `${hh}:${String(mm).padStart(2, "0")}${h < 12 ? "am" : "pm"}`; };
  function say(t) {
    if (t === 0) return "The case is full. You may wait in a short line.";
    if (t <= 60) return "Nearly everything is there, and the beignets are going fast.";
    if (t <= 135) return "The beignets are usually gone by now. Croissants are still out.";
    if (t <= 210) return "Late morning: the croissants are going. Quiche and tarts are out.";
    if (t <= 300) return "Lunchtime: quiche, éclairs and tarts, while they last.";
    if (t <= 390) return "Early afternoon: the last tarts, and bread.";
    return "Late in the day: mostly bread, and whatever is left.";
  }
  function show() {
    const t = Number(range.value) * 15;
    out.textContent = fmt(OPEN + t);
    verdict.textContent = say(t);
    range.setAttribute("aria-valuetext", `${fmt(OPEN + t)}. ${say(t)}`);
    TRAYS.forEach(([, , start, end, keep], i) => {
      const f = Math.min(1, Math.max(0, (t - start) / (end - start)));
      const gone = Math.min(PER - keep, Math.round(f * PER));
      // the front of the tray goes first, the way a counter empties
      pieces[i].forEach((w, k) => w.firstChild.classList.toggle("gone", k < gone));
    });
  }
  range.addEventListener("input", show);
  const now = tciNow();
  if (now && now.day !== "Sun" && now.min >= OPEN && now.min < CLOSE) range.value = Math.round((now.min - OPEN) / 15);
  show();

  // ---------- Written up by: one name lit at a time ----------
  const lit = $$("[data-name-lit]");
  let li = 0;
  if (!reduce && lit.length) setInterval(() => { lit.forEach((n, i) => n.classList.toggle("lit", i === li)); li = (li + 1) % lit.length; }, 2000);

  // ---------- Entrances ----------
  const rev = $$(".intro-line, .plaque:not(.plaque-sm), .intro-photos li, .case .h2, .rows li, .case-note, .morning-text > *, .vitrine, .cake-card, .about-title, .about-cols > *, .arch, .names, .score, .q, .mentions, .leave, .vcard, .foot-cols > div");
  rev.forEach(n => n.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(n => n.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`; e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.12 });
    rev.forEach(n => io.observe(n));
  }
})();
