// The Cake Lady: the cake planner (the message piped on a drawn cake, the date check against her lead times, the WhatsApp brief),
// section reveals, the drifting strip of cakes and the footer name built from blocks.
document.documentElement.classList.add("js");

const WA = "16492311898";
// Every character is percent-encoded, ! ' ( ) * included, so no app cuts the message short.
const encode = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
const waLink = text => `https://wa.me/${WA}?text=${encode(text)}`;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const tidy = s => String(s || "").replace(/\s+/g, " ").trim();
const SVG = "http://www.w3.org/2000/svg";

/* ---------- The drawn cake ---------- */

const SCHEMES = {
  white: { name: "White", top: "#fbf7ef", side: "#ece3d1", bead: "#fffdf7", pipe: "#b0233a" },
  blue: { name: "Shades of blue", top: "#d3e4ef", side: "#a9c8dc", bead: "#e9f2f8", pipe: "#1f3a6b" },
  blush: { name: "Blush", top: "#f7dcdf", side: "#efc2c8", bead: "#fcecee", pipe: "#a3213a" },
  pistachio: { name: "Pistachio", top: "#e2eab9", side: "#c7d68f", bead: "#f0f4d8", pipe: "#b23d5c" },
  chocolate: { name: "Chocolate", top: "#734129", side: "#58301e", bead: "#86523a", pipe: "#f3d9a4" },
};

const cake = document.getElementById("cake");
const CX = 200, TOP = 112, RX = 150, RY = 62, BOTTOM = 220;
let msgText, clipRect;

function el(name, attrs, parent) {
  const n = document.createElementNS(SVG, name);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

// A ring of piped beads along an ellipse, from angle a to angle b; beads at the front are a little larger.
function beads(parent, cy, r, a, b, n) {
  const g = el("g", {}, parent);
  for (let i = 0; i <= n; i++) {
    const t = a + (b - a) * i / n;
    const x = CX + RX * Math.cos(t), y = cy + RY * Math.sin(t);
    const rr = r * (0.78 + 0.22 * (Math.sin(t) + 1) / 2);
    el("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: rr.toFixed(1), class: "ck-fill", style: "fill: var(--ck-bead)" }, g);
    el("circle", { cx: (x - rr * .3).toFixed(1), cy: (y - rr * .35).toFixed(1), r: (rr * .32).toFixed(1), fill: "#fff", opacity: ".6" }, g);
  }
}

function drawCake() {
  if (!cake) return;
  cake.replaceChildren();
  const defs = el("defs", {}, cake);
  const clip = el("clipPath", { id: "pipe-clip" }, defs);
  clipRect = el("rect", { x: 40, y: 30, width: 0, height: 180 }, clip);
  el("ellipse", { cx: CX, cy: BOTTOM + 30, rx: 182, ry: RY + 10, fill: "#b98a1f" }, cake);
  el("ellipse", { cx: CX, cy: BOTTOM + 22, rx: 182, ry: RY + 10, fill: "#d9a92c" }, cake);
  el("path", { d: `M${CX - RX},${TOP} L${CX - RX},${BOTTOM} A${RX},${RY} 0 0 0 ${CX + RX},${BOTTOM} L${CX + RX},${TOP} Z`, class: "ck-fill", style: "fill: var(--ck-side)" }, cake);
  el("ellipse", { cx: CX, cy: TOP, rx: RX, ry: RY, class: "ck-fill", style: "fill: var(--ck-top)" }, cake);
  beads(cake, TOP, 8, Math.PI, 2 * Math.PI, 26);
  const writing = el("g", { "clip-path": "url(#pipe-clip)" }, cake);
  const plane = el("g", { transform: `translate(${CX} ${TOP + 4}) scale(1 .62)` }, writing);
  msgText = el("text", {
    "text-anchor": "middle", "dominant-baseline": "middle", "font-family": "Allura, cursive", "font-size": 58,
    class: "ck-fill", style: "fill: var(--ck-pipe); stroke: var(--ck-pipe)", "stroke-width": 1.1, "stroke-linejoin": "round",
  }, plane);
  beads(cake, TOP, 8, 0, Math.PI, 26);
  beads(cake, BOTTOM, 10, 0, Math.PI, 24);
}

function paintCake(colour) {
  const s = SCHEMES[colour] || SCHEMES.white;
  cake.style.setProperty("--ck-top", s.top);
  cake.style.setProperty("--ck-side", s.side);
  cake.style.setProperty("--ck-bead", s.bead);
  cake.style.setProperty("--ck-pipe", s.pipe);
}

// Fits the message inside the top of the cake: smaller first, then on two lines split nearest the middle.
const MAX_W = 236;
function writeMessage(msg) {
  if (!msgText) return;
  msgText.replaceChildren();
  msgText.setAttribute("font-size", 58);
  msgText.textContent = msg || " ";
  let w = msgText.getComputedTextLength();
  if (w <= MAX_W) return;
  const one = Math.floor(58 * MAX_W / w);
  if (one >= 40 || !msg.includes(" ")) {
    msgText.setAttribute("font-size", Math.max(one, 18));
    return;
  }
  const spaces = [...msg.matchAll(/ /g)].map(m => m.index);
  const cut = spaces.reduce((a, c) => Math.abs(c - msg.length / 2) < Math.abs(a - msg.length / 2) ? c : a);
  msgText.replaceChildren();
  let size = 52;
  msgText.setAttribute("font-size", size);
  const lines = [msg.slice(0, cut), msg.slice(cut + 1)].map((line, i) => el("tspan", { x: 0, dy: i ? "1.02em" : "-0.5em" }, msgText));
  lines[0].textContent = msg.slice(0, cut);
  lines[1].textContent = msg.slice(cut + 1);
  w = Math.max(lines[0].getComputedTextLength(), lines[1].getComputedTextLength());
  if (w > MAX_W) msgText.setAttribute("font-size", Math.floor(size * MAX_W / w));
}

// The piping: the message is revealed left to right, as a piping bag would write it.
let pipeFrame = 0;
function pipe() {
  if (!clipRect) return;
  cancelAnimationFrame(pipeFrame);
  if (reduced) { clipRect.setAttribute("width", 320); return; }
  const start = performance.now(), dur = 1300;
  const step = now => {
    const t = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - t, 2.2);
    clipRect.setAttribute("width", (320 * eased).toFixed(1));
    if (t < 1) pipeFrame = requestAnimationFrame(step);
  };
  clipRect.setAttribute("width", 0);
  pipeFrame = requestAnimationFrame(step);
}

/* ---------- The planner ---------- */

const form = document.getElementById("plan-form");
const dateInput = document.getElementById("p-date");
const guestsInput = document.getElementById("p-guests");
const msgInput = document.getElementById("p-msg");
const timeCheck = document.getElementById("time-check");
const priceNote = document.getElementById("price-note");
const sends = [...document.querySelectorAll(".send")];
const tagOut = id => document.getElementById(id);

const DAY = 86400000;
const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const parseDate = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
const longDate = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const shortDate = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });

function read() {
  const d = new FormData(form);
  return {
    occasion: d.get("occasion") || "Birthday",
    date: parseDate(d.get("date")),
    guests: Math.max(0, Math.round(Number(d.get("guests")) || 0)),
    flavour: d.get("flavour") || "Vanilla",
    gf: d.get("gf") === "on",
    vegan: d.get("vegan") === "on",
    colour: d.get("colour") || "white",
    message: tidy(d.get("message")),
    delivery: d.get("handover") === "delivery",
  };
}

// Her lead times, from her VisitTCI listing: one to two weeks, up to three for very detailed cakes.
function timing(date) {
  if (!date) return "Pick the date and you will see if there is still time.";
  const days = Math.round((date - startOfToday()) / DAY);
  if (days < 0) return "That date has already passed. Pick the day of your celebration.";
  if (days < 7) {
    const when = days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
    return `That is ${when}, which is short notice. Message Adele right away and she will tell you what is still possible.`;
  }
  const by = n => shortDate(new Date(date.getTime() - n * DAY));
  if (days < 14) return `${days} days to go. Adele asks for one to two weeks, so send your order today. Very detailed cakes need up to three weeks.`;
  if (days < 21) return `${days} days to go: good timing for most cakes. To be safe, order by ${by(14)}. A very detailed design needs up to three weeks, so ask Adele first.`;
  return `${days} days to go: plenty of time, even for a very detailed cake. Order by ${by(21)} for a detailed design, or by ${by(14)} for a simpler one.`;
}

function price(s) {
  if (s.occasion === "Wedding") return "Wedding cakes are usually $500–600, depending on the design, and delivery is included.";
  let text = "Birthday and party cakes start around $160, and the largest, most detailed ones are up to about $400.";
  if (s.guests >= 60) text += " For a big crowd, ask about tiers, or add cupcakes at $40–60 a dozen.";
  return text;
}

function flavourLine(s) {
  const extras = [s.gf && "gluten-free", s.vegan && "vegan"].filter(Boolean);
  return extras.length ? `${s.flavour}, ${extras.join(" and ")}` : s.flavour;
}

function brief(s) {
  const scheme = SCHEMES[s.colour] || SCHEMES.white;
  const lines = [
    "Hi Adele! I'd like to order a cake.",
    "",
    `Occasion: ${s.occasion}`,
    `Date: ${s.date ? longDate(s.date) : "not fixed yet"}`,
    `Guests: about ${s.guests || "?"}`,
    `Flavour: ${flavourLine(s)}`,
    `Icing: ${scheme.name.toLowerCase()}`,
    `Message on the cake: ${s.message ? `"${s.message}"` : "none"}`,
    s.delivery ? "I'd like it delivered." : "I'll pick it up in Discovery Bay.",
    "",
    "Is that date free? I can send you pictures of cakes I like.",
  ];
  return lines.join("\n");
}

let lastColour = "";
function update() {
  const s = read();
  const scheme = SCHEMES[s.colour] || SCHEMES.white;
  paintCake(s.colour);
  writeMessage(s.message);
  cake.setAttribute("aria-label", `${scheme.name} cake${s.message ? ` with "${s.message}" piped on top` : ""}`);
  tagOut("t-occasion").textContent = s.occasion;
  tagOut("t-flavour").textContent = flavourLine(s);
  tagOut("t-colour").textContent = scheme.name;
  tagOut("t-guests").textContent = `${s.guests || "?"} guests`;
  tagOut("t-date").textContent = s.date ? shortDate(s.date) : "Date to choose";
  tagOut("t-hand").textContent = s.delivery ? (s.occasion === "Wedding" ? "Delivery, free" : "Delivery") : "Pickup, Discovery Bay";
  timeCheck.textContent = timing(s.date);
  priceNote.textContent = price(s);
  const href = waLink(brief(s));
  sends.forEach(a => { a.href = href; });
  // A new colour pipes the message again, in the new icing.
  if (lastColour && lastColour !== s.colour) pipe();
  lastColour = s.colour;
}

if (form && cake) {
  drawCake();
  const t = startOfToday();
  dateInput.min = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  // The colour and the message sit beside the cake, outside the form element, so listen wherever the planner's fields are.
  const ownField = e => e.target.form === form;
  document.addEventListener("input", e => { if (ownField(e)) update(); });
  document.addEventListener("change", e => { if (ownField(e)) update(); });
  msgInput.addEventListener("change", pipe);
  document.querySelectorAll(".step-btn").forEach(b => b.addEventListener("click", () => {
    const next = Math.min(400, Math.max(1, (Number(guestsInput.value) || 0) + Number(b.dataset.step)));
    guestsInput.value = next;
    update();
  }));
  // "Plan one like it" sets the colour of that cake before the page scrolls to the planner.
  document.querySelectorAll("[data-like]").forEach(a => a.addEventListener("click", () => {
    const radio = document.querySelector(`input[name="colour"][value="${a.dataset.like}"]`);
    if (radio) { radio.checked = true; update(); }
  }));
  update();
  // The first piping waits for the font and for the cake to be seen.
  const firstPipe = () => {
    if (!("IntersectionObserver" in window)) { pipe(); return; }
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); pipe(); }
    }, { threshold: 0.45 });
    io.observe(cake);
  };
  if (document.fonts) {
    document.fonts.load("58px Allura").then(() => { update(); firstPipe(); }, firstPipe);
    document.fonts.addEventListener("loadingdone", () => writeMessage(read().message));
  } else {
    firstPipe();
  }
}

/* ---------- Questions: one card open at a time ---------- */

const qcards = [...document.querySelectorAll(".qcard")];
qcards.forEach(d => d.addEventListener("toggle", () => {
  if (d.open) qcards.forEach(o => { if (o !== d) o.open = false; });
}));

/* ---------- The quick WhatsApp bar ---------- */

const quick = document.getElementById("quick");
if (quick) {
  quick.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(quick);
    const name = tidy(d.get("name")), when = tidy(d.get("when"));
    let text = "Hi Adele!";
    if (name) text += ` My name is ${name}.`;
    text += when ? ` I'd like a cake for ${when}. Can we talk about it?` : " I'd like to order a cake. Can we talk about it?";
    window.open(waLink(text), "_blank", "noopener");
  });
}

/* ---------- The strip of cakes drifts on a loop ---------- */

const track = document.querySelector(".strip-track");
if (track && !reduced) {
  [...track.children].forEach(img => track.appendChild(img.cloneNode(true)));
}

/* ---------- The footer name, built from blocks of different heights ---------- */

const blocksG = document.getElementById("blocks");
const blocksSvg = blocksG && blocksG.ownerSVGElement;
const BLOCK_COLOURS = ["#c8243c", "#e0a912", "#a9c9de", "#f1c5cb", "#c9d78f", "#f8f3ea"];
const HEIGHTS = [1, .74, .9, .64, .96, .7, .86, .66, 1, .8, .62, .92, .76];
let blocksNarrow = null;

function buildBlocks() {
  if (!blocksG) return;
  const narrow = innerWidth < 700;
  if (narrow === blocksNarrow) return;
  blocksNarrow = narrow;
  const rows = narrow ? ["THE CAKE", "LADY"] : ["THE CAKE LADY"];
  const W = 1200, gap = 6, rowH = narrow ? 330 : 260, rowGap = 14;
  blocksG.replaceChildren();
  let k = 0;
  // Every row uses the block width of the longest row, so the letters match in size.
  const longest = rows.reduce((a, r) => r.length > a.length ? r : a, "");
  const nL = longest.replace(/ /g, "").length, nS = longest.split(" ").length - 1;
  const bw = (W - (nL + nS - 1) * gap) / (nL + 0.35 * nS);
  rows.forEach((row, ri) => {
    const bottom = rowH * (ri + 1) + rowGap * ri;
    let x = 0;
    for (const ch of row) {
      if (ch === " ") { x += bw * 0.35 + gap; continue; }
      const h = rowH * HEIGHTS[k % HEIGHTS.length];
      const colour = BLOCK_COLOURS[k % BLOCK_COLOURS.length];
      el("rect", { x: x.toFixed(1), y: (bottom - h).toFixed(1), width: bw.toFixed(1), height: h.toFixed(1), fill: colour }, blocksG);
      const t = el("text", { x: (x + bw / 2).toFixed(1), y: (bottom - bw * 0.3).toFixed(1), "text-anchor": "middle", "font-size": (bw * 1.02).toFixed(1), fill: "#8e1f2c" }, blocksG);
      t.textContent = ch;
      x += bw + gap;
      k++;
    }
  });
  blocksSvg.setAttribute("viewBox", `0 0 ${W} ${rowH * rows.length + rowGap * (rows.length - 1)}`);
}
buildBlocks();
addEventListener("resize", buildBlocks);

/* ---------- Each section's parts come in one after another the first time they are seen ---------- */

const groups = document.querySelectorAll("[data-reveal]");
groups.forEach(g => {
  const kids = g.classList.contains("steps-grid") ? [...g.querySelectorAll(".step > *")] : [...g.children];
  kids.forEach((c, i) => c.style.setProperty("--i", Math.min(i, 9)));
});
const panels = document.querySelectorAll(".panel");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver(entries => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  groups.forEach(g => io.observe(g));
  panels.forEach(p => io.observe(p));
} else {
  groups.forEach(g => g.classList.add("is-in"));
  panels.forEach(p => p.classList.add("is-in"));
}
