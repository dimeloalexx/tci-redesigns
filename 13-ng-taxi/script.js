(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = "16492432859";

  // ---------- Reveals ----------
  const rev = $$(".hero-band > *, .board-head > *, .picker, .board-wrap, .gates > h2, .pass, .gates-note, .where > h2, .dests li, .last > *");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.1 });
    rev.forEach(el => io.observe(el));
  }

  // ---------- The departures board ----------
  // legs: an outing is a ride there and a ride back; the airport runs are one ride each
  const RIDES = {
    arrive:    { order: 0, time: "FLT",  label: "Airport to villa",  status: "Meet",     legs: 1, text: "Airport pick-up when we land" },
    groceries: { order: 1, time: "10AM", label: "Supermarket",       status: "On time",  legs: 2, text: "Supermarket run" },
    chalk:     { order: 2, time: "9AM",  label: "Chalk Sound",       status: "On time",  legs: 2, text: "Chalk Sound and Sapodilla Hill" },
    tour:      { order: 3, time: "10AM", label: "Island tour",       status: "Tour",     legs: 1, text: "Island tour" },
    turtle:    { order: 4, time: "6PM",  label: "Turtle Cove",       status: "On time",  legs: 2, text: "Turtle Cove for the evening" },
    fishfry:   { order: 5, time: "6PM",  label: "Fish Fry, Bight",   status: "Thu only", legs: 2, text: "Thursday Fish Fry at the Bight" },
    dinner:    { order: 6, time: "7PM",  label: "Grace Bay dinner",  status: "On time",  legs: 2, text: "Dinner in Grace Bay" },
    depart:    { order: 7, time: "FLT",  label: "Villa to airport",  status: "Boarding", legs: 1, text: "Ride to the airport for our flight" },
  };
  let day = 1, rides = [], nextId = 1;
  const dayOut = $("[data-day-out]"), rowsEl = $("[data-rows]"), verdict = $("[data-verdict]"), send = $("[data-send]");
  $$("[data-day]").forEach(b => b.addEventListener("click", () => {
    day = Math.max(1, Math.min(14, day + Number(b.dataset.day)));
    dayOut.textContent = `Day ${day}`;
  }));
  // each word is kept whole so a narrow board wraps between words, never inside one
  const flap = (s, delay = 0) => { let k = 0; return s.split(" ").map(w => `<span class="fw">${[...w].map(ch => `<i style="animation-delay:${delay + (k++) * 22}ms">${ch}</i>`).join("")}</span>`).join(""); };
  $$("[data-ride]").forEach(b => b.addEventListener("click", () => {
    const k = b.dataset.ride;
    // the airport runs move to the natural ends of the trip
    const d = k === "arrive" ? 1 : day;
    rides.push({ id: nextId++, k, day: d, fresh: true });
    render();
  }));
  rowsEl.addEventListener("click", e => {
    const row = e.target.closest("[data-id]"); if (!row) return;
    rides = rides.filter(r => r.id !== Number(row.dataset.id));
    render();
  });
  rowsEl.addEventListener("keydown", e => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const row = e.target.closest("[data-id]"); if (!row) return;
    e.preventDefault(); row.click();
  });
  function render() {
    // the flight home is always the last ride of the trip
    const lastOther = Math.max(0, ...rides.filter(r => r.k !== "depart").map(r => r.day));
    rides.forEach(r => { if (r.k === "depart" && r.day < lastOther) r.day = lastOther; });
    rides.sort((a, b) => a.day - b.day || RIDES[a.k].order - RIDES[b.k].order);
    if (!rides.length) rowsEl.innerHTML = `<div class="b-row empty" role="row"><span role="cell">No rides yet. Tap one to add it.</span></div>`;
    else rowsEl.innerHTML = rides.map(r => {
      const R = RIDES[r.k];
      return `<div class="b-row ride${r.fresh && !reduce ? " flip" : ""}" role="row" tabindex="0" data-id="${r.id}" aria-label="Day ${r.day}, ${R.text}. Press to remove.">
        <span role="cell"><span class="flap">${flap("D" + r.day)}</span></span>
        <span role="cell"><span class="flap">${flap(R.time, 60)}</span></span>
        <span role="cell"><span class="flap">${flap(R.label, 120)}</span></span>
        <span role="cell">${R.status}</span></div>`;
    }).join("");
    rides.forEach(r => (r.fresh = false));

    const n = rides.reduce((s, r) => s + RIDES[r.k].legs, 0);
    const days = rides.length ? Math.max(...rides.map(r => r.day)) : 0;
    let gate = "A", title = "Pay as you go", why = "Add your rides and we'll suggest the best way to pay.";
    if (n > 0 && n <= 4) why = `${n} ${n === 1 ? "ride" : "rides"} in all: paying per ride keeps it simple.`;
    else if (n >= Math.max(8, days * 2)) { gate = "B"; title = "Pay for your whole trip"; why = `${n} rides over ${days} ${days === 1 ? "day" : "days"}: ask for the whole-trip flat rate and compare.`; }
    else if (n > 4) { gate = "C"; title = "Planned travel"; why = `${n} rides with a plan: send it and we'll arrange each one.`; }
    $("[data-v-gate]").textContent = `Gate ${gate}`;
    $("[data-v-title]").textContent = title;
    $("[data-v-why]").textContent = why;
    if (!reduce) { verdict.classList.remove("bump"); void verdict.offsetWidth; verdict.classList.add("bump"); }

    const lines = rides.map(r => `Day ${r.day}: ${RIDES[r.k].text}`).join("\n");
    const msg = rides.length
      ? `Hi N&G! Here are the rides for our stay (${n} in all):\n${lines}\n\nWe think "${title}" suits us. Could you send us the rates?\nWhere we're staying:\nFlight in / out:`
      : "Hi N&G! I'd like to book a taxi. ";
    send.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
  }
  // start with the two airport runs so the board is never empty on arrival
  rides.push({ id: nextId++, k: "arrive", day: 1, fresh: false }, { id: nextId++, k: "depart", day: 5, fresh: false });
  render();
})();
