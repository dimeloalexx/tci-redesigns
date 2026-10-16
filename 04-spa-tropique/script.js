(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "relax@spatropique.com";
  const TAX = 0.12;
  const OUTCALL = 50;

  // ---------- Menu, from Spa Tropique's published brochure ----------
  // opts: [minutes, price]; pair: price covers two people; stones: cannot travel to villas.
  const MENU = [
    { cat: "Massages", items: [
      { id: "swedish", name: "Classic Swedish Massage", opts: [[50, 150], [70, 170], [90, 190]], d: "Long, flowing strokes with gentle to medium pressure. Soothes muscles and calms the mind." },
      { id: "deep", name: "Classic Deep Tissue", opts: [[50, 170], [70, 190], [90, 210]], d: "Knot today, stress. Firmer pressure for deeper layers of muscle and chronic tension." },
      { id: "hot-stones", name: "Hot off the Stresses", opts: [[50, 170], [70, 190], [90, 210]], stones: true, fav: true, d: "Hot is the new cool. Warm stones with Swedish massage. Rock on!" },
      { id: "aroma", name: "The Aroma Experience", opts: [[50, 170], [70, 190], [90, 210]], d: "Lavender, citrus or mint and skilled hands. Scent-sational!" },
      { id: "for-two", name: "Relaxation for Two, Please!", opts: [[50, 170], [70, 190], [90, 210]], d: "Side by side with your favourite person. Falling asleep is encouraged. Priced per person." },
      { id: "baby", name: "Oh 'Baby', You Need This!", opts: [[60, 170]], d: "Prenatal massage for mommy-to-be, 2nd and 3rd trimester." },
    ]},
    { cat: "Facials", items: [
      { id: "happy", name: "The C'mon Get Happy", opts: [[50, 145]], d: "Gentle deep-cleansing facial with steam and a hydrating mask. Happy looks good on you." },
      { id: "vitc", name: "The Vitamin C Powerhouse", opts: [[70, 170]], fav: true, d: "Vitamin C brightening with mineral-rich seaweed. Skincare's best kept 'C'-cret." },
      { id: "golden", name: "The Golden Glow Recovery", opts: [[80, 190]], fav: true, d: "Anti-aging with collagen and pure caviar. Glow big or go home." },
      { id: "reboot", name: "The 'Ultimate' Reboot", opts: [[90, 220]], d: "Propolis and algae, plus a heated eye mask for the flight home." },
      { id: "maverick", name: "The 'Maverick' Men's Facial", opts: [[60, 160]], d: "Deep cleansing, bye-bye razor burn, with a head and scalp massage." },
    ]},
    { cat: "Body", items: [
      { id: "glow", name: "The Glow Must Go On", opts: [[60, 160]], fav: true, d: "Deeply hydrating wrap with marine collagen, hyaluronic acid and blue agave." },
      { id: "wrapsody", name: "Caribbean Wrapsody", opts: [[50, 150]], d: "A tropical 'smoothie' wrap with papaya, pineapple and pomegranate." },
      { id: "caicos-roll", name: "Caicos Roll", opts: [[50, 140]], d: "Mineral-rich seaweed wrap that firms, hydrates and detoxes." },
      { id: "scrub", name: "Smooth Operator Salt Scrub", opts: [[30, 110]], d: "Mango, passion fruit and French sea salt. Perfect for a flawless tan." },
    ]},
    { cat: "Packages", items: [
      { id: "oohlala", name: "Ooh La La", opts: [[70, 205]], stones: true, d: "Hot-stone massage, head massage and a soothing eye treatment." },
      { id: "calypso", name: "The Calypso Collection", opts: [[90, 245]], fav: true, d: "Aromatherapy massage, mini-facial and coconut-oil head massage." },
      { id: "calm", name: "Destination Calm", opts: [[120, 290]], stones: true, d: "Hot-stone massage, mini-facial with papaya mask and a foot massage." },
      { id: "paradise", name: "Lost in Paradise", opts: [[120, 315]], fav: true, d: "Swedish massage, European deep-cleansing facial and a head or foot massage." },
      { id: "station", name: "The Relaxation Station", opts: [[180, 495]], d: "Aromatherapy massage, Vitamin C facial, body wrap and head massage." },
      { id: "delight", name: "Afternoon Delight (for 2)", opts: [[70, 325]], pair: true, d: "Couple's Swedish massage plus a mini foot massage for all four feet." },
    ]},
    { cat: "Fingers & Toes", items: [
      { id: "mani", name: "All Hands on Deck", opts: [[0, 50]], d: "Manicure: smooth, hydrated skin and nails polished to perfection. Nail-ed it!" },
      { id: "pedi", name: "Toe Be or Not Toe Be", opts: [[0, 70]], d: "Deluxe pedicure with a sugar scrub and foot massage." },
      { id: "gel-off", name: "Gel Polish Removal", opts: [[0, 30]], d: "Off with the old, ready for the new." },
    ]},
    { cat: "Add-ons", items: [
      { id: "coco", name: "The Coco-Luxe Retreat", opts: [[30, 80]], fav: true, d: "Cold-pressed coconut oil for hair and scalp with a head and neck massage." },
      { id: "mini-facial", name: "Glow On The Go 'Mini' Facial", opts: [[30, 65]], d: "Express facial: cleansing, exfoliation and hydration." },
      { id: "add-30", name: "The Perfect Add-On", opts: [[30, 95]], d: "A 30-minute Swedish massage. Absolutely perfect." },
      { id: "sole", name: "Pamper Your Sole", opts: [[10, 20], [30, 60]], d: "A massage 'solely' for tired feet." },
      { id: "head", name: "Head Rush", opts: [[10, 20]], d: "Ten minutes of head-soothing bliss." },
      { id: "eye", name: "Eye Candy", opts: [[10, 25]], d: "Ten minutes of hydration for the eyes." },
      { id: "papaya", name: "Papaya SOS", opts: [[0, 25]], d: "The ultimate post-sun calming mask." },
      { id: "scents", name: "Soothing Scents", opts: [[0, 10]], d: "Healing essential oils, because your senses deserve love too." },
    ]},
  ];
  const BY_ID = {};
  MENU.forEach(c => c.items.forEach(i => { BY_ID[i.id] = i; }));
  const money = (n) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });
  const optLabel = (o) => (o[0] ? `${o[0]} min · ` : "") + money(o[1]);

  // ---------- Planner state ----------
  const picks = []; // { id, opt }
  let guests = 1;
  const isPicked = (id) => picks.some(p => p.id === id);

  function addPick(id) {
    if (!BY_ID[id] || isPicked(id)) return;
    picks.push({ id, opt: 0 });
    render();
  }
  function removePick(id) {
    const i = picks.findIndex(p => p.id === id);
    if (i > -1) picks.splice(i, 1);
    render();
  }

  // ---------- Menu tabs ----------
  const tabsEl = $("[data-tabs]");
  const listEl = $("[data-menu]");
  let current = 0;
  function drawMenu() {
    listEl.innerHTML = "";
    MENU[current].items.forEach((it, n) => {
      const el = document.createElement("article");
      el.className = "item";
      el.style.animationDelay = `${n * 40}ms`;
      el.innerHTML = `
        <div class="item-top"><h3>${it.name}${it.fav ? '<span class="fav-tag">Fan fave</span>' : ""}</h3>
        <span class="item-price">${it.opts.map(o => optLabel(o)).join(" / ")}</span></div>
        <p>${it.d}</p>
        <button class="item-add${isPicked(it.id) ? " is-added" : ""}" type="button" data-add="${it.id}">${isPicked(it.id) ? "Added ✓" : "Add to my day"}</button>`;
      listEl.appendChild(el);
    });
  }
  MENU.forEach((c, n) => {
    const b = document.createElement("button");
    b.className = "tab"; b.type = "button"; b.role = "tab";
    b.textContent = c.cat;
    b.setAttribute("aria-selected", n === 0 ? "true" : "false");
    b.addEventListener("click", () => {
      current = n;
      $$(".tab", tabsEl).forEach((t, k) => t.setAttribute("aria-selected", k === n ? "true" : "false"));
      drawMenu();
    });
    tabsEl.appendChild(b);
  });
  drawMenu();

  // add-select in planner
  const sel = $("[data-add-select]");
  MENU.forEach(c => {
    const g = document.createElement("optgroup");
    g.label = c.cat;
    c.items.forEach(it => { const o = document.createElement("option"); o.value = it.id; o.textContent = `${it.name} (${optLabel(it.opts[0])})`; g.appendChild(o); });
    sel.appendChild(g);
  });
  sel.addEventListener("change", () => { if (sel.value) { addPick(sel.value); sel.value = ""; } });

  // any "Add to my day" button anywhere
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const id = b.dataset.add;
    if (isPicked(id)) removePick(id); else addPick(id);
  });

  // villa CTA preselects "at my villa"
  const villaCta = $("[data-villa-cta]");
  const form = $("[data-planner]");
  villaCta && villaCta.addEventListener("click", () => { form.where.value = "villa"; render(); });

  $$("[data-guests]").forEach(b => b.addEventListener("click", () => {
    guests = Math.max(1, Math.min(10, guests + Number(b.dataset.guests)));
    render();
  }));
  form.addEventListener("change", render);

  const dateInput = $("[data-date]");
  const d0 = new Date(); d0.setDate(d0.getDate() + 1);
  dateInput.value = d0.toISOString().slice(0, 10);
  dateInput.min = new Date().toISOString().slice(0, 10);

  // ---------- Render planner ----------
  const out = {
    picks: $("[data-picks]"), empty: $("[data-pick-empty]"), lines: $("[data-lines]"),
    sub: $("[data-sub]"), tax: $("[data-tax]"), total: $("[data-total]"), time: $("[data-time]"),
    book: $("[data-book]"), gv: $("[data-guests-val]"), dock: $("[data-dock-text]"),
  };
  function render() {
    const villa = form.where.value === "villa";
    out.gv.textContent = guests;

    // picked rows
    out.picks.innerHTML = "";
    picks.forEach(p => {
      const it = BY_ID[p.id];
      const row = document.createElement("div");
      row.className = "pick-row";
      const opts = it.opts.length > 1
        ? `<select aria-label="Length for ${it.name}" data-opt="${it.id}">${it.opts.map((o, k) => `<option value="${k}"${k === p.opt ? " selected" : ""}>${optLabel(o)}</option>`).join("")}</select>`
        : `<small>${optLabel(it.opts[0])}${it.pair ? " for two" : ""}</small>`;
      row.innerHTML = `<div><b>${it.name}</b>${opts}</div><button type="button" aria-label="Remove ${it.name}" data-remove="${it.id}">×</button>`;
      out.picks.appendChild(row);
    });
    out.empty.hidden = picks.length > 0;
    $$("[data-remove]", out.picks).forEach(b => b.addEventListener("click", () => removePick(b.dataset.remove)));
    $$("[data-opt]", out.picks).forEach(s => s.addEventListener("change", () => {
      const p = picks.find(x => x.id === s.dataset.opt); p.opt = Number(s.value); render();
    }));

    // sync all add buttons
    $$("[data-add]").forEach(b => {
      const on = isPicked(b.dataset.add);
      b.classList.toggle("is-added", on);
      b.textContent = on ? "Added ✓" : "Add to my day";
    });

    // receipt
    out.lines.innerHTML = "";
    let sub = 0, minutes = 0;
    const stonesAtVilla = villa && picks.some(p => BY_ID[p.id].stones);
    picks.forEach(p => {
      const it = BY_ID[p.id];
      const [min, price] = it.opts[p.opt];
      const qty = it.pair ? Math.ceil(guests / 2) : guests;
      const line = price * qty;
      sub += line; minutes += min;
      const li = document.createElement("li");
      li.innerHTML = `<span>${it.name}${qty > 1 ? ` × ${qty}` : ""}</span><span>${money(line)}</span>`;
      out.lines.appendChild(li);
    });
    if (picks.length && villa) {
      const li = document.createElement("li");
      li.innerHTML = `<span>Outcall to your villa${guests > 1 ? ` × ${guests} therapists` : ""}</span><span>${money(OUTCALL * guests)}</span>`;
      out.lines.appendChild(li);
      sub += OUTCALL * guests;
    }
    if (!picks.length) out.lines.innerHTML = '<li class="r-empty">Add a treatment to see your total.</li>';
    const tax = Math.round(sub * TAX * 100) / 100;
    const total = sub + tax;
    const prev = out.total.textContent;
    out.sub.textContent = money(sub);
    out.tax.textContent = money(tax);
    out.total.textContent = money(total);
    if (prev !== out.total.textContent && !reduce) { const t = out.total.parentElement; t.classList.remove("bump"); void t.offsetWidth; t.classList.add("bump"); }
    const h = Math.floor(minutes / 60), m = minutes % 60;
    out.time.textContent = stonesAtVilla
      ? "Hot stones can't travel: we'll book those at the spa."
      : minutes ? `About ${h ? `${h}h ` : ""}${m ? `${m} min` : ""} of you-time per guest.` : "";
    if (out.dock) out.dock.innerHTML = picks.length ? `<strong>${money(total)}</strong> · ${picks.length} treatment${picks.length > 1 ? "s" : ""}` : "<strong>Plan your spa day</strong>";

    // booking email
    const date = dateInput.value ? new Date(dateInput.value + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "date to confirm";
    const body = [
      "Hi Spa Tropique,", "",
      "I'd like to book:",
      ...picks.map(p => { const it = BY_ID[p.id]; return `- ${it.name} (${optLabel(it.opts[p.opt])})`; }),
      "",
      `Guests: ${guests}`,
      `Where: ${villa ? "at my villa/resort (outcall)" : "at the spa"}`,
      `Preferred date: ${date}`,
      `Estimated total: ${money(total)} incl. 12% tax`,
      "", "Preferred time:", "Villa/resort name (if outcall):", "Name and phone:",
    ].join("\n");
    out.book.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`Booking request: ${guests} guest${guests > 1 ? "s" : ""}, ${date}`)}&body=${encodeURIComponent(body)}`;
  }
  render();

  // ---------- Breathing cue (in 4s, out 6s, matches the ring) ----------
  const cue = $("[data-breath]");
  if (cue && !reduce) {
    let inhale = true;
    const tick = () => {
      cue.textContent = inhale ? "Breathe in…" : "…and breathe out";
      setTimeout(() => { inhale = !inhale; tick(); }, inhale ? 4000 : 6000);
    };
    tick();
  } else if (cue) { cue.textContent = "Take a slow breath."; }

  // ---------- Stress meter, bar, dock, parallax ----------
  const stress = $("[data-stress]");
  const stressNum = $("[data-stress-num]");
  const bar = $("[data-bar]");
  const dock = $("[data-dock]");
  const planner = $("#planner");
  const hero = $(".hero");
  const pars = $$("[data-parallax]");
  const colors = ["#e8584a", "#f0913a", "#e6c040", "#8dc63f", "#19b3c2"];
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY, vh = window.innerHeight;
    const max = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = Math.min(1, y / max);
    const level = Math.round(98 * (1 - p));
    if (stress) {
      stressNum.textContent = level <= 2 ? "Zen" : `${level}%`;
      stress.classList.toggle("is-zen", level <= 2);
      stress.style.setProperty("--stress-c", colors[Math.min(4, Math.floor(p * 5))]);
    }
    if (bar) bar.classList.toggle("is-scrolled", y > 10);
    if (dock && hero && planner) {
      const pr = planner.getBoundingClientRect();
      const inPlanner = pr.top < vh * 0.8 && pr.bottom > vh * 0.2;
      dock.classList.toggle("is-on", y > hero.offsetHeight * 0.6 && !inPlanner);
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
  const reveals = $$(".sec-head > *, .fav, .villa-card, .plan-form, .receipt, .story-photo, .story-text > *, .blah h2, details, .final-inner > *, .foot-mark");
  reveals.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) {
    reveals.forEach(el => el.classList.add("is-in"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.filter(e => e.isIntersecting).forEach((e, n) => {
        e.target.style.transitionDelay = `${n * 70}ms`;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(el => io.observe(el));
  }
})();
