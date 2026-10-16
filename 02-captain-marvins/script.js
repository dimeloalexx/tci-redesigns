(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const PHONE = "+16492310643";
  const EMAIL = "managertc@yahoo.com";
  const TAX = 0.12;
  const MAX_GUESTS = 12;
  const MAX_ALT = 500;

  // ---------- Bar + dock ----------
  const bar = $("[data-bar]");
  const hero = $(".hero");
  const dock = $("[data-dock]");
  const builder = $(".builder");
  let builderVisible = false;
  if (builder && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => { builderVisible = e.isIntersecting; }, { threshold: 0.15 }).observe(builder);
  }

  // ---------- Flight story ----------
  const steps = $$(".step");
  const stages = $$("[data-stage]");
  let activeAlt = 0;
  function setStep(i) {
    steps.forEach((s, n) => s.classList.toggle("is-active", n === i));
    stages.forEach(s => s.classList.toggle("is-on", Number(s.dataset.stage) === i));
    activeAlt = Number(steps[i].dataset.alt) || 0;
  }
  // phones: each step carries its own picture and altitude instead of the pinned stage
  steps.forEach((s, n) => {
    const src = stages[n] && stages[n].querySelector("img");
    if (!src) return;
    const pic = document.createElement("div");
    pic.className = "step-pic";
    pic.setAttribute("aria-hidden", "true");
    const img = src.cloneNode();
    img.loading = "lazy";
    const tag = document.createElement("span");
    tag.textContent = `${s.dataset.alt} ft`;
    pic.append(img, tag);
    s.prepend(pic);
  });
  if (steps.length) {
    setStep(0);
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) setStep(steps.indexOf(e.target)); });
      }, { rootMargin: "-45% 0px -45% 0px" });
      steps.forEach(s => io.observe(s));
    }
  }

  // ---------- Altimeter ----------
  const alt = $("[data-altimeter]");
  const altNum = $("[data-alt-num]");
  const stageAlt = $("[data-stage-alt]");
  const flight = $(".flight");
  const finalSec = $(".final");
  let shown = 0;

  function targetAlt() {
    const y = window.scrollY;
    const vh = window.innerHeight;
    const top = (el) => el.getBoundingClientRect().top + y;
    if (!flight) return 0;
    const fTop = top(flight);
    const fEnd = fTop + flight.offsetHeight;
    if (y + vh * 0.5 < fTop) {
      // still on the beach: a little lift as the hero scrolls away
      return Math.max(0, Math.min(40, (y / Math.max(1, fTop)) * 40));
    }
    if (y + vh * 0.5 < fEnd) return activeAlt;
    if (finalSec) {
      const docEnd = document.documentElement.scrollHeight - vh;
      const start = top(finalSec) - vh;
      if (y > start) {
        const t = Math.min(1, (y - start) / Math.max(1, docEnd - start));
        return 450 * (1 - t);
      }
    }
    return 450;
  }

  function frame() {
    const target = targetAlt();
    shown += (target - shown) * (reduce ? 1 : 0.08);
    if (Math.abs(target - shown) < 0.5) shown = target;
    const rounded = Math.round(shown / 5) * 5;
    if (altNum) altNum.textContent = rounded;
    if (stageAlt) stageAlt.textContent = rounded;
    if (alt) alt.style.setProperty("--alt", (shown / MAX_ALT).toFixed(3));

    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 600;
    if (bar) bar.classList.toggle("is-solid", y > heroH - 90);
    if (dock) dock.classList.toggle("is-on", y > heroH * 0.7 && !builderVisible);

    if (!reduce) parallax();
    requestAnimationFrame(frame);
  }

  // ---------- Parallax ----------
  const pars = $$("[data-parallax]");
  function parallax() {
    const vh = window.innerHeight;
    pars.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 around centre
      el.style.transform = `translate3d(0, ${(p * -6).toFixed(2)}%, 0)`;
    });
  }
  requestAnimationFrame(frame);

  // ---------- Counters ----------
  const fmt = (n, dec) => n.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  function count(el) {
    const end = Number(el.dataset.count);
    const dec = Number(el.dataset.decimals || 0);
    if (reduce) { el.textContent = fmt(end, dec); return; }
    const dur = 1600;
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(end * e, dec);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  const counters = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { count(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  }

  // ---------- Reveal (staggered per batch) ----------
  const revealSel = ".proof-item, .flight-title, .prices-head > *, .plan, .builder-form, .ticket, .kids-text > *, .safety h2, .safety-point, .safety-photo, .faq h2, details, .final-inner > *, .foot-mark, .foot-grid > div";
  const reveals = $$(revealSel);
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
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(el => rio.observe(el));
  }

  // ---------- Build your flight ----------
  const form = $("[data-builder]");
  if (!form) return;
  const state = { flyers: 2, observers: 0 };
  const out = {
    flyers: $('[data-val="flyers"]'),
    observers: $('[data-val="observers"]'),
    total: $("[data-total]"),
    lines: $("[data-lines]"),
    note: $("[data-note]"),
    nudge: $("[data-nudge]"),
    book: $("[data-book]"),
  };
  const money = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // default the date to tomorrow
  const dateInput = $("[data-date]");
  if (dateInput) {
    const d = new Date(); d.setDate(d.getDate() + 1);
    dateInput.value = d.toISOString().slice(0, 10);
    dateInput.min = new Date().toISOString().slice(0, 10);
  }

  function render() {
    const early = form.slot.value === "early";
    const rate = early ? 80 : 90;
    const style = form.style.value;
    const { flyers, observers } = state;
    out.flyers.textContent = flyers;
    out.observers.textContent = observers;

    const sub = flyers * rate + observers * 25;
    const total = sub * (1 + TAX);
    const prev = out.total.textContent;
    out.total.textContent = money(total);
    if (prev !== out.total.textContent && !reduce) {
      out.total.classList.remove("bump"); void out.total.offsetWidth; out.total.classList.add("bump");
    }
    let lines = `${flyers} flyer${flyers > 1 ? "s" : ""} × $${rate}`;
    if (observers) lines += ` + ${observers} watching × $25`;
    out.lines.textContent = `${lines} + 12% tax`;

    let note;
    if (style === "single") note = "Solo: just you on the line, about 12–15 minutes up. Minimum 100 lbs per flight.";
    else if (style === "tandem") note = flyers < 2
      ? "Tandem needs two flyers. Add someone, or switch to solo."
      : `Tandem: two on one line, up to 450 lbs combined. Kids fly tandem with an adult.${flyers % 2 ? " With an odd number, one of you flies solo or joins a triple." : ""}`;
    else note = flyers < 3
      ? "Triple needs three flyers. Add someone, or pick tandem."
      : "Triple: three across. Whether it's possible depends on the wind and your combined weight, and the captain decides on the day.";
    out.note.textContent = note;

    // honest nudge toward a private boat when the group is big
    const privateTotal = 950 * (1 + TAX);
    if (flyers + observers >= 8) {
      out.nudge.hidden = false;
      out.nudge.textContent = total >= privateTotal
        ? `A private hour is ${money(privateTotal)} for up to 12, and you can fly more than once. That beats ${money(total)}.`
        : `For ${money(privateTotal)} the whole boat is yours for an hour and everyone can fly more than once.`;
    } else {
      out.nudge.hidden = true;
    }

    const date = dateInput && dateInput.value ? new Date(dateInput.value + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "a date to confirm";
    const subject = `Parasail booking request: ${flyers} flyer${flyers > 1 ? "s" : ""}, ${date}`;
    const body = [
      "Hi Captain Marvin's,",
      "",
      "I'd like to book a parasail flight:",
      `Date: ${date}`,
      `Time: ${early ? "before 10am (early bird $80)" : "after 10am ($90)"}`,
      `Flyers: ${flyers} (${style})`,
      `Observers: ${observers}`,
      `Estimated total: ${money(total)} incl. 12% tax`,
      "",
      "Where should we meet / pickup location: ",
      "Name and phone: ",
    ].join("\n");
    out.book.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  $$("[data-step-btn]").forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.stepBtn;
      const next = state[key] + Number(btn.dataset.delta);
      const min = key === "flyers" ? 1 : 0;
      const room = MAX_GUESTS - (key === "flyers" ? state.observers : state.flyers);
      state[key] = Math.max(min, Math.min(room, next));
      render();
    });
  });
  form.addEventListener("change", render);
  render();
})();
