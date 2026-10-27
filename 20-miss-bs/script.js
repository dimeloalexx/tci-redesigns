(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "missbs1@hotmail.com";
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // ---------- Turks and Caicos time ----------
  function tci() {
    try {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
      const d = new Date(Date.UTC(+p.year, +p.month - 1, +p.day));
      return { date: d, dow: d.getUTCDay(), min: (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10) };
    } catch (e) { return null; }
  }
  const OPEN = 10 * 60, CLOSE = 19 * 60;
  const fmtDay = d => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
  const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
  const iso = d => d.toISOString().slice(0, 10);

  function status() {
    const t = tci(); if (!t) return;
    let state = "closed", text;
    if (t.dow === 0) text = "Sunday: call ahead";
    else if (t.min >= OPEN && t.min < CLOSE) { state = "open"; text = "Open now, until 7pm"; }
    else if (t.min < OPEN) text = "Opens today at 10am";
    else text = t.dow === 6 ? "Closed now, back Monday at 10am" : "Closed now, opens tomorrow at 10am";
    $$("[data-status]").forEach(s => { s.dataset.state = state; $("[data-status-text]", s).textContent = text; });
    // the next fish fry and the next karaoke night, by date
    $$("[data-next]").forEach(el => {
      const want = +el.dataset.next, ahead = (want - t.dow + 7) % 7;
      el.textContent = ahead === 0 ? (t.min < CLOSE ? `Today, ${fmtDay(t.date)}` : `Next: ${fmtDay(addDays(t.date, 7))}`) : `Next: ${fmtDay(addDays(t.date, ahead))}`;
    });
  }
  status(); setInterval(status, 60000);

  // ---------- A picnic for the road ----------
  const ITEMS = [
    ["Conch fritters", ""], ["Fried fish strips", ""], ["Fish burger", ""], ["Lobster wrap", ""],
    ["Fried chicken", ""], ["BBQ chicken", ""], ["Peas n' rice", "side"], ["Baked mac n' cheese", "side"],
    ["Coleslaw", "side"], ["Johnny cake", "island cornbread"], ["Banana bread", ""], ["Cinnamon roll", ""],
  ];
  const qty = Object.fromEntries(ITEMS.map(([n]) => [n, 0]));
  const list = $("[data-items]"), summary = $("[data-summary]"), send = $("[data-send]");
  const dayIn = $("[data-day]"), timeIn = $("[data-time]"), nameIn = $("[data-name]");
  list.innerHTML = ITEMS.map(([n, note], i) => `<div class="item-row"><span>${n}${note ? `<small>${note}</small>` : ""}</span><span class="step"><button type="button" aria-label="One less ${n}" data-minus="${i}">−</button><output data-q="${i}" aria-live="polite">0</output><button type="button" aria-label="One more ${n}" data-plus="${i}">+</button></span></div>`).join("");
  list.addEventListener("click", e => {
    const b = e.target.closest("[data-plus], [data-minus]"); if (!b) return;
    const i = +(b.dataset.plus ?? b.dataset.minus), n = ITEMS[i][0];
    qty[n] = Math.max(0, Math.min(20, qty[n] + (b.dataset.plus !== undefined ? 1 : -1)));
    $(`[data-q="${i}"]`).textContent = qty[n];
    renderOrder();
  });
  for (let m = OPEN; m <= CLOSE - 30; m += 30) {
    const h = Math.floor(m / 60), mm = m % 60, label = `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
    timeIn.insertAdjacentHTML("beforeend", `<option value="${label}">${label}</option>`);
  }
  timeIn.value = "12:00pm";
  const now = tci();
  if (now) {
    // the next day the kitchen is open: today if there is still time, never a Sunday
    let d = now.date; if (now.dow === 0 || now.min > CLOSE - 60) d = addDays(d, 1); if (d.getUTCDay() === 0) d = addDays(d, 1);
    dayIn.value = iso(d); dayIn.min = iso(now.date);
  }
  [dayIn, timeIn, nameIn].forEach(x => x.addEventListener("input", renderOrder));

  function renderOrder() {
    const picked = ITEMS.filter(([n]) => qty[n] > 0).map(([n]) => `${qty[n]} × ${n}`);
    const d = dayIn.value ? new Date(dayIn.value + "T00:00:00Z") : null;
    const when = `${d ? fmtDay(d) : "Day to confirm"}, ${timeIn.value}`;
    const sunday = d && d.getUTCDay() === 0;
    summary.innerHTML = picked.length
      ? picked.map(p => `<li><span>${p}</span></li>`).join("") + `<li class="when"><span>Pickup ${when}${sunday ? " (Sunday: call to check)" : ""}</span></li>`
      : `<li class="empty">Nothing packed yet. Add something above.</li>`;
    const body = `Hello Miss B,\n\nWe'd like a picnic to go, please:\n${picked.map(p => "- " + p).join("\n") || "- (we'll tell you)"}\n\nPickup: ${when}\nName: ${nameIn.value.trim()}\nPhone:\n\nThank you!`;
    send.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Picnic to go, " + when)}&body=${encodeURIComponent(body)}`;
  }
  renderOrder();

  // ---------- The day across: the car follows the itinerary ----------
  const route = $("[data-route]"), car = $("[data-car]"), rows = $$(".row[data-stop]");
  const total = route.getTotalLength();
  route.style.strokeDasharray = `${total}`;
  let at = 0, target = 0, raf = 0;
  function place(f) {
    const pt = route.getPointAtLength(total * f);
    car.setAttribute("cx", pt.x); car.setAttribute("cy", pt.y);
    route.style.strokeDashoffset = `${total * (1 - f)}`;
  }
  function tween() {
    at += (target - at) * (reduce ? 1 : .12);
    if (Math.abs(target - at) < .001) at = target;
    place(at);
    raf = at === target ? 0 : requestAnimationFrame(tween);
  }
  function follow() {
    const mid = innerHeight * .55;
    let best = rows[0], d = Infinity;
    rows.forEach(r => { const b = r.getBoundingClientRect(), dd = Math.abs(b.top + b.height / 2 - mid); if (dd < d) { d = dd; best = r; } });
    rows.forEach(r => r.classList.toggle("is-on", r === best));
    target = +best.dataset.stop;
    if (!raf) raf = requestAnimationFrame(tween);
  }
  place(0); follow();
  window.addEventListener("scroll", follow, { passive: true });

  // ---------- Entrances ----------
  const rev = $$(".wk, .sheet, .day-text > .h2, .day-lead, .slip, .picnic-intro > *, .order > *, .guest-card, .vcard, .postcard");
  rev.forEach(n => n.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(n => n.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${Math.min(i, 5) * 70}ms`; e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.08 });
    rev.forEach(n => io.observe(n));
  }
})();
