(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Design your day: three taps print a postcard ----------
  // Stops come from Okeanos' own listing; longer days reach further.
  const BBQ = "Beach BBQ cooked by the crew";
  const PLANS = {
    chill: { img: "assets/turtle-cove.jpg", alt: "A palm and turquoise shallows at Turtle Cove, Providenciales",
      4: ["Pine Cay sandbars", "Water Cay, beach to ourselves"],
      5: ["Pine Cay sandbars", "Water Cay, beach to ourselves", BBQ],
      8: ["Pine Cay sandbars", "Water Cay, beach to ourselves", BBQ, "West Caicos, wild and empty"] },
    snorkel: { img: "assets/angelfish.jpg", alt: "A French angelfish swimming over a Caribbean reef",
      4: ["Fort George Cay cannons", "La Famille Express wreck"],
      5: ["Fort George Cay cannons", "La Famille Express wreck", "Water Cay", BBQ],
      8: ["Fort George Cay cannons", "La Famille Express wreck", BBQ, "Snorkel French Cay"] },
    explore: { img: "assets/drones-in-turks-unsplash.jpg", alt: "Turquoise water, a rocky point and a private dock seen from above",
      4: ["Water Cay", "Fort George Cay", "La Famille Express wreck", "Eyes peeled for JoJo"],
      5: ["Water Cay", "Fort George Cay", BBQ, "West Caicos"],
      8: ["Water Cay and Fort George Cay", "West Caicos", BBQ, "French Cay and Little Ambergris"] },
  };
  const BOAT = { couple: "On the Axopar 22, made for two.", family: "On an Axopar, room for all.", friends: "On the Chris Craft, built for groups." };
  const LEN = { 4: "half day", 5: "extended half day", 8: "full day" };
  const WHO = { couple: "the two of us", family: "the family", friends: "a group of friends" };
  const state = { who: "couple", vibe: "chill", time: "4" };

  const card = $("[data-postcard]"), img = $("[data-pc-img]"), title = $("[data-pc-title]"), plan = $("[data-pc-plan]"), boat = $("[data-pc-boat]"), mail = $("[data-mail]");
  function print(animate) {
    const p = PLANS[state.vibe], stops = p[state.time];
    if (img.getAttribute("src") !== p.img) img.src = p.img;
    img.alt = p.alt;
    title.textContent = `Our ${state.time === "5" ? "5 hours" : LEN[state.time]} on the water`;
    plan.innerHTML = stops.map(s => `<span class="pc-line">${s}</span>`).join("");
    boat.textContent = BOAT[state.who];
    const body = `Hi Okeanos,\n\nWe designed our day on your website:\nWho: ${WHO[state.who]}\nLength: ${LEN[state.time]} (${state.time} hours)\nPlan: ${stops.join("; ")}\nBoat: ${BOAT[state.who].replace(/^On /, "")}\n\nDate:\nNumber of guests:\nPickup (Blue Haven Marina or Grace Bay beach):\nName and phone:`;
    mail.href = `mailto:hello@okeanoscharters.com?subject=${encodeURIComponent("Our day on the water")}&body=${encodeURIComponent(body)}`;
    if (animate) {
      card.classList.remove("is-flipped"); card.setAttribute("aria-pressed", "false");
      if (!reduce) { card.classList.remove("print"); void card.offsetWidth; card.classList.add("print"); }
    }
  }
  $$("[data-q]").forEach(b => b.addEventListener("click", () => {
    state[b.dataset.q] = b.dataset.v;
    $$(`[data-q="${b.dataset.q}"]`).forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    print(true);
    // on a phone the card sits under the questions: bring it into view so the change is seen
    const r = card.getBoundingClientRect();
    if (r.top > innerHeight * .55) scrollBy({ top: r.top - innerHeight * .4, behavior: reduce ? "auto" : "smooth" });
  }));
  card.addEventListener("click", () => card.setAttribute("aria-pressed", String(card.classList.toggle("is-flipped"))));
  card.addEventListener("animationend", e => { if (e.target === card) card.classList.remove("print"); });
  print(false);
  Object.values(PLANS).forEach(p => { const i = new Image(); i.src = p.img; });

  // ---------- Headlines word by word, reveals ----------
  $$("[data-words]").forEach(h => {
    const t = h.textContent.trim(); h.setAttribute("aria-label", t);
    h.innerHTML = t.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true" style="transition-delay:${i * 80}ms">${w}</span>`).join(" ");
  });
  const rev = $$(".incl li, .moment, .f, .picks fieldset, .post-wrap, .design-head p, .hero-sub, .hero-actions, .hero-proof, .final-inner > *");
  rev.forEach(el => { if (!el.classList.contains("moment")) el.setAttribute("data-reveal", ""); });
  const all = [...$$("[data-words]"), ...rev];
  if (!("IntersectionObserver" in window) || reduce) all.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      if (e.target.hasAttribute("data-reveal")) e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.12 });
    all.forEach(el => io.observe(el));
  }

  // ---------- Compass heading + parallax ----------
  const pars = $$("[data-parallax]");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const p = scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight);
    document.documentElement.style.setProperty("--heading", `${Math.round(p * 360)}deg`);
    if (!reduce) pars.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      el.style.transform = `translate3d(0, ${(((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -6).toFixed(2)}%, 0)`;
    });
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
