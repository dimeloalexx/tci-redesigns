// Island Adventure TCI: the charter accordion, "Pick your day" from the live wind forecast, and the email-a-date bar.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- charter accordion: one stage open at a time ---------- */
  const stages = $$(".stage");
  stages.forEach(st => $(".stage-tab", st).addEventListener("click", () => {
    stages.forEach(o => { const open = o === st; o.classList.toggle("is-open", open); $(".stage-tab", o).setAttribute("aria-expanded", String(open)); });
  }));

  /* ---------- the ask-for-a-date bar ---------- */
  const form = $("[data-ask]"), tour = $("[data-tour]"), date = $("[data-date]"), msg = $("[data-ask-msg]");
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  if (date) date.min = iso(new Date());
  const choose = name => {
    if (!tour || !name) return;
    let opt = [...tour.options].find(o => o.text === name);
    if (!opt) { opt = new Option(name); tour.add(opt); }
    tour.value = opt.text;
  };
  $$("[data-pick]").forEach(a => a.addEventListener("click", () => choose(a.dataset.pick)));
  const msgDefault = msg ? msg.innerHTML : "";
  if (form) form.addEventListener("submit", e => {
    e.preventDefault();
    if (!date.value) { msg.textContent = "Pick a date first, then press Email the team."; date.focus(); return; }
    const when = new Date(date.value + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const subject = `${tour.value} on ${when}`;
    const body = `Hello Island Adventure,\n\nWe would like to book the ${tour.value} on ${when}.\n\nHow many of us: \nNames: \nWhere we are staying (for the shuttle): \n\nThank you!`;
    const href = `mailto:info@islandadventuretci.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    form.dataset.lastMail = href;
    msg.textContent = `Opening your email app for the ${tour.value} on ${when}.`;
    setTimeout(() => { msg.innerHTML = msgDefault; }, 7000);
    location.href = href;
  });

  /* ---------- Pick your day: the next seven days of wind at Leeward ---------- */
  const PICS = { kayak: "assets/clear-kayaks.jpg", boat: "assets/provo-shallows.jpg", atv: "assets/atv.jpg" };
  const KIND = {
    kayak: { what: "Clear kayak day", tour: "Mangrove Clear Kayak Tour", why: w => `Light wind, around ${w} mph at its strongest. Calm water is the clearest through the kayak floor.` },
    boat: { what: "Boat day", tour: "Private charter, half day", why: w => `A breeze up to ${w} mph. Fine on a boat, and the captain picks the sheltered cays and sandbars.` },
    atv: { what: "ATV day", tour: "ATV or UTV, two hours", why: w => `Windy, up to ${w} mph. The water gets choppy, but the west-side trails don't mind the wind.` },
  };
  const classify = w => w <= 12 ? "kayak" : w <= 20 ? "boat" : "atv";
  const daysBox = $("[data-days]"), card = $("[data-pick-card]");
  let forecast = [];

  const pick = (i, animate = true) => {
    const d = forecast[i]; if (!d) return;
    $$(".daycard", daysBox).forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
    const k = KIND[d.kind];
    $("[data-pick-when]").textContent = `${d.long}, ${d.rain}% chance of rain`;
    $("[data-pick-what]").textContent = k.what;
    $("[data-pick-why]").textContent = k.why(d.wind) + (d.rain >= 50 ? " Showers are possible, so bring a light layer." : "");
    $("[data-pick-ask]").onclick = () => { choose(k.tour); if (date) date.value = d.iso; };
    card.dataset.kind = d.kind; card.dataset.iso = d.iso;
    card.hidden = false;
    if (animate && !reduce) { card.classList.remove("is-new"); void card.offsetWidth; card.classList.add("is-new"); }
  };

  const draw = () => {
    daysBox.innerHTML = forecast.map((d, i) => `<button type="button" class="daycard k-${d.kind}" aria-pressed="false" style="--d:${i * 70}ms" aria-label="${d.long}: ${KIND[d.kind].what}, wind up to ${d.wind} mph">
      <span class="d-day">${d.short}</span><span class="d-date">${d.date}</span><img class="d-pic" src="${PICS[d.kind]}" alt="" width="320" height="200" loading="lazy">
      <span class="d-what">${KIND[d.kind].what}</span><span class="d-wind">Wind to ${d.wind} mph, rain ${d.rain}%</span></button>`).join("");
    $$(".daycard", daysBox).forEach((b, i) => b.addEventListener("click", () => pick(i)));
    pick(0, false);
  };

  const load = async () => {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=21.80&longitude=-72.16&daily=wind_speed_10m_max,precipitation_probability_max&wind_speed_unit=mph&timezone=America%2FGrand_Turk&forecast_days=7";
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 9000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      const j = await r.json();
      const { time, wind_speed_10m_max: wind, precipitation_probability_max: rain } = j.daily;
      forecast = time.map((day, i) => {
        const dt = new Date(day + "T12:00:00");
        const w = Math.round(wind[i]);
        return { iso: day, wind: w, rain: rain[i] ?? 0, kind: classify(w),
          short: i === 0 ? "Today" : i === 1 ? "Tomorrow" : dt.toLocaleDateString("en-US", { weekday: "long" }),
          date: dt.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          long: dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) };
      });
      draw();
    } catch {
      const m = $("[data-days-msg]");
      if (m) m.innerHTML = 'The forecast could not load just now. Call <a href="tel:+16493328463">649 332 8463</a> and the team will tell you which day suits which adventure.';
    } finally { clearTimeout(t); }
  };
  if (daysBox) load();

  /* ---------- one question open at a time (for browsers without details[name]) ---------- */
  $$(".qs details").forEach(d => d.addEventListener("toggle", () => { if (d.open) $$(".qs details").forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- entrances ---------- */
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$(".reveal", e.target).forEach((el, i) => { el.style.setProperty("--d", i * 80 + "ms"); el.classList.add("is-in"); });
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    $$("section").forEach(s => io.observe(s));
  } else $$(".reveal").forEach(el => el.classList.add("is-in"));

  /* ---------- phone bar: away while the hero, the band, the booking bar or the footer is on screen ---------- */
  const bar = $("[data-bar]");
  if (bar && "IntersectionObserver" in window) {
    const seen = new Set();
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); bar.classList.toggle("is-away", seen.size > 0); });
    [$(".hero"), $(".band"), $(".book"), $(".foot")].forEach(el => el && io.observe(el));
  }
})();
