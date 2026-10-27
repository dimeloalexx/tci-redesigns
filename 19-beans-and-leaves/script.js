(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";

  // ---------- Open right now? (Turks and Caicos time) ----------
  function status() {
    let day, min;
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
      day = p.weekday; min = (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
    } catch (e) { return; }
    const open = 7 * 60 + 30, close = day === "Sun" ? 17 * 60 : 18 * 60;
    let state = "closed", text;
    if (min >= open && min < close) { state = "open"; text = `Open now, until ${day === "Sun" ? "5pm" : "6pm"}`; }
    else if (min < open) text = "Opens today at 7:30am";
    else text = "Closed now, opens tomorrow at 7:30am";
    $$("[data-status]").forEach(s => { s.dataset.state = state; $("[data-status-text]", s).textContent = text; });
  }
  status(); setInterval(status, 60000);

  // ---------- The drinks ----------
  // temps: which of hot/iced it comes as; milk: takes milk; shot: can take an extra espresso shot; boba: pearls
  // hot: [surface colour, art colour or null]; iced: layers from the top down as [colour, share of the cup]
  const DRINKS = {
    beans: [
      { n: "Cappuccino", d: "Espresso under a thick cap of foamed milk.", temps: ["hot", "iced"], milk: true, shot: true, code: "CAP", hot: ["#8a5a3a", "#f3e6d4"], iced: [["#f1e4d2", .14], ["#6b4128", .3], ["#d8bfa2", .56]] },
      { n: "Latte", d: "Espresso with plenty of steamed milk.", temps: ["hot", "iced"], milk: true, shot: true, code: "LAT", hot: ["#a97a55", "#f6ead9"], iced: [["#5d3822", .22], ["#e3cdb2", .78]] },
      { n: "Americano", d: "The black coffee regulars tell newcomers to try first.", temps: ["hot", "iced"], milk: false, shot: true, code: "AME", hot: ["#3a2214", null], iced: [["#3a2214", 1]] },
      { n: "Espresso", d: "Short, strong and pulled to order. Ristretto if you ask.", temps: ["hot"], milk: false, shot: true, code: "ESP", hot: ["#4a2a16", null], small: true },
      { n: "Iced mocha", d: "Chocolate, espresso and milk over ice. Regulars add an extra shot.", temps: ["iced"], milk: true, shot: true, code: "MOC", iced: [["#f1e4d2", .1], ["#4e2c1a", .35], ["#8a5a3a", .55]] },
      { n: "Cold brew", d: "Steeped slow and served over ice.", temps: ["iced"], milk: true, shot: false, code: "CB", iced: [["#2e1a0f", 1]] },
    ],
    leaves: [
      { n: "Matcha latte", d: "Green tea whisked into milk.", temps: ["hot", "iced"], milk: true, shot: false, code: "MAT", hot: ["#8fae5a", "#eef2dc"], iced: [["#86a84f", .4], ["#e8eedb", .6]] },
      { n: "Milk tea with boba", d: "Bubble tea with chewy tapioca pearls.", temps: ["iced"], milk: true, shot: false, boba: true, code: "BOB", iced: [["#c9a27a", 1]] },
      { n: "Brewed tea", d: "Freshly brewed, hot or iced.", temps: ["hot", "iced"], milk: false, shot: false, code: "TEA", hot: ["#b0662a", null], iced: [["#b8702e", 1]] },
    ],
    blended: [
      { n: "Smoothie", d: "Blended fruit, made to order.", temps: ["iced"], milk: false, shot: false, code: "SMO", blend: true, iced: [["#e9775a", 1]] },
      { n: "Frappé", d: "Ice-cold and blended, for the tables outside.", temps: ["iced"], milk: true, shot: true, code: "FRA", blend: true, iced: [["#f3e8da", .16], ["#a77a55", .84]] },
    ],
  };
  let kind = "beans", drink = DRINKS.beans[0], temp = "hot", milk = "dairy", extra = false, name = "";

  const stage = $(".cup-stage"), svg = $("[data-cup]"), chipsEl = $("[data-drinks]");
  const nameEl = $("[data-drink-name]"), descEl = $("[data-drink-desc]"), line = $("[data-order-line]");
  const tempBtns = $$("[data-temp]"), milkWrap = $("[data-milk-wrap]"), milkBtns = $$("[data-milk]");
  const extraWrap = $("[data-extra-wrap]"), extraBox = $("[data-extra]"), nameInput = $("[data-cup-name]");

  function setKind(k) {
    kind = k; stage.dataset.kind = k;
    $$("[data-kind]").forEach(b => b.setAttribute("aria-selected", String(b.dataset.kind === k)));
    chipsEl.innerHTML = DRINKS[k].map(x => `<button type="button" aria-pressed="false" data-drink="${x.n}">${x.n}</button>`).join("");
    pick(DRINKS[k][0]);
  }
  function pick(x) {
    drink = x;
    if (!x.temps.includes(temp)) temp = x.temps[0];
    if (!x.shot) { extra = false; extraBox.checked = false; }
    render(true);
  }
  $$("[data-kind]").forEach(b => b.addEventListener("click", () => setKind(b.dataset.kind)));
  chipsEl.addEventListener("click", e => { const b = e.target.closest("[data-drink]"); if (b) pick(DRINKS[kind].find(x => x.n === b.dataset.drink)); });
  tempBtns.forEach(b => b.addEventListener("click", () => { if (drink.temps.includes(b.dataset.temp)) { temp = b.dataset.temp; render(true); } }));
  milkBtns.forEach(b => b.addEventListener("click", () => { milk = b.dataset.milk; render(true); }));
  extraBox.addEventListener("change", () => { extra = extraBox.checked; render(true); });
  nameInput.addEventListener("input", () => { name = nameInput.value.trim().slice(0, 12); render(false); });

  // ---------- Draw the cup ----------
  const el = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (parent) parent.appendChild(n); return n; };
  const marker = (g, x, y, text, size, rot) => {
    const t = el("text", { x, y, "text-anchor": "middle", fill: "#1d1611", transform: `rotate(${rot} ${x} ${y})`, style: `font: ${size}px 'Permanent Marker', 'Comic Sans MS', cursive` }, g);
    t.textContent = text;
  };
  // the leaf again, as latte art: a rosetta is a leaf poured in milk
  const rosetta = (g, cx, cy, r, colour) => {
    el("path", { d: `M${cx} ${cy - r} Q${cx + r * .78} ${cy} ${cx} ${cy + r} Q${cx - r * .78} ${cy} ${cx} ${cy - r} Z`, fill: colour }, g);
    for (let i = 0; i < 4; i++) {
      const y = cy - r * .55 + i * r * .34;
      el("path", { d: `M${cx - r * .32} ${y} Q${cx} ${y + r * .2} ${cx + r * .32} ${y}`, fill: "none", stroke: "rgba(0,0,0,.18)", "stroke-width": 2.5, "stroke-linecap": "round" }, g);
    }
    el("line", { x1: cx, y1: cy - r * .9, x2: cx, y2: cy + r * .95, stroke: "rgba(0,0,0,.16)", "stroke-width": 2 }, g);
  };

  function drawHot(g) {
    const small = !!drink.small, R = small ? 74 : 104, cx = 186, cy = 200;
    // saucer, cup rim from above, the drink, the handle
    el("ellipse", { cx, cy: cy + 8, rx: R + 58, ry: R + 52, fill: "#f4efe7" }, g);
    el("ellipse", { cx, cy: cy + 8, rx: R + 34, ry: R + 30, fill: "#e6dfd3" }, g);
    el("rect", { x: cx + R + 2, y: cy - 16, width: 46, height: 30, rx: 15, fill: "#f9f6f1" }, g);
    el("circle", { cx, cy, r: R + 12, fill: "#fbf8f3" }, g);
    el("circle", { cx, cy, r: R, fill: drink.hot[0] }, g);
    if (drink.hot[1] && milk) rosetta(g, cx, cy + 4, R * .62, drink.hot[1]);
    if (drink.code === "TEA") { el("line", { x1: cx + R * .4, y1: cy - R * .3, x2: cx + R + 30, y2: cy - R - 12, stroke: "#f4efe7", "stroke-width": 2 }, g); el("rect", { x: cx + R + 22, y: cy - R - 34, width: 26, height: 30, rx: 3, fill: "#f4efe7" }, g); }
    // the steam
    const st = el("g", { class: "steam", fill: "none", stroke: "rgba(255,255,255,.55)", "stroke-width": 5, "stroke-linecap": "round" }, g);
    [-30, 0, 30].forEach(dx => el("path", { d: `M${cx + dx} ${cy - R - 30} q-12 -16 0 -32 q12 -16 0 -32` }, st));
    // the order tag, written by the barista
    const tag = el("g", { transform: "translate(282 286) rotate(8)" }, g);
    el("rect", { x: -64, y: -36, width: 128, height: 76, rx: 8, fill: "#fffdf8" }, tag);
    el("circle", { cx: -50, cy: -22, r: 5, fill: "#14110d" }, tag);
    marker(tag, 0, -2, name || "Your name", name ? 26 : 18, -4);
    marker(tag, 0, 28, codes(), 16, -2);
  }

  function codes() {
    return [drink.code, temp === "iced" ? "ICE" : "", drink.milk && milk === "oat" ? "OAT" : "", extra ? "X2" : ""].filter(Boolean).join(" ");
  }

  function drawIced(g) {
    const top = 96, bot = 352, tl = 128, tr = 272, bl = 152, br = 248;
    const body = `M${tl} ${top} L${tr} ${top} L${br} ${bot} Q200 ${bot + 10} ${bl} ${bot} Z`;
    const clip = el("clipPath", { id: "cupclip" }, g); el("path", { d: body }, clip);
    const inside = el("g", { "clip-path": "url(#cupclip)" }, g);
    // the drink in layers, filled to just under the rim
    let y = top + 22; const H = bot - y + 6;
    const layers = drink.iced.map(l => l.slice());
    if (drink.milk && milk === "oat") layers.forEach(l => { if (/^#(e|f|d)/i.test(l[0])) l[0] = "#e9dcc4"; });
    layers.forEach(([c, share]) => { el("rect", { x: 100, y, width: 200, height: H * share + 1, fill: c }, inside); y += H * share; });
    if (extra) el("rect", { x: 100, y: top + 22, width: 200, height: 14, fill: "#3a2214" }, inside);
    if (drink.blend) for (let i = 0; i < 26; i++) el("circle", { cx: 140 + (i * 37) % 120, cy: top + 40 + (i * 53) % 220, r: 2.2, fill: "rgba(255,255,255,.35)" }, inside);
    else [[150, 150, 10], [210, 132, -14], [178, 196, 22], [232, 210, 6], [158, 238, -8]].forEach(([x, yy, a]) =>
      el("rect", { x: x - 18, y: yy - 18, width: 36, height: 36, rx: 7, fill: "rgba(255,255,255,.28)", stroke: "rgba(255,255,255,.65)", "stroke-width": 2, transform: `rotate(${a} ${x} ${yy})` }, inside));
    if (drink.boba) for (let i = 0; i < 22; i++) el("circle", { cx: 162 + (i % 6) * 15 + (i % 2) * 6, cy: bot - 14 - Math.floor(i / 6) * 14, r: 7, fill: "#2b1a12" }, inside);
    // the cup itself, the lid and the straw
    el("path", { d: body, fill: "rgba(255,255,255,.12)", stroke: "rgba(255,255,255,.75)", "stroke-width": 3 }, g);
    el("rect", { x: 118, y: top - 12, width: 164, height: 16, rx: 8, fill: "rgba(255,255,255,.85)" }, g);
    el("rect", { x: 214, y: 28, width: drink.boba ? 18 : 12, height: 160, rx: 6, fill: drink.boba ? "#2b1a12" : "#f4efe7", transform: "rotate(12 222 100)" }, g);
    // the barista's marker on the cup
    marker(g, 200, 252, name || "Your name", name ? 34 : 24, -6);
    marker(g, 200, 290, codes(), 20, -4);
  }

  function render(redraw) {
    $$("[data-drink]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.drink === drink.n)));
    tempBtns.forEach(b => { b.disabled = !drink.temps.includes(b.dataset.temp); b.setAttribute("aria-pressed", String(b.dataset.temp === temp)); });
    milkWrap.hidden = !drink.milk;
    milkBtns.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.milk === milk)));
    extraWrap.hidden = !drink.shot;
    nameEl.textContent = drink.n; descEl.textContent = drink.d;
    const what = `${temp === "iced" && !drink.n.startsWith("Iced") && !drink.blend && drink.n !== "Cold brew" ? "iced " : temp === "hot" ? "hot " : ""}${drink.n.toLowerCase()}`;
    const bits = [drink.milk && milk === "oat" ? "with oat milk" : "", extra ? "an extra shot" : ""].filter(Boolean).join(" and ");
    line.textContent = `One ${what}${bits ? " " + (bits.startsWith("an") ? "with " + bits : bits) : ""}${name ? `, for ${name}` : ""}.`;
    svg.innerHTML = "";
    const g = el("g", { class: redraw && !reduce ? "cup" : "" }, svg);
    if (temp === "hot") drawHot(g); else drawIced(g);
  }

  setKind("beans");

  // ---------- The name in the footer always fits, whole ----------
  const wide = () => window.matchMedia("(min-width: 760px)").matches;
  const fitBox = $("[data-fit]"), lines = $$("[data-fit-line]", fitBox);
  function fit() {
    const room = fitBox.clientWidth;
    if (!room) return;
    const span = wide()
      ? () => lines[lines.length - 1].offsetLeft + lines[lines.length - 1].offsetWidth - lines[0].offsetLeft
      : () => Math.max(...lines.map(l => l.offsetWidth));
    fitBox.style.fontSize = "100px";
    const w = span(); if (!w) return;
    let size = Math.floor((room / w) * 100 * .96);
    fitBox.style.fontSize = size + "px";
    while (span() > room && size > 12) fitBox.style.fontSize = (size -= 2) + "px";
  }
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("load", fit);
  if (document.fonts) { document.fonts.ready.then(() => { fit(); render(false); }); document.fonts.addEventListener("loadingdone", fit); }
  if ("ResizeObserver" in window) new ResizeObserver(fit).observe(fitBox);

  // ---------- Entrances ----------
  const rev = $$(".drink-panel > *, .cup-stage, .menu .h2, .menu-note, .cat-head, .items li, .shutter, .room-text > *, .tile, .coupon, .map, .foot-cols > div");
  rev.forEach(n => n.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(n => n.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`; e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.1 });
    rev.forEach(n => io.observe(n));
  }
})();
