(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desk = window.matchMedia("(min-width: 960px)");
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- What's cooking right now, on Turks & Caicos time ----------
  // Breakfast before noon on weekdays and till 2pm at weekends; lunch till 3pm (from Tribe's own menu).
  const status = $("[data-status]");
  function tciNow() {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return { day: get("weekday"), mins: Number(get("hour")) * 60 + Number(get("minute")) };
  }
  function setStatus() {
    const { day, mins } = tciNow();
    const weekend = day === "Sat" || day === "Sun";
    const bfEnd = weekend ? 14 * 60 : 12 * 60;
    let text;
    if (mins < 8 * 60) text = "Opening at 8am. Breakfast first.";
    else if (mins < bfEnd) text = `Breakfast is on now, until ${weekend ? "2pm" : "noon"}.`;
    else if (mins < 15 * 60) text = "Lunch is on now, until 3pm.";
    else text = "Lunch is done for today. Breakfast from 8am.";
    status.textContent = text;
  }
  setStatus();
  setInterval(setStatus, 60000);

  // ---------- Headlines word by word, reveals ----------
  $$("[data-words]").forEach(h => {
    const t = h.textContent.trim(); h.setAttribute("aria-label", t);
    h.innerHTML = t.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true" style="transition-delay:${i * 80}ms">${w}</span>`).join(" ");
  });
  const rev = $$(".hero-text > *, .intro > p, .bf-note, .dishes > li, .tax, .plate, .plate-side > *, .menu-photo, .group, .pic-head p, .builder fieldset, .ticket-wrap, .contact > *, .foot-menu a, .foot-blocks");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  const all = [...$$("[data-words]"), ...rev];
  if (!("IntersectionObserver" in window) || reduce) all.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      if (e.target.hasAttribute("data-reveal")) e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.1 });
    all.forEach(el => io.observe(el));
  }

  // ---------- The stage: one picture that changes with what you're reading ----------
  const shots = $$("[data-shot]");
  const bandShots = $$("[data-band]");
  function show(key) {
    shots.forEach(i => i.classList.toggle("is-on", i.dataset.shot === key));
    // the phone band only holds the dishes; keep the last dish when the key is not one of them
    if (bandShots.some(i => i.dataset.band === key)) bandShots.forEach(i => i.classList.toggle("is-on", i.dataset.band === key));
  }
  const dishes = $$("[data-dish]");
  function activate(btn) {
    dishes.forEach(d => { const on = d === btn; d.classList.toggle("is-active", on); d.setAttribute("aria-expanded", String(on)); });
    show(btn.dataset.dish);
  }
  dishes.forEach(d => d.addEventListener("click", () => activate(d)));
  // while the list is on screen, the row nearest the middle of the open view is the one on show
  // (on a phone the open view starts under the pinned photo band)
  const list = $("[data-dishes]"), band = $(".band");
  let rowTick = false;
  function pickRow() {
    rowTick = false;
    const lr = list.getBoundingClientRect();
    if (lr.bottom < 0 || lr.top > innerHeight) return;
    const top = band && getComputedStyle(band).display !== "none" ? Math.max(0, band.getBoundingClientRect().bottom) : 0;
    const mid = (top + innerHeight) / 2;
    let best = null, dist = Infinity;
    dishes.forEach(d => { const r = d.getBoundingClientRect(); const c = Math.abs(r.top + r.height / 2 - mid); if (c < dist) { dist = c; best = d; } });
    if (best && !best.classList.contains("is-active")) activate(best);
  }
  addEventListener("scroll", () => { if (!rowTick) { rowTick = true; requestAnimationFrame(pickRow); } }, { passive: true });
  if ("IntersectionObserver" in window) {
    const secIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) show(e.target.dataset.shotKey); }), { rootMargin: "-50% 0px -50% 0px" });
    $$("[data-shot-key]").forEach(s => secIO.observe(s));
  }

  // ---------- Bakery tabs ----------
  const TABS = {
    sourdough: ["Take a loaf home.", "Round sourdough loaves to take away, baked in-house every morning. Call ahead to check what's out of the oven today."],
    croissants: ["Out of the oven at 8.", "Plain and chocolate croissants, cinnamon rolls, cookies and muffins, baked fresh every day. The early ones go first."],
    sandwiches: ["Lunch on our bread.", "Hot sourdough sandwiches from 8am to 3pm, from the Tribe Club to The Alex, the vegan one. Breakfast sandwiches come on a croissant too."],
  };
  const tabs = $$("[data-tab]"), panel = $("#bk-panel");
  tabs.forEach(t => t.addEventListener("click", () => {
    const k = t.dataset.tab;
    tabs.forEach(x => x.setAttribute("aria-selected", String(x === t)));
    $$("[data-plate]").forEach(i => i.classList.toggle("is-on", i.dataset.plate === k));
    $("[data-tab-title]").textContent = TABS[k][0];
    $("[data-tab-text]").textContent = TABS[k][1];
    if (!reduce) { panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap"); }
  }));
  $(".tabs").addEventListener("keydown", e => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const i = tabs.indexOf(document.activeElement);
    if (i < 0) return;
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    next.focus(); next.click();
  });

  // ---------- The wordmark: fitted to the column, two inks where it crosses the photo ----------
  const wm = $("[data-wordmark]"), hero = $(".hero"), stage = $(".stage");
  function fitWordmark() {
    wm.style.fontSize = "";
    const natural = wm.firstElementChild.getBoundingClientRect().width;
    const fs = parseFloat(getComputedStyle(wm).fontSize);
    const pad = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--pad")) || 20;
    const target = desk.matches ? hero.clientWidth + innerWidth * 0.1 - pad : hero.clientWidth - 24;
    wm.style.fontSize = `${Math.min(fs * target / natural, desk.matches ? innerHeight * 0.52 : innerWidth * 0.5)}px`;
    if (desk.matches) {
      const cut = stage.getBoundingClientRect().right - 20 - wm.getBoundingClientRect().left;
      wm.style.setProperty("--cut", `${Math.max(0, cut)}px`);
    }
  }
  document.fonts.ready.then(fitWordmark);
  addEventListener("resize", fitWordmark);
  fitWordmark();

  // ---------- Picnic builder → kitchen ticket ----------
  const f = $("[data-builder]"), items = $("[data-t-items]"), warn = $("[data-t-warn]"), send = $("[data-send]"), ticket = $("[data-ticket]");
  const guests = f.guests, date = f.date;
  const pad2 = n => String(n).padStart(2, "0");
  const iso = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  date.min = iso(tomorrow);
  const plus2 = new Date(); plus2.setDate(plus2.getDate() + 2);
  date.value = iso(plus2);
  $$("[data-step]").forEach(b => b.addEventListener("click", () => {
    guests.value = Math.max(10, Math.min(80, (Number(guests.value) || 10) + Number(b.dataset.step)));
    render(true);
  }));
  let lastCount = -1;
  function render(bump) {
    const n = Math.max(10, Math.min(80, Number(guests.value) || 10));
    if (document.activeElement !== guests) guests.value = n;
    const chosen = $$("input[name=item]:checked", f).map(i => i.value);
    const forWhat = f.querySelector("input[name=for]:checked").value;
    const when = date.value ? new Date(date.value + "T12:00") : null;
    const whenText = when ? `${when.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}, ${f.time.value}` : "Pick a date";
    $("[data-t-for]").textContent = forWhat[0].toUpperCase() + forWhat.slice(1);
    $("[data-t-guests]").textContent = n;
    $("[data-t-when]").textContent = whenText;
    items.innerHTML = chosen.length ? chosen.map(c => `<li>${c}</li>`).join("") : '<li class="empty">Pick a box or tray to start.</li>';

    // at least 24 hours' notice, measured against the pick-up time
    let msg = "";
    if (when) {
      const [h, rest] = f.time.value.split(":");
      let hour = Number(h) % 12; if (rest.endsWith("pm")) hour += 12;
      const pick = new Date(date.value + `T${pad2(hour)}:00`);
      if (pick - new Date() < 24 * 3600 * 1000) msg = "That's less than 24 hours away. Call us and we'll see what we can do.";
    } else msg = "Choose the day you'd like it.";
    if (!chosen.length) msg = msg || "Add at least one box or tray.";
    warn.hidden = !msg; warn.textContent = msg;

    const body = `Hi Tribe,\n\nWe'd like a picnic order for ${forWhat}.\nGuests: ${n}\nPick up: ${whenText}\n\n${chosen.map(c => `- ${c}`).join("\n") || "- (please suggest)"}\n\nCould you send us a quote?\n\nName:\nPhone:\nVilla or boat:`;
    send.href = `mailto:info@tribetci.com?subject=${encodeURIComponent(`Picnic order for ${n}, ${whenText}`)}&body=${encodeURIComponent(body)}`;
    if (bump && !reduce && chosen.length !== lastCount) { ticket.classList.remove("bump"); void ticket.offsetWidth; ticket.classList.add("bump"); }
    lastCount = chosen.length;
  }
  f.addEventListener("input", () => render(true));
  f.addEventListener("change", () => render(true));
  guests.addEventListener("blur", () => render(false));
  render(false);

  // ---------- Dock + wordmark scale on scroll ----------
  const dock = $("[data-dock]"), picnic = $("#picnic");
  let ticking = false;
  function onScroll() {
    ticking = false;
    const h = hero.getBoundingClientRect();
    const past = h.bottom < innerHeight * 0.3;
    const p = picnic.getBoundingClientRect();
    const atPicnic = p.top < innerHeight;
    dock.classList.toggle("is-on", past && !atPicnic);
    if (!reduce) {
      const prog = Math.min(1, Math.max(0, -h.top / Math.max(1, h.height)));
      wm.style.transform = `scale(${(1 - prog * 0.07).toFixed(4)})`;
    }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
})();
