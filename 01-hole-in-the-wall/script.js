(() => {
  const TZ = "America/Grand_Turk";
  const OPEN_MIN = 7 * 60;   // 7:00am
  const CLOSE_MIN = 21 * 60; // 9:00pm
  const PHONE = "+16499414136";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Minutes since midnight, Turks and Caicos time.
  function islandMinutes() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, hour: "numeric", minute: "numeric", hourCycle: "h23",
    }).formatToParts(new Date());
    const h = Number(parts.find(p => p.type === "hour").value);
    const m = Number(parts.find(p => p.type === "minute").value);
    return h * 60 + m;
  }

  function clock(min) {
    const m = ((min % 1440) + 1440) % 1440;
    let h = Math.floor(m / 60);
    const mm = String(m % 60).padStart(2, "0");
    const suffix = h >= 12 ? "pm" : "am";
    h = h % 12 || 12;
    return `${h}:${mm}${suffix}`;
  }

  function span(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h} h ${m} min`;
    if (h) return `${h} h`;
    return `${m} min`;
  }

  // ---------- Open now ----------
  const openEl = document.querySelector("[data-open-now]");
  function updateOpen() {
    if (!openEl) return;
    const now = islandMinutes();
    if (now >= OPEN_MIN && now < CLOSE_MIN) {
      const left = CLOSE_MIN - now;
      openEl.textContent = left <= 60 ? `Open now, kitchen closes in ${left} min` : "Open now, until 9pm";
      openEl.classList.add("is-open");
      openEl.classList.remove("is-closed");
    } else {
      openEl.textContent = "Closed now, opens at 7am";
      openEl.classList.add("is-closed");
      openEl.classList.remove("is-open");
    }
  }
  updateOpen();
  setInterval(updateOpen, 60000);

  // ---------- Between flights ----------
  const form = document.querySelector("[data-layover]");
  const verdict = document.querySelector("[data-verdict]");
  if (form && verdict) {
    const big = verdict.querySelector(".verdict-big");
    const small = verdict.querySelector(".verdict-small");

    const run = (e) => {
      if (e) e.preventDefault();
      const dep = form.dep.value;
      if (!dep) return;
      const [h, m] = dep.split(":").map(Number);
      let depMin = h * 60 + m;
      const checkIn = Number(form.kind.value);
      const travel = Number(form.go.value);
      const now = islandMinutes();
      if (depMin < now) depMin += 1440; // tomorrow's flight

      const leaveBy = depMin - checkIn - travel;
      const free = leaveBy - now;
      const kitchenOpen = now >= OPEN_MIN && now < CLOSE_MIN;

      let headline = `Leave the table by ${clock(leaveBy)}`;
      let note;
      if (!kitchenOpen) {
        note = `We're closed right now (open 7am–9pm). For a ${clock(depMin)} flight you'd still need to leave here by ${clock(leaveBy)}.`;
      } else if (free < 0) {
        headline = "Head to the airport";
        note = `For a ${clock(depMin)} departure you should already be on your way. Next trip, come hungry.`;
      } else if (free < 25) {
        note = `That's ${span(free)} from now. Call ahead and grab a jerk chicken to go: ${PHONE.replace("+1", "")}.`;
      } else if (free < 60) {
        note = `That's ${span(free)} from now. Enough for a plate of jerk chicken, peas and rice, and no dessert.`;
      } else {
        note = `That's ${span(free)} from now. Time for oxtail, a Red Stripe on the patio, and a slow walk to the gate.`;
      }
      big.textContent = headline;
      small.textContent = note;
      verdict.classList.remove("is-fresh");
      void verdict.offsetWidth;
      verdict.classList.add("is-fresh");
    };
    form.addEventListener("submit", run);
    form.addEventListener("change", () => { if (form.dep.value) run(); });
  }

  // ---------- Order ticket -> text message ----------
  const order = document.querySelector("[data-order]");
  if (order) {
    order.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = new FormData(order);
      const t = d.get("time");
      let pickup = t;
      if (t) { const [h, m] = t.split(":").map(Number); pickup = clock(h * 60 + m); }
      const body = `Hi Hole in the Wall, order for pickup at ${pickup}: ${d.get("dish")}. Jerk sauce ${d.get("heat")}. Name: ${d.get("name")}. Thanks!`;
      window.location.href = `sms:${PHONE}?&body=${encodeURIComponent(body)}`;
      const help = order.querySelector("[data-order-help]");
      if (help) help.innerHTML = `Your message app should open with the order filled in. Nothing happened? <a href="tel:${PHONE}">Call 941-4136</a> and read it out.`;
    });
  }

  // ---------- Hero crossfade (signature move) ----------
  const fade = document.querySelector("[data-crossfade]");
  if (fade && !reduceMotion) {
    const imgs = [...fade.querySelectorAll("img")];
    let i = 0;
    let timer = null;
    const step = () => {
      imgs[i].classList.remove("is-on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("is-on");
    };
    const start = () => { if (!timer) timer = setInterval(step, 5600); };
    const stop = () => { clearInterval(timer); timer = null; };
    start();
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
  }

  // ---------- Bar tone on scroll ----------
  const bar = document.querySelector(".bar");
  const onScroll = () => bar && bar.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // ---------- Ticket perforation position on phones ----------
  const ticket = document.querySelector(".ticket");
  const left = ticket && ticket.querySelector(".ticket-left");
  const placePerf = () => { if (ticket && left) ticket.style.setProperty("--perf", `${left.offsetHeight}px`); };
  placePerf();
  window.addEventListener("resize", placePerf);

  // ---------- Arches open as they arrive ----------
  const holes = document.querySelectorAll(".hole:not(.hero-hole)");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const hio = new IntersectionObserver((entries) => {
      entries.filter(e => e.isIntersecting).forEach((e, n) => {
        setTimeout(() => e.target.classList.add("is-open"), n * 90);
        hio.unobserve(e.target);
      });
    }, { threshold: 0.2 });
    holes.forEach(h => hio.observe(h));
  } else {
    holes.forEach(h => h.classList.add("is-open"));
  }

  // ---------- Entrances, staggered within each section ----------
  const items = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || reduceMotion) {
    items.forEach(el => el.classList.add("is-in"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    const entering = entries.filter(en => en.isIntersecting);
    entering.forEach((en, n) => {
      en.target.style.transitionDelay = `${n * 75}ms`;
      en.target.classList.add("is-in");
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach(el => io.observe(el));
})();
