(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Hero: the name rises line by line; on a phone it is fitted to the width ----------
  const hero = $(".hero"), name = $(".name");
  function fitName() {
    name.style.fontSize = "";
    const pad = parseFloat(getComputedStyle(hero).paddingLeft) || 16;
    const longest = $(".l1 > span", name);
    const fs = parseFloat(getComputedStyle(name).fontSize);
    const room = hero.clientWidth - 2 * pad;
    if (longest.offsetWidth > room) name.style.fontSize = `${Math.floor(fs * room / longest.offsetWidth)}px`;
  }
  let lastW = innerWidth;
  document.fonts.ready.then(fitName);
  addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; fitName(); } });
  fitName();
  requestAnimationFrame(() => { name.classList.add("is-in"); hero.classList.add("is-in"); });

  // ---------- Reveals ----------
  const rev = $$(".heavy, .chip, .paint-head > *, .easel, .paint-cta, .tile, .lines li, .panel > *, .book .statement, .bar, .book .small, .ft");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.12 });
    rev.forEach(el => io.observe(el));
  }

  // ---------- The canvas: paint with the studio's colours ----------
  const wrap = $(".canvas-wrap"), canvas = $("[data-canvas]"), ctx = canvas.getContext("2d");
  const ghost = $("[data-ghost]"), hint = $("[data-hint]");
  let colour = "#f2557a", size = 16, drawing = false, last = null, painted = false;
  function sizeCanvas() {
    const r = wrap.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (canvas.width === w && canvas.height === h) return;
    // keep what has been painted when the canvas changes size
    const keep = document.createElement("canvas");
    keep.width = canvas.width; keep.height = canvas.height;
    if (canvas.width) keep.getContext("2d").drawImage(canvas, 0, 0);
    canvas.width = w; canvas.height = h;
    if (keep.width) ctx.drawImage(keep, 0, 0, w, h);
  }
  // brush sizes are given for a 600px-wide canvas and scale with it
  const scale = () => canvas.width / 600;
  const point = e => { const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height }; };
  function dot(p) {
    ctx.fillStyle = colour; ctx.globalAlpha = .92;
    ctx.beginPath(); ctx.arc(p.x, p.y, size * scale() / 2, 0, Math.PI * 2); ctx.fill();
  }
  function stroke(a, b) {
    ctx.strokeStyle = colour; ctx.lineWidth = size * scale(); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.globalAlpha = .92;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  }
  canvas.addEventListener("pointerdown", e => {
    e.preventDefault(); sizeCanvas();
    drawing = true; canvas.setPointerCapture(e.pointerId);
    last = point(e); dot(last);
    if (!painted) { painted = true; hint.classList.add("gone"); }
  });
  canvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    evs.forEach(ev => { const p = point(ev); stroke(last, p); last = p; });
  });
  const stop = () => { drawing = false; last = null; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);
  new ResizeObserver(sizeCanvas).observe(wrap);
  sizeCanvas();

  function radios(group, attr, onPick) {
    const btns = $$("button", group);
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => x.setAttribute("aria-checked", String(x === b)));
      onPick(b.dataset[attr]);
    }));
    group.addEventListener("keydown", e => {
      if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
      e.preventDefault();
      const i = btns.findIndex(b => b.getAttribute("aria-checked") === "true");
      const next = btns[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : btns.length - 1)) % btns.length];
      next.focus(); next.click();
    });
  }
  radios($("[data-swatches]"), "c", v => (colour = v));
  radios($("[data-sizes]"), "s", v => (size = Number(v)));
  const trace = $("[data-trace]");
  trace.addEventListener("click", () => {
    const on = trace.getAttribute("aria-pressed") !== "true";
    trace.setAttribute("aria-pressed", String(on));
    ghost.classList.toggle("off", !on);
  });
  $("[data-clear]").addEventListener("click", () => { ctx.clearRect(0, 0, canvas.width, canvas.height); });
  $("[data-save]").addEventListener("click", () => {
    // the saved picture is the visitor's own painting on paper, signed by the studio
    const out = document.createElement("canvas");
    out.width = canvas.width; out.height = canvas.height;
    const o = out.getContext("2d");
    o.fillStyle = "#fbf7ee"; o.fillRect(0, 0, out.width, out.height);
    o.drawImage(canvas, 0, 0);
    o.fillStyle = "#161615"; o.globalAlpha = .7;
    o.font = `500 ${Math.round(out.width / 32)}px "Hanken Grotesk", sans-serif`;
    o.textAlign = "right";
    o.fillText("Painted with Driftwood Studio, Grace Bay", out.width - out.width / 30, out.height - out.width / 30);
    const a = document.createElement("a");
    a.download = "my-driftwood-painting.png";
    a.href = out.toDataURL("image/png");
    document.body.appendChild(a); a.click(); a.remove();
  });

  // ---------- Booking bar → email to Lucie ----------
  const what = $("[data-what]"), when = $("input[name=when]"), send = $("[data-send]");
  function writeMail() {
    const w = when.value.trim();
    const body = `Hi Lucie,\n\nI'd love to book: ${what.value}.\n${w ? `When and how many: ${w}\n` : "When and how many: \n"}\nName:\nPhone or WhatsApp:\n\nThanks!`;
    send.href = `mailto:driftwoodtci@gmail.com?subject=${encodeURIComponent(what.value)}&body=${encodeURIComponent(body)}`;
  }
  what.addEventListener("change", writeMail);
  when.addEventListener("input", writeMail);
  writeMail();
  // a line on the class poster pre-selects it in the booking bar
  $$("[data-pick]").forEach(a => a.addEventListener("click", () => {
    const opt = [...what.options].find(o => o.text === a.dataset.pick);
    if (opt) { what.value = opt.value; writeMail(); }
  }));

  // ---------- Island time in the footer ----------
  const t = $("[data-time]");
  const tick = () => { t.textContent = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", hour: "numeric", minute: "2-digit" }).format(new Date()); };
  tick(); setInterval(tick, 30000);
})();
