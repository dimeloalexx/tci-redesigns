(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Reveals ----------
  const rev = $$(".statement, .menu-head > *, .cat-head, .dishes li, .plates figure, .chef .head, .chef-text > *, .tiles .t, .week-note, .coupon, .rentals, .foot-grid > *, .foot-last");
  rev.forEach(el => el.setAttribute("data-reveal", ""));
  const shutter = $("[data-shutter]");
  if (!("IntersectionObserver" in window) || reduce) { rev.forEach(el => el.classList.add("is-in")); shutter.classList.add("is-open"); }
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, n) => {
      e.target.style.transitionDelay = `${n * 70}ms`;
      e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.1 });
    rev.forEach(el => io.observe(el));
    const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("is-open"); so.disconnect(); } }), { threshold: 0.25 });
    so.observe(shutter);
  }

  // ---------- The pot: knock it the way Chef Nik does ----------
  // the okra and rice from the story, one ingredient per knock; the sixth knock cracks it
  const POT = ["okra", "rice", "lima beans", "conch", "pigtails", "salt beef"];
  // the crack follows the same zigzag as the split between the two halves
  const LINE = [[56, -2], [50, 13], [56.5, 24], [48.5, 37], [53, 50]];
  const pot = $("[data-pot]"), wrap = pot.parentElement, crack = $("[data-crack]"), list = $("[data-pot-in]");
  const hint = $("[data-pot-hint]"), quote = $("[data-pot-quote]"), soundBtn = $("[data-sound]");
  let knocks = 0, sound = true, ctx = null;

  function crackTo(depth) {
    // walk the centreline down to `depth`, tapering from 2.6 units wide at the rim to a point
    const pts = [LINE[0]];
    for (let i = 1; i < LINE.length; i++) {
      const [x0, y0] = LINE[i - 1], [x1, y1] = LINE[i];
      if (y1 <= depth) { pts.push(LINE[i]); continue; }
      const t = (depth - y0) / (y1 - y0); pts.push([x0 + (x1 - x0) * t, depth]); break;
    }
    const w = y => 2.6 * Math.max(0, 1 - (y + 2) / (depth + 2));
    const left = pts.map(([x, y]) => `${(x - w(y)).toFixed(2)},${y.toFixed(2)}`);
    const right = pts.slice(0, -1).reverse().map(([x, y]) => `${(x + w(y)).toFixed(2)},${y.toFixed(2)}`);
    crack.setAttribute("points", [...left, ...right].join(" "));
  }

  function clang() {
    if (!sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;
      // a cast-iron "tonk": a low tone with two inharmonic partials, pitched like a little steel-pan line
      const base = [196, 220, 247, 294, 330, 392][knocks % 6];
      const out = ctx.createGain(); out.gain.value = 0.32; out.connect(ctx.destination);
      [[1, 0.9, 0.5], [2.76, 0.35, 0.22], [5.4, 0.18, 0.09]].forEach(([mult, vol, len]) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.value = base * mult;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + len);
        o.connect(g).connect(out); o.start(t); o.stop(t + len + 0.02);
      });
      // the spoon's click
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
      const n = ctx.createBufferSource(), ng = ctx.createGain(); ng.gain.value = 0.5;
      n.buffer = buf; n.connect(ng).connect(out); n.start(t);
    } catch (e) { sound = false; }
  }

  function tok(ev) {
    if (reduce) return;
    const r = wrap.getBoundingClientRect();
    const x = ev.clientX ? ev.clientX - r.left : r.width * 0.3, y = ev.clientY ? ev.clientY - r.top : r.height * 0.3;
    const s = document.createElement("span");
    s.className = "tok"; s.textContent = knocks >= POT.length ? "CRACK!" : "tok!"; s.setAttribute("aria-hidden", "true");
    s.style.left = `${x}px`; s.style.top = `${y}px`;
    wrap.appendChild(s); setTimeout(() => s.remove(), 700);
  }

  pot.addEventListener("click", ev => {
    if (knocks >= POT.length) {
      // a fresh pot
      knocks = 0; list.innerHTML = ""; pot.classList.remove("split"); wrap.classList.remove("done");
      quote.hidden = true; hint.hidden = false; crackTo(START);
      hint.querySelector("b").textContent = "Give it a knock.";
      return;
    }
    clang();
    knocks++;
    tok(ev);
    const li = document.createElement("li"); li.textContent = POT[knocks - 1]; list.appendChild(li);
    if (!reduce) { pot.classList.remove("knock"); void pot.offsetWidth; pot.classList.add("knock"); }
    if (knocks < POT.length) {
      crackTo(START + knocks * 6);
      hint.querySelector("b").textContent = knocks === 1 ? "Again." : `${knocks} of ${POT.length}. Keep going.`;
    } else {
      crackTo(50);
      setTimeout(() => { pot.classList.add("split"); wrap.classList.add("done"); hint.hidden = true; quote.hidden = false; }, reduce ? 0 : 160);
    }
  });
  // a hairline crack is already there before the first knock
  const START = 18;
  crackTo(START);
  soundBtn.addEventListener("click", () => {
    sound = !sound;
    soundBtn.setAttribute("aria-pressed", String(sound));
    soundBtn.textContent = sound ? "Sound on" : "Sound off";
  });

  // ---------- The week: today, in Grace Bay time ----------
  // minutes after midnight; Monday closed
  const HOURS = { 0: [[1020, 1380]], 1: [], 2: [[690, 900], [1020, 1380]], 3: [[690, 900], [1020, 1380]], 4: [[690, 900], [1020, 1380]], 5: [[690, 900], [1020, 1380]], 6: [[540, 840], [1020, 1380]] };
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const clock = m => { const h = Math.floor(m / 60), mm = m % 60, h12 = ((h + 11) % 12) + 1; return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; };
  const todayCap = $("[data-today]");
  function setToday() {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    const day = DAYS.indexOf(get("weekday")), mins = Number(get("hour")) * 60 + Number(get("minute"));
    $$("[data-day]").forEach(t => t.classList.toggle("is-today", Number(t.dataset.day) === day));
    const now = HOURS[day].find(([a, b]) => mins >= a && mins < b);
    let text;
    if (now) text = `Open now, until ${clock(now[1])}`;
    else {
      const later = HOURS[day].find(([a]) => a > mins);
      if (later) text = `Opens at ${clock(later[0])} today`;
      else {
        let d = (day + 1) % 7; while (!HOURS[d].length) d = (d + 1) % 7;
        text = `Closed now · back ${DAYS[d]} ${clock(HOURS[d][0][0])}`;
      }
    }
    todayCap.textContent = text;
  }
  setToday(); setInterval(setToday, 60000);

  // ---------- Catering: the coupon writes the email ----------
  const coupon = $("[data-coupon]"), send = $("[data-c-send]");
  function draft() {
    const f = coupon.elements;
    const date = f.date.value ? new Date(f.date.value + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "";
    const guests = f.guests.value;
    const subject = `Catering: ${f.event.value}${date ? ", " + date : ""}`;
    const body = `Hi Chef Nik,\n\nWe'd love Crackpot Kitchen to cater our event.\n\nEvent: ${f.event.value}\nDate: ${date}\nGuests: ${guests}\nWhere: ${f.venue.value}\n\nAnything else:\n\nName:\nPhone:\n\nThank you!`;
    send.href = `mailto:bookings@crackpotkitchen.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  // on a phone the perforation runs across the coupon, so the side notches follow it
  const cLeft = $(".c-left", coupon);
  const notch = () => coupon.style.setProperty("--notch", innerWidth < 760 ? `${cLeft.offsetHeight}px` : "0");
  notch(); addEventListener("resize", notch);
  coupon.addEventListener("input", draft);
  coupon.addEventListener("change", draft);
  coupon.addEventListener("submit", e => { e.preventDefault(); send.click(); });
  draft();
})();
