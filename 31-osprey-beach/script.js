// Osprey Beach Hotel: the pinned title's colour per view, the clickable hotel plan, the stay estimate and the reservation request.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = n => "$" + Math.round(n).toLocaleString("en-US");

  /* ---------- the pinned name takes the ink of the view beneath it ---------- */
  const poster = $("[data-poster]");
  if (poster && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) poster.style.setProperty("--title-ink", e.target.dataset.ink); }), { rootMargin: "-45% 0px -45% 0px" });
    $$(".panel", poster).forEach(p => io.observe(p));
  }

  /* ---------- the plan ---------- */
  const SPOTS = {
    beach: ["The beach", "Lounge chairs and towels for hotel guests. Blue Water Divers and Grand Turk Diving pick up right here, and the snorkelling starts off the sand."],
    west: ["West beachfront rooms", "Beachfront rooms beside the pool and the office, each with a balcony or patio over the sand.", "k"],
    pool: ["Pool, Birdcage and bar", "The beachside pool, the Birdcage for breakfast, lunch and dinner, and the bar's rum punch: light rum, coconut rum and dark rum. Free Wi-Fi by the pool."],
    main: ["Main beachfront building", "Beachfront suites and rooms, each with a private balcony or patio over the sand.", "pk"],
    east: ["East beachfront rooms", "More beachfront rooms on the east side, a few steps from the water.", "qm"],
    atrium: ["The Atrium", "Across Duke Street: five west-facing balcony rooms with hammocks and some sea views, a courtyard room, a king studio and three two-bedroom apartments.", "ab"],
    dive: ["Dive shop and spa", "Blue Water Divers, a PADI 5 Star shop, is on the property. Massage and body treatments by appointment on 649 242 9746."],
  };
  const ROOM_SPOT = { pk: "main", qf: "main", qm: "main", k: "main", ab: "atrium", ac: "atrium", as: "atrium", aa: "atrium" };
  const RATES = { pk: [255, 220], qf: [255, 220], qm: [220, 200], k: [200, 180] };
  const room = $("[data-room]"), arrive = $("[data-in]"), nightsOut = $("[data-nights]");
  const state = { room: "pk", in: "", nights: 5, plan: "relaxation", spot: "main" };
  try { Object.assign(state, JSON.parse(localStorage.getItem("ob-stay") || "{}")); } catch {}
  const save = () => { try { localStorage.setItem("ob-stay", JSON.stringify(state)); } catch {} };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const today = new Date(); today.setHours(12, 0, 0, 0);
  if (!state.in || new Date(state.in + "T12:00:00") < today) { const d = new Date(today); d.setDate(d.getDate() + 30); state.in = iso(d); }

  const showSpot = (key, animate = true) => {
    state.spot = key;
    $$(".m-spot").forEach(g => g.classList.toggle("is-on", g.dataset.spot === key));
    const [name, text] = SPOTS[key];
    $("[data-spot-name]").textContent = name;
    $("[data-spot-text]").textContent = text;
    const card = $(".spot-card");
    if (animate && !reduce) { card.classList.remove("is-new"); void card.offsetWidth; card.classList.add("is-new"); }
  };

  /* ---------- the estimate ---------- */
  const peak = d => { const m = d.getMonth() + 1, day = d.getDate(); return m <= 4 || (m === 12 && day >= 21); };
  const fmt = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const stay = () => {
    const start = new Date(state.in + "T12:00:00"), nights = [];
    for (let i = 0; i < state.nights; i++) { const d = new Date(start); d.setDate(d.getDate() + i); nights.push(d); }
    const out = new Date(start); out.setDate(out.getDate() + state.nights);
    const r = RATES[state.room];
    const rates = r ? nights.map(d => peak(d) ? r[0] : r[1]) : null;
    const sub = rates ? rates.reduce((a, b) => a + b, 0) : 0;
    return { start, out, nights, rates, sub, fees: sub * .22, total: sub * 1.22 };
  };
  const notes = s => {
    const list = [];
    const bbq = s.nights.filter(d => [1, 3, 6].includes(d.getDay())).length;
    if (bbq) list.push(`${bbq} BBQ ${bbq === 1 ? "night" : "nights"} at the Birdcage (Monday, Wednesday, Saturday)${s.nights.some(d => d.getDay() === 6) ? ", with live music on Saturday" : ""}.`);
    if (s.nights.some(d => { const m = d.getMonth() + 1, day = d.getDate(); return (m === 1 && day >= 20) || m === 2 || m === 3 || (m === 4 && day <= 10); })) list.push("Humpback whale season: they pass Grand Turk from late January to early April.");
    if (state.plan === "scuba diving") list.push("The dive boats pick up on the beach. Groups of 10 or more can ask for dive resort rates.");
    if (state.plan === "business") list.push("Free Wi-Fi in every room and by the pool.");
    return list;
  };
  const render = () => {
    room.value = state.room; arrive.value = state.in; nightsOut.textContent = state.nights;
    $$("[data-plan]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.plan === state.plan)));
    const s = stay();
    $("[data-dates]").textContent = `${fmt(s.start)} to ${fmt(s.out)}, ${state.nights} ${state.nights === 1 ? "night" : "nights"}`;
    if (s.rates) {
      const lo = Math.min(...s.rates), hi = Math.max(...s.rates);
      $("[data-rate-l]").textContent = lo === hi ? `${money(lo)} × ${state.nights}` : `${money(lo)} to ${money(hi)} a night`;
      $("[data-rate]").textContent = money(s.sub);
      $("[data-fees]").textContent = money(s.fees);
      $("[data-total]").textContent = money(s.total);
    } else {
      $("[data-rate-l]").textContent = "Atrium rates";
      $("[data-rate]").textContent = "by phone";
      $("[data-fees]").textContent = "added";
      $("[data-total]").textContent = "649 433 3333";
    }
    $("[data-notes]").innerHTML = notes(s).map(n => `<li>${n}</li>`).join("");
    $("[data-send]").textContent = s.rates ? "Email this request" : "Email the Atrium";
  };

  if (room) {
    $$(".m-spot").forEach(g => {
      const go = () => {
        const k = g.dataset.spot, r = SPOTS[k][2];
        if (r) state.room = r;
        showSpot(k); save(); render();
      };
      g.addEventListener("click", go);
      g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
    room.addEventListener("change", () => { state.room = room.value; showSpot(ROOM_SPOT[state.room]); save(); render(); });
    arrive.min = iso(today);
    arrive.addEventListener("change", () => { if (arrive.value) { state.in = arrive.value; save(); render(); } });
    $$("[data-n]").forEach(b => b.addEventListener("click", () => { state.nights = Math.max(1, Math.min(21, state.nights + Number(b.dataset.n))); save(); render(); }));
    $$("[data-plan]").forEach(b => b.addEventListener("click", () => { state.plan = b.dataset.plan; save(); render(); }));
    $$("[data-plan-link]").forEach(a => a.addEventListener("click", () => { state.plan = a.dataset.planLink; save(); render(); }));
    showSpot(state.spot in SPOTS ? state.spot : "main", false);
    render();

    const msg = $("[data-msg]"), orig = msg.textContent;
    $("[data-send]").addEventListener("click", () => {
      if (!arrive.value) { msg.textContent = "Pick your arrival date first."; arrive.focus(); return; }
      const s = stay(), atrium = !s.rates, roomName = room.options[room.selectedIndex].text;
      const to = atrium ? "bnbgrandturk@gmail.com" : "info@ospreybeachhotel.com";
      const body = `Hello,\n\nName: \nTravel dates: ${fmt(s.start)} to ${fmt(s.out)}, ${s.out.getFullYear()} (${state.nights} ${state.nights === 1 ? "night" : "nights"})\nRoom: ${roomName}\nGuests: \nOur plans: ${state.plan}\nSpecial requests: \n\nThank you!`;
      const href = `mailto:${to}?subject=${encodeURIComponent("Reservation Request")}&body=${encodeURIComponent(body)}`;
      $("[data-send]").dataset.lastMail = href;
      msg.textContent = `Opening your email app with the request for ${to}.`;
      setTimeout(() => { msg.textContent = orig; }, 7000);
      location.href = href;
    });
  }

  /* ---------- footer clock, Grand Turk time ---------- */
  const clock = $("[data-clock]");
  const tick = () => {
    const t = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", hour: "numeric", minute: "2-digit" }).format(new Date());
    if (clock) clock.textContent = `${t.toLowerCase()} on Grand Turk`;
  };
  tick(); setInterval(tick, 30000);

  /* ---------- one question open at a time (for browsers without details[name]) ---------- */
  $$(".qs details").forEach(d => d.addEventListener("toggle", () => { if (d.open) $$(".qs details").forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- entrances ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$(".reveal", e.target).forEach((el, i) => { el.style.setProperty("--d", i * 80 + "ms"); el.classList.add("is-in"); });
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    $$("section, .frame").forEach(s => io.observe(s));
  } else $$(".reveal").forEach(el => el.classList.add("is-in"));

  /* ---------- phone bar: away over the poster, the plan, the band and the end of the page ---------- */
  const bar = $("[data-bar]");
  if (bar && "IntersectionObserver" in window) {
    const seen = new Set();
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); bar.classList.toggle("is-away", seen.size > 0); });
    [$(".poster"), $(".plan"), $(".band"), $(".contact"), $(".foot")].forEach(el => el && io.observe(el));
  }
})();
