(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PRICE = 3; // about $3 a patty

  // ---------- Split headlines into words (staggered 70ms) ----------
  $$("[data-words]").forEach(h => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = words.map((w, i) => `<span class="w" aria-hidden="true" style="transition-delay:${i * 70}ms">${w}</span>`).join(" ");
  });

  // ---------- Crimp path length for the draw ----------
  const crimpPath = $("[data-draw]");
  if (crimpPath && crimpPath.getTotalLength) crimpPath.closest("svg").style.setProperty("--len", Math.ceil(crimpPath.getTotalLength()));

  // ---------- Reveal once (headlines, crimp, photos, blocks) ----------
  const targets = [...$$("[data-words]"), $(".crimp"), $(".scoop-photos"), ...$$(".split img, .split-text > *, .scoops-text p, .q, .result, .visit-card")].filter(Boolean);
  targets.forEach(el => { if (!el.hasAttribute("data-words") && !el.matches(".crimp, .scoop-photos")) el.setAttribute("data-reveal", ""); });
  if (!("IntersectionObserver" in window) || reduce) {
    targets.forEach(el => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.filter(e => e.isIntersecting).forEach((e, n) => {
        if (e.target.hasAttribute("data-reveal")) e.target.style.transitionDelay = `${n * 80}ms`;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    targets.forEach(el => io.observe(el));
  }

  // ---------- Open now (Turks & Caicos time) ----------
  const HOURS = { 0: [11 * 60, 22 * 60], 1: [600, 1230], 2: [600, 1230], 3: [600, 1230], 4: [600, 1320], 5: [600, 1320], 6: [600, 1320] };
  const fmt = (m) => { const h = Math.floor(m / 60), mm = m % 60; return `${((h + 11) % 12) + 1}${mm ? ":" + String(mm).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; };
  function islandNow() {
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const g = (t) => p.find(x => x.type === t).value;
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(g("weekday")), min: +g("hour") * 60 + +g("minute") };
  }
  function updateStatus() {
    const { day, min } = islandNow();
    const [open, close] = HOURS[day];
    const s = $("[data-status]");
    if (min >= open && min < close) { s.textContent = `Open now · till ${fmt(close)}`; s.classList.add("is-open"); }
    else if (min < open) { s.textContent = `Opens today at ${fmt(open)}`; s.classList.remove("is-open"); }
    else { s.textContent = `Closed now · opens tomorrow at ${fmt(HOURS[(day + 1) % 7][0])}`; s.classList.remove("is-open"); }
    $$("[data-days]").forEach(r => r.classList.toggle("is-today", r.dataset.days.split(",").map(Number).includes(day)));
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  // ---------- Beach bag calculator ----------
  let people = 4, hunger = 2;
  const out = { people: $("[data-people]"), count: $("[data-count]"), cost: $("[data-cost]"), pile: $("[data-pile]") };
  function render() {
    const n = people * hunger;
    out.people.textContent = people;
    out.count.textContent = n;
    out.cost.textContent = `About $${n * PRICE} · plus scoops for dessert`;
    out.pile.innerHTML = Array.from({ length: Math.min(n, 30) }, (_, i) => `<i style="animation-delay:${Math.min(i, 15) * 35}ms"></i>`).join("");
  }
  $$("[data-p]").forEach(b => b.addEventListener("click", () => { people = Math.max(1, Math.min(30, people + Number(b.dataset.p))); render(); }));
  $$("[data-h]").forEach(b => b.addEventListener("click", () => {
    hunger = Number(b.dataset.h);
    $$("[data-h]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));
  render();

  // ---------- Scroll: cone scoops, bar shadow, call button ----------
  const cone = $("[data-cone]"), bar = $(".bar"), fab = $("[data-fab]"), hero = $(".hero");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const p = y / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const k = p > .75 ? 3 : p > .45 ? 2 : p > .15 ? 1 : 0;
    cone.classList.remove("k1", "k2", "k3");
    if (k) cone.classList.add("k" + k);
    bar.classList.toggle("is-scrolled", y > 10);
    fab.classList.toggle("is-on", y > hero.offsetHeight * .7);
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
