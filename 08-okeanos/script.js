(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const MARINA = [220, 114];

  // Destinations from Okeanos' own listing; min = shortest charter that reaches them.
  const SPOTS = [
    { id: "water-cay", name: "Water Cay", x: 252, y: 96, lx: 244, ly: 88, la: "end", min: 2, note: "Quiet beaches right next to Pine Cay" },
    { id: "pine-cay", name: "Pine Cay sandbars", x: 270, y: 88, lx: 274, ly: 70, la: "middle", min: 3, note: "Ankle-deep turquoise in the middle of the sea" },
    { id: "fort-george", name: "Fort George Cay", x: 290, y: 80, lx: 300, ly: 84, la: "start", min: 3, note: "Snorkel over old cannons" },
    { id: "wreck", name: "La Famille Express", x: 186, y: 182, lx: 196, ly: 186, la: "start", south: true, min: 2, note: "The grounded freighter in Long Bay" },
    { id: "west-caicos", name: "West Caicos", x: 32, y: 222, lx: 32, ly: 248, la: "middle", south: true, min: 5, note: "Wild, uninhabited and clear" },
    { id: "french-cay", name: "French Cay", x: 122, y: 272, lx: 134, ly: 276, la: "start", south: true, min: 8, note: "Far-out cay for a full day" },
    { id: "ambergris", name: "Little Ambergris", x: 334, y: 248, lx: 334, ly: 268, la: "middle", south: true, min: 8, note: "Remote sands across the bank" },
  ];
  let hours = 4, group = 4;
  const picked = new Set(["water-cay", "pine-cay"]);

  // pins
  const pinsG = $("[data-pins]");
  SPOTS.forEach(s => {
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "pin");
    g.setAttribute("tabindex", "0");
    g.setAttribute("role", "button");
    g.setAttribute("aria-label", s.name);
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", s.x); c.setAttribute("cy", s.y); c.setAttribute("r", 5);
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", s.lx); t.setAttribute("y", s.ly);
    t.setAttribute("text-anchor", s.la);
    t.textContent = s.name;
    g.append(c, t);
    const toggle = () => {
      if (hours < s.min) return;
      picked.has(s.id) ? picked.delete(s.id) : picked.add(s.id);
      render(true);
    };
    g.addEventListener("click", toggle);
    g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    s.el = g;
    pinsG.appendChild(g);
  });

  // big chips under the chart mirror the pins (easier to tap on phones)
  const chipsEl = $("[data-chips]");
  SPOTS.forEach(s => {
    const b = document.createElement("button");
    b.type = "button";
    b.addEventListener("click", () => { if (hours < s.min) return; picked.has(s.id) ? picked.delete(s.id) : picked.add(s.id); render(true); });
    s.chip = b;
    chipsEl.appendChild(b);
  });

  // hours
  $$("[data-h]").forEach(b => b.addEventListener("click", () => {
    hours = Number(b.dataset.h);
    $$("[data-h]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    SPOTS.forEach(s => { if (hours < s.min) picked.delete(s.id); });
    render(true);
  }));
  $$("[data-g]").forEach(b => b.addEventListener("click", () => {
    group = Math.max(1, Math.min(20, group + Number(b.dataset.g)));
    render(false);
  }));

  const route = $("[data-route]"), planEl = $("[data-plan]"), boatEl = $("[data-boat]"), mail = $("[data-mail]");
  function order(list) {
    // nearest-neighbour from the marina, so the line looks like a real day out
    const out = [], left = [...list];
    let cur = MARINA;
    while (left.length) {
      left.sort((a, b) => Math.hypot(a.x - cur[0], a.y - cur[1]) - Math.hypot(b.x - cur[0], b.y - cur[1]));
      const n = left.shift(); out.push(n); cur = [n.x, n.y];
    }
    return out;
  }
  function render(redraw) {
    $("[data-group]").textContent = group;
    SPOTS.forEach(s => {
      const reach = hours >= s.min;
      s.el.classList.toggle("reach", reach && !picked.has(s.id));
      s.el.classList.toggle("on", picked.has(s.id));
      s.chip.className = picked.has(s.id) ? "on" : reach ? "reach" : "";
      s.chip.disabled = !reach;
      s.chip.setAttribute("aria-pressed", String(picked.has(s.id)));
      s.chip.innerHTML = reach ? s.name : `${s.name}<small>${s.min}h+</small>`;
    });
    const north = SPOTS.filter(s => picked.has(s.id) && !s.south).sort((a, b) => a.x - b.x);
    const south = SPOTS.filter(s => picked.has(s.id) && s.south).sort((a, b) => b.x - a.x);
    const stops = [...north, ...south];
    const EAST = [250, 142], NORTH_OUT = [242, 112], SOUTH_BACK = [160, 214];
    if (stops.length) {
      const pts = [MARINA, ...north.map(s => [s.x, s.y])];
      if (south.length) {
        if (north.length) pts.push(NORTH_OUT);
        pts.push(EAST, ...south.map(s => [s.x, s.y]));
        if (south[south.length - 1].x < 170) pts.push(SOUTH_BACK);
        pts.push(EAST);
      }
      pts.push(MARINA);
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - 6;
        d += ` Q${mx} ${my} ${x1} ${y1}`;
      }
      route.setAttribute("d", d);
      if (redraw && !reduce) { route.classList.remove("draw"); void route.getBBox(); route.classList.add("draw"); }
    } else route.setAttribute("d", "");

    planEl.innerHTML = "";
    if (!stops.length) planEl.innerHTML = '<li class="empty">Tap the glowing spots on the chart.</li>';
    stops.forEach(s => { const li = document.createElement("li"); li.innerHTML = `${s.name}<small>${s.note}</small>`; planEl.appendChild(li); });
    if (hours >= 5 && stops.length) { const li = document.createElement("li"); li.innerHTML = `Beach BBQ<small>A local lunch cooked by the captain and crew</small>`; planEl.appendChild(li); }

    const boat = group <= 2 ? "the Axopar 22, made for two" : group <= 6 ? "one of our Axopars" : "the Chris Craft, built for bigger groups";
    boatEl.textContent = `${hours === 8 ? "Full day" : hours + " hours"} for ${group}: we'd suggest ${boat}. Want the luxe version? Ask about the Saxdor 400.`;

    const body = `Hi Okeanos,\n\nWe'd like a private charter:\nLength: ${hours === 8 ? "full day (8 hours)" : hours + " hours"}\nGroup: ${group}\nRoute: ${stops.map(s => s.name).join(", ") || "open to suggestions"}${hours >= 5 ? "\nBeach BBQ: yes please" : ""}\n\nDate:\nPickup (Blue Haven Marina or Grace Bay beach):\nName and phone:`;
    mail.href = `mailto:hello@okeanoscharters.com?subject=${encodeURIComponent("Private charter request")}&body=${encodeURIComponent(body)}`;
  }
  render(true);

  // ---------- Headlines, reveals ----------
  $$("[data-words]").forEach(h => {
    const t = h.textContent.trim(); h.setAttribute("aria-label", t);
    h.innerHTML = t.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true" style="transition-delay:${i * 80}ms">${w}</span>`).join(" ");
  });
  const rev = $$(".incl li, .moment, .f, .plan, .group, .map-wrap, .hero-sub, .hero-actions, .hero-proof, .final-inner > *");
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
