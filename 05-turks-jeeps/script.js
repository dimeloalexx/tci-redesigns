(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "turksjeeps@gmail.com";

  // Places from Turks Jeeps' own island guide, ordered east → west from their Long Bay base.
  // stay: suggested minutes at the stop; rough: reached on unpaved roads (Jeep country).
  const SPOTS = [
    { id: "long-bay", name: "Long Bay Beach", stay: 90, note: "Shallow, calm water and kiteboarders, minutes from our base." },
    { id: "the-hole", name: "The Hole", stay: 20, note: "A deep limestone sinkhole hidden in Long Bay Hills. Look, don't climb." },
    { id: "grace-bay", name: "Grace Bay", stay: 120, note: "The famous one: miles of white sand and calm turquoise water." },
    { id: "smiths-reef", name: "Smith's Reef", stay: 90, note: "Snorkel straight from the shore near Turtle Cove. Bring a mask." },
    { id: "cheshire", name: "Cheshire Hall Plantation", stay: 45, note: "Ruins of a Loyalist-era cotton plantation in the middle of the island." },
    { id: "chalk-sound", name: "Chalk Sound", stay: 60, note: "An unreal turquoise lagoon dotted with tiny islands." },
    { id: "west-harbour", name: "West Harbour Bluff", stay: 60, rough: true, note: "Remote cliffs and quiet coves at the far southwest." },
    { id: "northwest-point", name: "Northwest Point", stay: 90, rough: true, note: "Wild, empty beaches at the end of a sandy track. This is what the Jeep is for." },
  ];
  const picked = new Set();

  const spotsEl = $("[data-spots]");
  SPOTS.forEach(s => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "spot";
    b.textContent = s.name;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      if (picked.has(s.id)) picked.delete(s.id); else picked.add(s.id);
      b.setAttribute("aria-pressed", String(picked.has(s.id)));
      renderPlan();
    });
    spotsEl.appendChild(b);
  });

  const clock = (min) => {
    const h = Math.floor(min / 60), m = min % 60;
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
  };

  const planEl = $("[data-plan]");
  const mail = $("[data-plan-mail]");
  function renderPlan() {
    const stops = SPOTS.filter(s => picked.has(s.id));
    planEl.innerHTML = "";
    if (!stops.length) {
      planEl.innerHTML = '<li class="plan-empty">Pick a few places above.</li>';
      mail.href = `mailto:${EMAIL}`;
      return;
    }
    let t = 9 * 60; // leave at 9am
    let lunchDone = false;
    const lines = [];
    const add = (html, cls) => { const li = document.createElement("li"); if (cls) li.className = cls; li.innerHTML = html; planEl.appendChild(li); };
    add(`<b>${clock(t)} · Pick up your Jeep</b><small>Long Bay Hills, or straight from the airport.</small>`);
    lines.push(`${clock(t)} Pick up the Jeep`);
    t += 20;
    stops.forEach((s, i) => {
      if (!lunchDone && t >= 12 * 60) {
        const west = stops.slice(i).some(x => ["chalk-sound", "west-harbour", "northwest-point", "cheshire"].includes(x.id));
        const spot = west ? "Da Conch Shack, Blue Hills" : "Coco Van, Grace Bay";
        add(`<b>${clock(t)} · Lunch</b><small>${spot}</small>`, "lunch");
        lines.push(`${clock(t)} Lunch at ${spot}`);
        t += 60; lunchDone = true;
      }
      add(`<b>${clock(t)} · ${s.name}</b><small>${s.note}</small>${s.rough ? '<br><span class="rough">Unpaved road · Jeep country</span>' : ""}`);
      lines.push(`${clock(t)} ${s.name}`);
      t += s.stay + 20;
    });
    add(`<b>${clock(t)} · Sunset, top down</b><small>Back along the coast with the roof off.</small>`);
    lines.push(`${clock(t)} Sunset drive back`);
    const body = `Hi Turks Jeeps,\n\nI'm planning a road trip and would like a Jeep:\n\n${lines.join("\n")}\n\nDates:\nArriving flight (for airport pickup):\nJeep (automatic / manual / 4xe hybrid):\nName and phone:`;
    mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Jeep rental for my road trip")}&body=${encodeURIComponent(body)}`;
  }
  renderPlan();

  // ---------- Road, odometer, dock, parallax ----------
  const root = document.documentElement;
  const odo = $("[data-odo]");
  const jeep = $("[data-road-jeep]");
  const dock = $("[data-dock]");
  const hero = $(".hero");
  const trip = $("#trip");
  const pars = $$("[data-parallax]");
  let ticking = false, idle;
  function onScroll() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    const p = Math.min(1, y / Math.max(1, document.documentElement.scrollHeight - vh));
    root.style.setProperty("--drive", p.toFixed(4));
    if (odo) odo.textContent = Math.round(p * 100);
    if (jeep && !reduce) {
      jeep.classList.add("bump");
      clearTimeout(idle);
      idle = setTimeout(() => jeep.classList.remove("bump"), 180);
    }
    if (dock && hero && trip) {
      const r = trip.getBoundingClientRect();
      const inTrip = r.top < vh * .7 && r.bottom > vh * .3;
      dock.classList.toggle("is-on", y > hero.offsetHeight * .6 && !inTrip);
    }
    if (!reduce) pars.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const k = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.transform = `translate3d(0, ${(k * -6).toFixed(2)}%, 0)`;
    });
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  // ---------- Reveal ----------
  const reveals = $$(".pickup h2, .pickup .lead, .step, .sec-head > *, .jeep, .spot, .plan, .signpost-text, .picks h2, .pick-list li, .contact h2, .c-card, .foot-mark");
  reveals.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) {
    reveals.forEach(el => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.filter(e => e.isIntersecting).forEach((e, n) => {
        e.target.style.transitionDelay = `${n * 60}ms`;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(el => io.observe(el));
  }
})();
