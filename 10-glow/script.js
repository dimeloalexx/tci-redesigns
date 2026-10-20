(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desk = window.matchMedia("(min-width: 1000px)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- The two halves of the sentence, fitted to their measure ----------
  const halves = $$("[data-fit]"), reelWin = $(".reel-window");
  function fitHalves() {
    halves.forEach(h => (h.style.fontSize = ""));
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad")) || 16;
    const longest = halves.reduce((a, h) => (h.scrollWidth > a.scrollWidth ? h : a));
    const fs = parseFloat(getComputedStyle(longest).fontSize);
    // desktop: from the margin to 24px short of the frame; phone: the full width
    const room = desk.matches ? reelWin.getBoundingClientRect().left - pad - 24 : innerWidth - 2 * pad;
    const size = Math.min(fs * room / longest.scrollWidth, desk.matches ? innerHeight * 0.3 : innerWidth * 0.3);
    halves.forEach(h => (h.style.fontSize = `${size}px`));
  }
  const giant = $(".giant");
  function fitGiant() {
    giant.style.fontSize = "";
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad")) || 16;
    const fs = parseFloat(getComputedStyle(giant).fontSize);
    giant.style.fontSize = `${Math.floor(fs * (innerWidth - 2 * pad) / giant.scrollWidth)}px`;
  }
  const fitAll = () => { fitHalves(); fitGiant(); };
  document.fonts.ready.then(fitAll);
  let lastW = innerWidth;
  addEventListener("resize", () => { if (innerWidth !== lastW) { lastW = innerWidth; fitAll(); } });
  fitAll();

  // ---------- Reveals ----------
  const rev = $$(".features .picture-para, .ft-foot, .price-foot, .pl-inputs > *, .pl-result, .facts li, .bio > *, .contact-ask, .contact-corners, .foot-top > *");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.12 });
    rev.forEach(el => io.observe(el));
  }

  // ---------- Videos only play while they are on screen ----------
  // They are short, silent loops of Nancy's own workouts, so they keep playing with reduced motion too.
  // When a phone refuses to autoplay (iPhone Low Power Mode, in-app browsers), swap the clip for an <img>
  // pointing at the same MP4: Safari animates MP4 in an image; anything else falls back to the poster.
  function toImage(v) {
    if (!v.isConnected) return;
    const img = new Image();
    img.className = v.className; img.alt = ""; img.setAttribute("aria-hidden", "true");
    img.onerror = () => { img.onerror = null; img.src = v.getAttribute("poster"); };
    img.src = v.getAttribute("src");
    v.replaceWith(img);
  }
  const vids = $$("video");
  const tryPlay = v => { if (v.preload === "none") v.preload = "auto"; const p = v.play(); if (p) p.catch(err => { if (err && err.name === "NotAllowedError") toImage(v); }); };
  if ("IntersectionObserver" in window) {
    const vio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) tryPlay(e.target); else if (e.target.isConnected) e.target.pause();
    }), { rootMargin: "200px 0px" });
    vids.filter(v => !v.closest(".reel")).forEach(v => vio.observe(v));
  } else vids.forEach(tryPlay);

  // ---------- Class card planner ----------
  const PACKS = [{ n: 20, cost: 460, months: 6 }, { n: 10, cost: 240, months: 4 }, { n: 5, cost: 125, months: 2 }, { n: 1, cost: 30 }];
  const state = { nights: 7, week: 3 };
  const out = {
    nights: $("[data-nights]"), total: $("[data-total]"), dots: $("[data-classdots]"), best: $("[data-best]"),
    cost: $("[data-cost]"), each: $("[data-each]"), note: $("[data-note]"), wa: $("[data-wa]"), mail: $("[data-mail]"),
  };
  // cheapest way to cover at least n classes
  function cheapest(n) {
    const max = n + 20, dp = Array(max + 1).fill(Infinity), pick = Array(max + 1).fill(null);
    dp[0] = 0;
    for (let k = 1; k <= max; k++) PACKS.forEach(p => { const prev = Math.max(0, k - p.n); if (dp[prev] + p.cost < dp[k]) { dp[k] = dp[prev] + p.cost; pick[k] = p; } });
    let bestK = n;
    for (let k = n; k <= max; k++) if (dp[k] < dp[bestK]) bestK = k;
    const counts = new Map(); let k = bestK, covered = 0;
    while (k > 0) { const p = pick[k]; counts.set(p, (counts.get(p) || 0) + 1); covered += p.n; k = Math.max(0, k - p.n); }
    return { cost: dp[bestK], covered, counts };
  }
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
  const list = a => a.length < 2 ? a.join("") : `${a.slice(0, -1).join(", ")} and ${a[a.length - 1]}`;
  function describe(counts) {
    return PACKS.filter(p => counts.get(p)).map(p => p.n === 1 ? plural(counts.get(p), "drop-in") : `${counts.get(p) > 1 ? counts.get(p) + " × " : ""}${p.n}-class card`).join(" + ");
  }
  function render() {
    const n = Math.max(1, Math.round(state.nights / 7 * state.week));
    const { cost, covered, counts } = cheapest(n);
    const spare = covered - n;
    out.nights.textContent = state.nights;
    out.total.textContent = n;
    $("[data-total-word]").textContent = n === 1 ? "class" : "classes";
    const label = describe(counts);
    out.best.textContent = label;
    out.cost.textContent = `$${cost}`;
    out.each.textContent = `$${(cost / covered).toFixed(2).replace(/\.00$/, "")} a class`;
    const saved = n * 30 - cost;
    const cards = PACKS.filter(p => p.n > 1 && counts.get(p));
    let note = saved > 0 ? `You save $${saved} against paying $30 a class.` : "Drop-ins are the simplest for a short stay.";
    if (spare > 0) note += ` That leaves ${plural(spare, "class")} to spare${cards.length ? `; the card is valid for ${cards[0].months} months` : ""}.`;
    out.note.textContent = note;

    // the classes, drawn as dots grouped into the cards that pay for them
    let left = n, html = "";
    PACKS.forEach(p => {
      for (let i = 0; i < (counts.get(p) || 0); i++) {
        const used = Math.min(left, p.n); left -= used;
        const dots = Array.from({ length: p.n }, (_, j) => `<span class="dot${j >= used ? " spare" : ""}" style="animation-delay:${j * 18}ms"></span>`).join("");
        html += p.n === 1 ? `<span class="card-group drop">${dots}</span>` : `<span class="card-group">${dots}</span>`;
      }
    });
    out.dots.innerHTML = html;

    const extras = $$("input[name=extra]:checked").map(i => i.value);
    const rent = $$("input[name=rent]:checked").map(i => i.value);
    let msg = `Hi Nancy! I'm in Provo for ${plural(state.nights, "night")} and would like to do ${plural(n, "GFIT45 class")} (${label}).`;
    if (extras.length) msg += ` I'd also love ${list(extras)}.`;
    if (rent.length) msg += ` Could we rent ${list(rent)} for our villa?`;
    msg += " My dates are: ";
    out.wa.href = `https://wa.me/16494424852?text=${encodeURIComponent(msg)}`;
    out.mail.href = `mailto:glowtci@gmail.com?subject=${encodeURIComponent("GFIT45 classes during my stay")}&body=${encodeURIComponent(msg)}`;
  }
  $$("[data-step]").forEach(b => b.addEventListener("click", () => {
    state.nights = Math.max(1, Math.min(60, state.nights + Number(b.dataset.d)));
    render();
  }));
  const weekBtns = $$("[data-week] button");
  weekBtns.forEach(b => b.addEventListener("click", () => {
    state.week = Number(b.dataset.v);
    weekBtns.forEach(x => x.setAttribute("aria-checked", String(x === b)));
    render();
  }));
  $("[data-week]").addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const i = weekBtns.findIndex(b => b.getAttribute("aria-checked") === "true");
    const next = weekBtns[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : weekBtns.length - 1)) % weekBtns.length];
    next.focus(); next.click();
  });
  $$("input[name=extra], input[name=rent]").forEach(i => i.addEventListener("change", render));
  render();

  // ---------- Scroll: the reel, the dock and the GFIT45 clock ----------
  // Everything is measured once (and again only when the width changes); a scroll frame does arithmetic only.
  const hero = $("[data-hero]"), reel = $("[data-reel]"), frames = $$(".frame", reel);
  const dock = $("[data-dock]"), clock = $("[data-clock]"), contact = $("#contact"), plan = $("#plan");
  const top = el => el.getBoundingClientRect().top + scrollY;
  let m = {};
  function measure() {
    m = {
      heroTop: top(hero), heroRun: Math.max(1, hero.offsetHeight - innerHeight), heroBottom: top(hero) + hero.offsetHeight,
      step: frames[0].offsetHeight + (parseFloat(getComputedStyle(reel).rowGap) || 0),
      planTop: top(plan), planBottom: top(plan) + plan.offsetHeight, contactTop: top(contact),
      max: Math.max(1, document.documentElement.scrollHeight - innerHeight), vh: innerHeight,
    };
  }
  // the first reel frame is a clip: it plays only while it is the frame in the middle
  let clipOn = null;
  function heroClip(on) {
    if (on === clipOn) return;
    clipOn = on;
    const el = frames[0].firstElementChild;
    if (el.tagName === "VIDEO") { if (on) tryPlay(el); else el.pause(); }
    else if (el.tagName === "IMG") el.src = on ? "assets/clip-mural.mp4" : "assets/clip-mural.jpg";
  }
  let ticking = false, lastClock = "", lastDock = null;
  function onScroll() {
    ticking = false;
    const y = scrollY;
    const p = Math.min(1, Math.max(0, (y - m.heroTop) / m.heroRun));
    reel.style.transform = `translate3d(0, ${(-p * (frames.length - 1) * m.step).toFixed(1)}px, 0)`;
    heroClip(p < 0.2 && y < m.heroBottom);
    const secs = Math.round(45 * 60 * (1 - Math.min(1, y / m.max)));
    const txt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
    if (txt !== lastClock) { clock.textContent = txt; lastClock = txt; }
    const atPlan = m.planTop < y + m.vh && m.planBottom > y;
    const show = m.heroBottom - y < m.vh * 0.5 && m.contactTop - y > m.vh * 0.6 && !atPlan;
    if (show !== lastDock) { dock.classList.toggle("is-on", show); lastDock = show; }
  }
  const refresh = () => { measure(); onScroll(); };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  let lastWidth = innerWidth;
  addEventListener("resize", () => { if (innerWidth !== lastWidth) { lastWidth = innerWidth; refresh(); } });
  addEventListener("load", refresh);
  document.fonts.ready.then(refresh);
  // the class planner and reveals can change the page height a little; re-measure now and then
  setInterval(measure, 2000);
  refresh();
})();
