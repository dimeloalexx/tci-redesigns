(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- The fleet, from Scooter Bob's own rate sheet ----------
  // rate = 1 to 4 days, rate5 = per day for 5 days or more; motor = taxed, licensed and needs a driver of 25+
  const RIDES = {
    economy: { note: "All car rentals include airport pick-up and return. \"Economy is our first name.\"", models: [
      { name: "Toyota Vitz", seats: "4 adults, 2 bags", rate: 59, rate5: 55, motor: true },
      { name: "Honda Fit", seats: "4 adults, hatchback", rate: 59, rate5: 55, motor: true } ] },
    suv: { note: "Swapped into a 4WD for a day? Guests say they did it with no extra charge.", models: [
      { name: "Toyota Rush", seats: "5 adults", rate: 85, rate5: 79, motor: true },
      { name: "Honda CR-V", seats: "5 adults", rate: 89, rate5: 80, motor: true },
      { name: "Kia Seltos 2023", seats: "5 adults", rate: 125, rate5: 115, motor: true },
      { name: "Jeep Grand Cherokee", seats: "5 adults", rate: 125, rate5: 115, motor: true },
      { name: "Jeep Wrangler, hardtop", seats: "5 adults", rate: 169, rate5: 159, motor: true } ] },
    van: { note: "Room for the whole family and all the sunscreen. Limited selection, so book early.", models: [
      { name: "Toyota Alphard", seats: "7 to 8 adults", rate: 145, rate5: 125, motor: true },
      { name: "Toyota Sienna", seats: "7 to 8 adults", rate: 145, rate5: 125, motor: true },
      { name: "Honda Odyssey", seats: "7 adults", rate: 145, rate5: 125, motor: true },
      { name: "Toyota Hi-Ace", seats: "10 adults", rate: 245, rate5: 195, motor: true } ] },
    truck: { note: "For the big fish, the big move, or a beach picnic with all your new friends.", models: [
      { name: "Toyota Tacoma pick-up", seats: "5 adults, 4 doors", rate: 150, rate5: 120, motor: true } ] },
    ebike: { note: "Pedal assist or a throttle for the hills. The crew shows you how before you ride.", models: [
      { name: "Rad Runner utility e-bike", seats: "1 rider, cargo rack", rate: 49, rate5: 45, motor: false },
      { name: "Rad Expand 5 folding e-bike", seats: "1 rider", rate: 49, rate5: 45, motor: false } ] },
    cruiser: { note: "Padded seats, coaster or hand brakes, with or without gears. Call from your villa.", models: [
      { name: "Beach cruiser bicycle", seats: "1 rider", rate: 18, rate5: 15, motor: false } ] },
    snorkel: { note: "Ride your rental bike to the beach with your rental snorkel gear.", models: [
      { name: "Snorkel set: mask, fins, snorkel", seats: "1 set", rate: 15, rate5: 15, motor: false } ] },
  };
  const ALL = Object.entries(RIDES).flatMap(([k, r]) => r.models.map(m => ({ ...m, cat: k })));
  const money = n => `$${n.toFixed(2).replace(/\.00$/, "")}`;

  // ---------- Open now? Mon to Sat 9 to 5, Sundays 9 to 1, Turks & Caicos time ----------
  const status = $("[data-status]");
  function setStatus() {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = get("weekday"), mins = Number(get("hour")) * 60 + Number(get("minute"));
    const close = day === "Sun" ? 13 * 60 : 17 * 60;
    const open = mins >= 9 * 60 && mins < close;
    status.textContent = open ? `Open now, until ${day === "Sun" ? "1pm" : "5pm"}` : mins < 9 * 60 ? "Opens at 9am today" : "Closed now, back at 9am";
    status.classList.toggle("closed", !open);
  }
  setStatus(); setInterval(setStatus, 60000);

  // ---------- Reveals ----------
  const rev = $$(".hero-text > *, .disc-stage, .ride-list, .quote > h2, .coupon, .windshield-wrap, .baits-head, .baits-photo, .items li, .panel > *, .tile, .foot > *");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.1 });
    rev.forEach(el => io.observe(el));
  }

  // ---------- Rides: pick a category, the disc swaps its photo ----------
  const tabs = $$("[data-ride]"), facts = $("[data-ride-facts]"), modelSel = $("[data-model]");
  modelSel.innerHTML = Object.entries(RIDES).map(([k, r]) => `<optgroup label="${tabs.find(t => t.dataset.ride === k).textContent}">${r.models.map(m => `<option value="${ALL.findIndex(a => a.name === m.name)}">${m.name}</option>`).join("")}</optgroup>`).join("");
  function showRide(k) {
    tabs.forEach(t => t.setAttribute("aria-selected", String(t.dataset.ride === k)));
    $$("[data-ride-img]").forEach(i => i.classList.toggle("is-on", i.dataset.rideImg === k));
    const r = RIDES[k];
    facts.innerHTML = r.models.map(m => `<div class="rf-row"><b>${m.name}</b><span>${m.seats} · $${m.rate}/day${m.rate5 !== m.rate ? `, $${m.rate5} for 5+` : ""}</span></div>`).join("") + `<p class="rf-note">${r.note}</p>`;
    if (!reduce) { facts.classList.remove("swap"); void facts.offsetWidth; facts.classList.add("swap"); }
  }
  tabs.forEach(t => t.addEventListener("click", () => {
    showRide(t.dataset.ride);
    // the quote follows the category you are looking at
    const first = ALL.findIndex(a => a.cat === t.dataset.ride);
    modelSel.value = String(first); quote(true);
  }));
  $("[data-ride-tabs]").addEventListener("keydown", e => {
    if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(e.key)) return;
    e.preventDefault();
    const i = tabs.findIndex(t => t.getAttribute("aria-selected") === "true");
    const next = tabs[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : tabs.length - 1)) % tabs.length];
    next.focus(); next.click();
  });
  showRide("economy");

  // ---------- The quote: your name on the windshield, the real total ----------
  const f = $("[data-quote]"), daysOut = $("[data-days]"), bill = $("[data-bill]"), send = $("[data-send]");
  const pName = $("[data-p-name]"), pRide = $("[data-p-ride]"), placard = $(".placard");
  let days = 5, lastName = "";
  $$("[data-d]").forEach(b => b.addEventListener("click", () => { days = Math.max(1, Math.min(60, days + Number(b.dataset.d))); quote(false); }));
  function quote(bump) {
    const m = ALL[Number(modelSel.value)] || ALL[0];
    const family = f.family.value.trim();
    const where = f.where.value;
    const cdwBox = f.cdw;
    cdwBox.disabled = !m.motor;
    if (!m.motor) cdwBox.checked = false;
    const perDay = days >= 5 ? m.rate5 : m.rate;
    const base = perDay * days;
    const tax = m.motor ? base * 0.12 : 0;
    const licence = m.motor ? 2.5 * days : 0;
    const cdw = cdwBox.checked ? 15 * days : 0;
    const total = base + tax + licence + cdw;
    daysOut.textContent = days;
    const rows = [[`${days} ${days === 1 ? "day" : "days"} × ${money(perDay)}`, money(base)]];
    if (m.motor) rows.push(["TCI tax, 12%", money(tax)], [`Licensing, $2.50 × ${days}`, money(licence)]);
    if (cdw) rows.push([`Collision cover, $15 × ${days}`, money(cdw)]);
    bill.innerHTML = rows.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join("") + `<div class="total"><dt>Estimated total</dt><dd>${money(total)}</dd></div>` + (m.motor ? "" : `<div><dt>Bicycles and gear: no tax added</dt><dd></dd></div>`);
    pName.textContent = family ? `The ${family} family` : "Your name here";
    const how = where.includes("airport") ? (m.motor ? "key in the visor" : "ready at the shop") : where.includes("hotel") ? "delivered to your door" : "see you in Turtle Cove";
    pRide.textContent = `${m.name} · ${how}`;
    if (bump && !reduce && family !== lastName) { placard.classList.remove("pop"); void placard.offsetWidth; placard.classList.add("pop"); }
    lastName = family;
    const body = `Hi Scooter Bob's,\n\nI'd like to reserve a ${m.name} for ${days} ${days === 1 ? "day" : "days"}${m.motor ? ", waiting at " + where : ""}.${!m.motor ? " Pick up: " + (where.includes("hotel") ? "delivered to our hotel or villa" : "at the Turtle Cove shop") + "." : ""}\nCollision cover: ${cdw ? "yes" : "no"}\nEstimated total from your rate sheet: ${money(total)}\n\nName on the windshield: ${family || ""}\nArrival date and flight:\nPhone:\n\nThank you!`;
    send.href = `mailto:scooterbobs@gmail.com?subject=${encodeURIComponent(`Reservation: ${m.name}, ${days} days`)}&body=${encodeURIComponent(body)}`;
  }
  f.addEventListener("input", () => quote(true));
  f.addEventListener("change", () => quote(true));
  quote(false);

  // ---------- The badge ring turns as you scroll ----------
  const ring = $("[data-ring]");
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking || reduce) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; ring.style.transform = `rotate(${(scrollY / 6).toFixed(1)}deg)`; });
  }, { passive: true });
})();
