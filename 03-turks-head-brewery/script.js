(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TZ = "America/Grand_Turk";
  const EMAIL = "info@turksheadbeer.com";

  // ---------- Island time ----------
  function islandNow() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date());
    const get = (t) => parts.find(p => p.type === t).value;
    const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    return { day, min: Number(get("hour")) * 60 + Number(get("minute")) };
  }
  const closeAt = (day) => (day >= 1 && day <= 4 ? 19 * 60 : 20 * 60);
  const OPEN = 12 * 60;
  const span = (m) => { const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h}h ${r}m` : `${h}h`) : `${r} min`; };
  const dayName = (d) => ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];

  function updateLive() {
    const { day, min } = islandNow();

    // open / closed
    const status = $("[data-status]");
    if (status) {
      const close = closeAt(day);
      if (min >= OPEN && min < close) {
        status.textContent = `Taproom open now, until ${close === 19 * 60 ? "7pm" : "8pm"}`;
        status.classList.add("is-open");
      } else if (min < OPEN) {
        status.textContent = `Taproom opens today at noon, in ${span(OPEN - min)}`;
        status.classList.remove("is-open");
      } else {
        status.textContent = "Taproom closed now, back tomorrow at noon";
        status.classList.remove("is-open");
      }
    }

    // next tour: 12pm Monday to Saturday
    const next = $("[data-next-tour]");
    if (next) {
      let d = day, inDays = 0;
      if (!(d !== 0 && min < OPEN)) {
        do { d = (d + 1) % 7; inDays++; } while (d === 0);
      }
      next.textContent = inDays === 0
        ? `Next tour: today at noon, in ${span(OPEN - min)}`
        : inDays === 1 ? "Next tour: tomorrow at noon" : `Next tour: ${dayName(d)} at noon`;
    }

    // happy hour: Mon–Thu 4:30–6pm
    const hh = $("[data-hh]");
    if (hh) {
      const big = $("[data-hh-big]"), small = $("[data-hh-small]");
      const start = 16 * 60 + 30, end = 18 * 60, hhDay = day >= 1 && day <= 4;
      if (hhDay && min >= start && min < end) {
        hh.classList.add("is-on");
        big.textContent = "Happy hour is on";
        small.textContent = `Ends in ${span(end - min)}. Draft beer, cocktails and shareable bites.`;
      } else if (hhDay && min < start) {
        hh.classList.remove("is-on");
        big.textContent = `Happy hour in ${span(start - min)}`;
        small.textContent = "Today 4:30–6pm. Draft beer, cocktails and shareable bites.";
      } else {
        hh.classList.remove("is-on");
        big.textContent = "Happy hour";
        small.textContent = "Monday to Thursday, 4:30–6pm. Draft beer, cocktails and shareable bites.";
      }
    }

    // today's hours
    $$("[data-days]").forEach(row => {
      row.classList.toggle("is-today", row.dataset.days.split(",").map(Number).includes(day));
    });
  }
  updateLive();
  setInterval(updateLive, 30000);

  // ---------- Bubbles in the hero ----------
  const bubbles = $("[data-bubbles]");
  if (bubbles && !reduce) {
    const n = window.innerWidth < 600 ? 16 : 34;
    for (let k = 0; k < n; k++) {
      const b = document.createElement("i");
      const size = 4 + Math.random() * 14;
      b.style.width = b.style.height = `${size}px`;
      b.style.left = `${Math.random() * 100}%`;
      b.style.animationDuration = `${6 + Math.random() * 9}s`;
      b.style.animationDelay = `${-Math.random() * 12}s`;
      b.style.setProperty("--dx", `${(Math.random() - 0.5) * 60}px`);
      b.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
      bubbles.appendChild(b);
    }
  }

  // ---------- Beers: fill glasses, colour the side pint ----------
  const root = document.documentElement;
  const beers = $$(".beer");
  if ("IntersectionObserver" in window) {
    const fio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-in"); } });
    }, { threshold: 0.3 });
    beers.forEach(b => fio.observe(b));
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) root.style.setProperty("--pc", e.target.dataset.beer); });
    }, { rootMargin: "-50% 0px -50% 0px" });
    beers.forEach(b => cio.observe(b));
  } else {
    beers.forEach(b => b.classList.add("is-in"));
  }

  // ---------- Scroll loop: pint, bar, parallax, catwalk ----------
  const pint = $("[data-pint]");
  const barPint = $("[data-bar-pint]");
  const barPintRead = $("[data-bar-pint-read]");
  const pintRead = $("[data-pint-read]");
  const bar = $("[data-bar]");
  const hero = $(".hero");
  const heroPhoto = $("[data-parallax]");
  const route = $(".route");
  let ticking = false;

  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = Math.min(1, y / max);
    root.style.setProperty("--fill", p.toFixed(3));
    if (barPint) {
      const full = p > 0.97;
      barPint.classList.toggle("is-full", full);
      if (barPintRead) barPintRead.textContent = full ? "Cheers!" : `${Math.round(p * 100)}%`;
    }
    if (pint) {
      pint.style.setProperty("--fill", p.toFixed(3));
      const full = p > 0.97;
      pint.classList.toggle("is-full", full);
      if (pintRead) pintRead.textContent = full ? "Cheers!" : `${Math.round(p * 100)}%`;
    }
    if (bar && hero) bar.classList.toggle("is-solid", y > hero.offsetHeight - 80);
    if (heroPhoto && !reduce && y < vh * 1.2) heroPhoto.style.transform = `translate3d(0, ${(y * 0.25).toFixed(1)}px, 0)`;
    if (route) {
      const r = route.getBoundingClientRect();
      const walk = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
      route.style.setProperty("--walk", walk.toFixed(3));
    }
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- Reveal ----------
  const reveals = $$(".beers-intro > *, .quiz-head, .quiz-form fieldset, .tour-head > *, .stop, .tap-media, .tap-text > *, .name-text > *, .trailer-text > *, .trailer-calc, .visit h2, .vg, .foot-mark");
  reveals.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) {
    reveals.forEach(el => el.classList.add("is-in"));
  } else {
    const rio = new IntersectionObserver((entries) => {
      entries.filter(e => e.isIntersecting).forEach((e, n) => {
        e.target.style.transitionDelay = `${n * 80}ms`;
        e.target.classList.add("is-in");
        rio.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(el => rio.observe(el));
  }

  // ---------- Quiz ----------
  const BEERS = beers.map(b => ({
    name: b.querySelector(".beer-name").textContent,
    style: b.querySelector(".beer-style").textContent.split("·")[0].trim(),
    means: b.querySelector(".beer-means strong").textContent,
    c: b.dataset.beer, ink: b.dataset.ink,
  }));
  // 0 I-Soon-Reach, 1 I-Ain-Ga-Lie, 2 Down-Da-Road, 3 Gon-Ta-Nort, 4 Gon-Ta-Sout
  const SCORE = {
    q1: { a: [2, 1, 0, 0, 0], b: [0, 0, 2, 1, 0], c: [0, 0, 0, 1, 2] },
    q2: { a: [2, 1, 0, 0, 0], b: [0, 1, 1, 1, 0], c: [0, 0, 0, 1, 2] },
    q3: { a: [2, 0, 0, 0, 0], b: [0, 2, 1, 0, 0], c: [0, 0, 1, 1, 1] },
  };
  const WHY = [
    "You're on island time. Light, crisp, and in no hurry at all.",
    "Straightforward and golden. You like your beer like your friends: honest.",
    "You want something with a bit of bite. Hops, bitterness, opinions.",
    "Easygoing with some depth. Copper, toasty, good for a long chat.",
    "You came for the night. Dark, roasty and smooth to the last sip.",
  ];
  const quiz = $("[data-quiz]");
  const result = $("[data-quiz-result]");
  if (quiz && result && BEERS.length === 5) {
    quiz.addEventListener("change", () => {
      const a = { q1: quiz.q1.value, q2: quiz.q2.value, q3: quiz.q3.value };
      if (!a.q1 || !a.q2 || !a.q3) {
        const left = Object.values(a).filter(v => !v).length;
        result.innerHTML = `<p class="qr-pre">${left} more to go…</p>`;
        return;
      }
      const total = [0, 0, 0, 0, 0];
      Object.entries(a).forEach(([q, v]) => SCORE[q][v].forEach((s, i) => { total[i] += s; }));
      const best = total.indexOf(Math.max(...total));
      const b = BEERS[best];
      result.style.background = b.c;
      result.style.color = b.ink;
      result.innerHTML = `
        <p class="qr-pre" style="color:inherit;opacity:.85">You're a…</p>
        <p class="qr-name">${b.name}</p>
        <p class="qr-means">${b.means} · ${b.style}</p>
        <p class="qr-why">${WHY[best]}</p>
        <a class="btn btn-red" href="#visit">Have one at the Taproom</a>`;
      result.classList.remove("is-poured"); void result.offsetWidth; result.classList.add("is-poured");
      root.style.setProperty("--pc", b.c);
    });
  }

  // ---------- Trailer calculator ----------
  const tc = $("[data-trailer]");
  if (tc) {
    let hours = 3;
    const hEl = $("[data-tc-hours]"), pEl = $("[data-tc-price]"), mail = $("[data-tc-mail]");
    const render = () => {
      const price = 350 + 50 * (hours - 3);
      hEl.textContent = hours;
      pEl.textContent = `$${price}`;
      pEl.classList.remove("bump"); void pEl.offsetWidth; pEl.classList.add("bump");
      const body = `Hi Turk's Head,\n\nWe'd love the mobile trailer for a ${hours}-hour event (estimate $${price} plus beer).\nDate: \nLocation on Provo: \nType of event: \nGuests: \nName and phone: `;
      mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Mobile trailer, ${hours} hours`)}&body=${encodeURIComponent(body)}`;
    };
    $$("[data-tc]").forEach(btn => btn.addEventListener("click", () => {
      hours = Math.max(3, Math.min(12, hours + Number(btn.dataset.tc)));
      render();
    }));
    render();
  }
})();
