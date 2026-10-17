(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = "16493476595";
  const EMAIL = "darnleydaniel@live.com";
  const root = document.documentElement;

  // ---------- Sky stops: dawn → morning → noon → afternoon → sunset → dusk → night ----------
  const STOPS = [[0, "#ffd9c4"], [0.16, "#cdeef5"], [0.36, "#8fd8e6"], [0.56, "#ffe2a8"], [0.72, "#ff9b6b"], [0.84, "#5b4b8a"], [1, "#0e1a33"]];
  const hex = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
  function skyAt(p) {
    for (let i = 1; i < STOPS.length; i++) {
      if (p <= STOPS[i][0]) {
        const [p0, c0] = STOPS[i - 1], [p1, c1] = STOPS[i];
        return mix(hex(c0), hex(c1), (p - p0) / (p1 - p0));
      }
    }
    return STOPS[STOPS.length - 1][1];
  }

  // stars
  const stars = $("[data-stars]");
  for (let k = 0; k < 70; k++) {
    const s = document.createElement("i");
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 70 + "%";
    s.style.animationDelay = -Math.random() * 3 + "s";
    stars.appendChild(s);
  }

  const orb = $("[data-orb]"), clock = $("[data-clock]"), sunsetMedia = $("[data-parallax]");
  const fmt = (m) => { const h = Math.floor(m / 60) % 24, mm = m % 60; return `${((h + 11) % 12) + 1}:${String(mm).padStart(2, "0")}${h < 12 ? "am" : "pm"}`; };
  let ticking = false;
  function onScroll() {
    ticking = false;
    const p = Math.min(1, scrollY / Math.max(1, root.scrollHeight - innerHeight));
    root.style.setProperty("--sky", skyAt(p));
    const night = Math.max(0, (p - 0.8) / 0.2);
    root.style.setProperty("--night", night.toFixed(2));
    document.body.classList.toggle("is-night", p > 0.82);
    const th = Math.PI * (1 - p);
    orb.setAttribute("cx", (30 + 26 * Math.cos(th)).toFixed(1));
    orb.setAttribute("cy", (28 - 26 * Math.sin(th)).toFixed(1));
    root.style.setProperty("--orb", p > 0.82 ? "#e8eefc" : p > 0.66 ? "#ff7a3d" : "#ffb347");
    clock.textContent = fmt(Math.round((360 + p * 1020) / 15) * 15); // 6:00am → 11:00pm
    if (sunsetMedia && !reduce) {
      const r = sunsetMedia.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) sunsetMedia.style.transform = `translate3d(0, ${(((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -6).toFixed(2)}%, 0)`;
    }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  // ---------- Headlines word by word ----------
  $$("[data-words]").forEach(h => {
    const t = h.textContent.trim();
    h.setAttribute("aria-label", t);
    h.innerHTML = t.split(/\s+/).map((w, i) => `<span class="w" aria-hidden="true" style="transition-delay:${i * 80}ms">${w}</span>`).join(" ");
  });
  const reveals = $$(".ride, .tour, .errands li, .sunset-card, .builder, .preview, .lead, .hero-sub, .hero-actions, .proof");
  reveals.forEach(el => el.setAttribute("data-reveal", ""));
  const all = [...$$("[data-words]"), ...reveals];
  if (!("IntersectionObserver" in window) || reduce) all.forEach(el => el.classList.add("is-in"));
  else {
    const io = new IntersectionObserver((es) => es.filter(e => e.isIntersecting).forEach((e, n) => {
      if (e.target.hasAttribute("data-reveal")) e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.12 });
    all.forEach(el => io.observe(el));
  }

  // ---------- The chat types itself ----------
  const msgs = $$("[data-chat] .msg");
  if (reduce) msgs.forEach(m => m.classList.add("is-in"));
  else {
    const chat = $("[data-chat]");
    let i = 0;
    const next = () => {
      if (i >= msgs.length) return;
      const m = msgs[i];
      if (m.classList.contains("them")) {
        const t = document.createElement("span");
        t.className = "typing"; t.innerHTML = "<i></i><i></i><i></i>";
        chat.insertBefore(t, m);
        setTimeout(() => { t.remove(); m.classList.add("is-in"); i++; setTimeout(next, 700); }, 1100);
      } else { m.classList.add("is-in"); i++; setTimeout(next, 900); }
    };
    msgs[0].classList.add("is-in"); i = 1;
    setTimeout(next, 500);
  }

  // ---------- Ride builder → WhatsApp ----------
  const f = $("[data-builder]"), preview = $("[data-preview]"), send = $("[data-send]"), mail = $("[data-mail]"), flightRow = $("[data-flight]");
  const d = $("[data-date]"); const t0 = new Date(); t0.setDate(t0.getDate() + 1);
  d.value = t0.toISOString().slice(0, 10); d.min = new Date().toISOString().slice(0, 10);
  function build() {
    const svc = f.svc.value;
    const airport = svc.includes("airport");
    flightRow.style.display = airport ? "" : "none";
    const date = f.date.value ? new Date(f.date.value + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "a date to confirm";
    const [hh, mm] = (f.time.value || "14:00").split(":").map(Number);
    const n = Number(f.people.value) || 1;
    let msg = `Hi Darnley! I'd like ${svc} on ${date} at ${fmt(hh * 60 + mm)} for ${n} ${n === 1 ? "person" : "people"}.`;
    if (airport && f.flight.value.trim()) msg += ` Flight: ${f.flight.value.trim()}.`;
    if (f.stay.value.trim()) msg += ` We're staying at ${f.stay.value.trim()}.`;
    msg += " Thank you!";
    preview.textContent = msg;
    preview.classList.remove("pop"); void preview.offsetWidth; preview.classList.add("pop");
    send.href = `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`;
    mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Ride request")}&body=${encodeURIComponent(msg)}`;
  }
  f.addEventListener("input", build);
  f.addEventListener("change", build);
  build();
})();
