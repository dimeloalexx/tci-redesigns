/* Aqua Media TCI, sample #41.
   Home: the cover builder (your name on their magazine cover, booked on WhatsApp).
   Book: the calm-morning forecast (Open-Meteo, wind from 8 to 11 am) and the form
   that writes the WhatsApp message. Gallery: the photo viewer. Then the motion
   layer (GSAP + ScrollTrigger + SplitText), skipped when motion is reduced. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const WA = "https://wa.me/16492413753?text=";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pad = (n) => String(n).padStart(2, "0");
  const localISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  /* the issue date on the covers */
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  $$(".issue-date").forEach((el) => { el.textContent = month; });
  $$(".mag-date").forEach((el) => { el.textContent = "Leeward edition, " + month; });

  /* ---------- put yourself on the cover ---------- */
  const mag = $("#mag");
  if (mag) {
    const nameIn = $("#cover-name");
    const out = $("#mag-name");
    const sub = $("#mag-sub");
    const photo = $(".mag-photo", mag);
    const book = $("#cover-book");
    const T = {
      solo: [(n) => `${n} on Leeward`, "The solo glow issue", "just for me"],
      birthday: [(n) => `${n}'s big day`, "The birthday issue", "for my birthday"],
      honeymoon: [(n) => `${n} in love`, "The honeymoon issue", "for our honeymoon"],
      girls: [(n) => `${n} & the girls`, "The girls' trip issue", "for our girls' trip"],
    };
    /* the cover headline never runs past two lines: shrink it until it fits */
    const fit = () => {
      out.style.fontSize = "";
      for (let i = 0; i < 24; i++) {
        const cs = getComputedStyle(out);
        if (!(out.scrollHeight > parseFloat(cs.lineHeight) * 2.3)) break;
        out.style.fontSize = parseFloat(cs.fontSize) * 0.94 + "px";
      }
    };
    const update = () => {
      const raw = (nameIn.value || "").trim().replace(/\s+/g, " ").slice(0, 16);
      const name = raw || "You";
      const occ = ($('input[name="occasion"]:checked') || {}).value || "solo";
      const [head, subline, what] = T[occ];
      out.textContent = head(name);
      sub.textContent = subline;
      const hi = raw ? `Hi Aqua Media! I'm ${raw}.` : "Hi Aqua Media!";
      book.href = WA + encodeURIComponent(`${hi} I'd like to book a clear kayak drone photoshoot ${what}. I saw my cover on your website!`);
      fit();
    };
    nameIn.addEventListener("input", update);
    $$('input[name="occasion"]').forEach((i) => i.addEventListener("change", update));
    $$('input[name="cover"]').forEach((i) => i.addEventListener("change", () => {
      const next = `img/cover-${i.value}-800.webp`;
      const swap = () => {
        photo.src = next;
        photo.alt = "Your cover: " + i.dataset.alt;
        mag.style.setProperty("--water", i.dataset.water);
      };
      if (window.gsap && !reduce) {
        const pre = new Image();
        pre.src = next;
        gsap.to(photo, { opacity: 0, duration: 0.16, onComplete: () => { swap(); gsap.to(photo, { opacity: 1, duration: 0.4, delay: 0.05 }); } });
      } else swap();
    }));
    $(".builder-form").addEventListener("submit", (e) => { e.preventDefault(); book.click(); });
    window.addEventListener("resize", fit);
    update();
  }

  /* ---------- book: calm-morning forecast ---------- */
  const fc = $("#forecast");
  const dateIn = $("#f-date");
  if (dateIn) dateIn.min = localISO(new Date());
  if (fc) {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=21.816&longitude=-72.162" +
      "&hourly=wind_speed_10m,cloud_cover,precipitation_probability&wind_speed_unit=mph&timezone=America%2FGrand_Turk&forecast_days=7";
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        clearTimeout(timer);
        const h = data.hourly;
        const days = {};
        h.time.forEach((t, i) => {
          const [day, hm] = t.split("T");
          const hr = Number(hm.slice(0, 2));
          if (hr >= 8 && hr <= 10) (days[day] = days[day] || []).push({ w: h.wind_speed_10m[i], c: h.cloud_cover[i], p: h.precipitation_probability[i] });
        });
        const list = Object.entries(days).slice(0, 7).map(([day, arr]) => {
          const avg = (k) => arr.reduce((s, x) => s + (Number(x[k]) || 0), 0) / arr.length;
          return { day, w: Math.round(avg("w")), c: Math.round(avg("c")), p: Math.max(...arr.map((x) => Number(x.p) || 0)) };
        });
        if (!list.length) return;
        const score = (x) => x.w + x.c / 12 + x.p / 10;
        const best = list.reduce((a, b) => (score(b) < score(a) ? b : a));
        const ol = $("#fc-days");
        ol.innerHTML = list.map((x) => {
          const d = new Date(x.day + "T12:00:00");
          const wd = d.toLocaleDateString("en-US", { weekday: "short" });
          const dm = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const label = x.w <= 8 ? "Glassy" : x.w <= 13 ? "Light breeze" : "Breezy";
          const calm = x === best;
          return `<li><button type="button" data-day="${x.day}" aria-pressed="false" aria-label="${wd} ${dm}: ${x.w} miles per hour, ${label}${calm ? ", the calmest morning" : ""}">` +
            `<span class="fc-day">${wd}<small>${dm}</small></span><span class="fc-wind">${x.w}<small> mph</small></span>` +
            `<span class="fc-label">${label}</span>${calm ? '<span class="fc-best"><i></i>Calmest</span>' : ""}</button></li>`;
        }).join("");
        fc.hidden = false;
        $$("button", ol).forEach((b) => b.addEventListener("click", () => {
          $$("button", ol).forEach((x) => x.setAttribute("aria-pressed", "false"));
          b.setAttribute("aria-pressed", "true");
          if (dateIn) dateIn.value = b.dataset.day;
          const m = $('input[name="time"][value^="morning"]');
          if (m) m.checked = true;
        }));
        if (window.gsap && !reduce) gsap.from($$("li", ol), { y: 16, opacity: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" });
      })
      .catch(() => { clearTimeout(timer); });
  }

  /* ---------- book: the form writes the WhatsApp message ---------- */
  const form = $("#book-form");
  if (form) {
    const status = $("#form-status");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = new FormData(form);
      const name = String(f.get("name") || "").trim();
      const day = String(f.get("date") || "");
      if (!name || !day) {
        status.textContent = !name ? "Please add your name." : "Please pick a day.";
        (!name ? form.querySelector('[name="name"]') : dateIn).focus();
        return;
      }
      const dayText = new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const people = Math.max(1, Number(f.get("people")) || 1);
      const lines = [
        "Hi Aqua Media! I'd like to book a clear kayak drone photoshoot.",
        `Name: ${name}`,
        `Day: ${dayText}, ${f.get("time")}`,
        `Who: ${f.get("who")}, ${people} ${people === 1 ? "person" : "people"}`,
      ];
      if (f.get("occasion")) lines.push(`Occasion: ${f.get("occasion")}`);
      const notes = String(f.get("notes") || "").trim();
      if (notes) lines.push(`Notes: ${notes}`);
      status.textContent = "Opening WhatsApp with your message…";
      window.location.href = WA + encodeURIComponent(lines.join("\n"));
    });
  }

  /* ---------- gallery viewer ---------- */
  const dlg = $(".lightbox");
  if (dlg) {
    const items = $$(".g-item");
    const big = $(".lb-img", dlg);
    const count = $(".lb-count", dlg);
    let idx = 0;
    const show = (i) => {
      idx = (i + items.length) % items.length;
      const it = items[idx];
      big.src = it.dataset.full;
      big.alt = it.dataset.alt;
      count.textContent = `${idx + 1} of ${items.length}`;
    };
    items.forEach((it, i) => it.addEventListener("click", () => { show(i); dlg.showModal(); }));
    $(".lb-prev", dlg).addEventListener("click", () => show(idx - 1));
    $(".lb-next", dlg).addEventListener("click", () => show(idx + 1));
    $(".lb-close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    let x0 = null;
    big.addEventListener("pointerdown", (e) => { x0 = e.clientX; });
    big.addEventListener("pointerup", (e) => {
      if (x0 !== null && Math.abs(e.clientX - x0) > 40) show(idx + (e.clientX < x0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------- motion ---------- */
  const motion = () => {
    if (!window.gsap || reduce) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    const ST = !!window.ScrollTrigger;
    const rise = (targets, trigger, extra = {}) => {
      const els = typeof targets === "string" ? $$(targets) : targets;
      if (!els.length) return;
      gsap.from(els, Object.assign({ y: 28, opacity: 0, duration: 0.75, stagger: 0.08, ease: "power3.out" },
        ST ? { scrollTrigger: { trigger: trigger || els[0], start: "top 82%", once: true } } : {}, extra));
    };

    gsap.from($$(".top > *"), { y: -14, opacity: 0, duration: 0.6, stagger: 0.07, ease: "power2.out" });

    /* home: the drone rises over the first cover, the masthead sets in */
    const mast = $(".mast");
    if (mast) {
      let chars = [mast];
      if (window.SplitText) {
        try { chars = new SplitText(mast, { type: "chars", charsClass: "mc" }).chars; } catch (e) { chars = [mast]; }
      }
      const first = $(".cover-panel");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from($(".cover-photo img", first), { scale: 1.16, duration: 1.7, ease: "power2.out" }, 0)
        .from(chars, { yPercent: 70, opacity: 0, duration: 0.8, stagger: 0.04 }, 0.15)
        .from($$(".issue span", first), { y: 14, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.65)
        .from($(".flash", first), { scale: 0, rotate: -50, duration: 0.8, ease: "back.out(2.2)" }, 0.8)
        .from($$(".cover-lines > *", first), { y: 24, opacity: 0, duration: 0.7, stagger: 0.09 }, 0.75)
        .from($(".cover-cta", first), { y: 18, opacity: 0, duration: 0.6 }, 0.95);
      /* the drone hovers: a slow drift on every cover photo */
      gsap.to($$(".cover-photo img"), { scale: 1.04, duration: 7, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.8 });
      /* the next covers arrive whole: their masthead, then their lines */
      $$(".cover-panel").slice(1).forEach((p) => {
        rise([$(".mast", p), $(".issue", p)], p, { y: 40 });
        rise($$(".cover-lines > *, .cover-cta", p), p, { y: 34 });
        if (ST) gsap.from($(".cover-photo", p), { opacity: 0, duration: 0.9, ease: "power2.out", scrollTrigger: { trigger: p, start: "top 75%", once: true } });
      });
    }

    /* home: one verb at a time */
    $$(".verb-panel").forEach((p) => {
      if (ST) gsap.fromTo($(".verb-photo", p), { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: p, start: "top bottom", end: "bottom top", scrub: true } });
      rise([$(".verb", p)], p, { x: -60, y: 0, duration: 0.9 });
      rise([$(".verb-card", p)], p, { y: 40 });
    });

    /* home: builder, rating, the number */
    rise(".builder-copy h2, .builder-copy > p, .builder-form > *", ".builder");
    if ($("#mag")) rise([$("#mag")], ".builder", { y: 40, rotate: -2, duration: 0.9 });
    const count = $(".rating .count");
    if (count && ST) {
      const to = Number(count.dataset.to);
      const o = { v: 0 };
      gsap.to(o, { v: to, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: ".rating", start: "top 75%", once: true }, onUpdate: () => { count.textContent = o.v.toFixed(1); } });
    }
    rise(".rating-copy > *", ".rating");
    rise(".say-lead, .say-num span, .say-where, .say-links", ".say", { stagger: 0.1 });

    /* inner pages */
    rise(".page-head h1, .page-head .lead", ".page-head", { y: 36 });
    if ($(".head-photo")) gsap.from(".head-photo", { y: 60, opacity: 0, duration: 1, ease: "power3.out", delay: 0.2 });
    rise(".ticket", ".ticket-wrap", { y: 50, rotate: -1.5 });
    rise(".ticket-note", ".ticket-wrap");
    rise(".know h2, .know-item", ".know");
    rise(".wear-photo, .wear-copy h2, .ticks li", ".wear");
    rise(".faq h2, .faq details", ".faq", { stagger: 0.06 });
    if ($(".grid") && ST) ScrollTrigger.batch(".g-item", { start: "top 90%", once: true, onEnter: (b) => gsap.from(b, { y: 30, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" }) });
    rise(".cta-band > *", ".cta-band");
    rise(".book-form > *", ".book-form", { stagger: 0.04, y: 18 });
    rise(".meet > *", ".meet");
    rise(".foot-grid > *, .foot-small", ".foot", { y: 20 });
    if (ST) {
      window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
      if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
    }
  };
  motion();
})();
