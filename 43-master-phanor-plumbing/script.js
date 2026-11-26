// Sample #43 · Master Phanor Kensly Plumbing. The live thing is a water meter: pick a leak and its
// little star spins while the odometer counts what it wastes (US EPA figures; one second here is
// one hour at home). Leak help has a 10-minute toilet colour test; Contact writes the WhatsApp
// message. GSAP adds the entrances and the sea picture that opens; without it the pages are complete.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PHONE = "16493459524";
  const enc = (t) => encodeURIComponent(t).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const wa = (t) => `https://wa.me/${PHONE}?text=${enc(t)}`;
  const live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);
  const say = (t) => { live.textContent = ""; setTimeout(() => { live.textContent = t; }, 60); };

  // The big titles (.fit-lines) are sized in CSS with container units, so they never depend on when the font arrives.

  /* ---------- the meter ---------- */
  const dial = $("#meter-dial");
  if (dial) {
    const reels = $$(".reel", dial);
    const hand = $(".m-hand", dial);
    const star = $(".m-star", dial);
    const result = $("#leak-result");
    const waBtn = $("#leak-wa");
    const STEP = 42;
    const COPY = {
      tap: ["About 8 gallons a day, 250 a month and more than 3,000 a year. That is enough water for 180 showers.", "a tap dripping once a second"],
      shower: ["About 1.4 gallons a day, 40 a month and more than 500 a year. That is enough water for 30 showers.", "a showerhead that keeps dripping"],
      home: ["About 25 gallons a day, 770 a month and more than 9,300 a year. That is enough water for 550 showers.", "a leak somewhere in the house"],
      big: ["50 gallons a day or more: 1,500 a month and 18,000 a year. Nine homes in every hundred have a leak this big.", "a big hidden leak"],
    };
    let rate = 0;
    let gallons = 0;
    let starDeg = 0;
    let last = 0;
    let running = false;
    let raf = 0;
    const shown = new Array(reels.length).fill(0);

    function setReel(i, digit, smooth) {
      const reel = reels[i];
      if (!smooth) {
        reel.style.transition = "none";
        reel.style.transform = `translateY(${-digit * STEP}px)`;
        void reel.getBoundingClientRect();
        reel.style.transition = "";
        shown[i] = digit;
        return;
      }
      if (digit === shown[i]) return;
      if (digit === 0 && shown[i] === 9) {
        reel.style.transform = `translateY(${-10 * STEP}px)`;
        const back = () => { reel.removeEventListener("transitionend", back); setReel(i, 0, false); };
        reel.addEventListener("transitionend", back);
        shown[i] = 0;
        return;
      }
      reel.style.transform = `translateY(${-digit * STEP}px)`;
      shown[i] = digit;
    }
    function drawOdo(g) {
      const whole = Math.floor(g);
      const n = reels.length;
      for (let i = 0; i < n - 1; i++) {
        const digit = Math.floor(whole / Math.pow(10, n - 1 - i)) % 10;
        setReel(i, digit, true);
      }
      // the last reel rolls continuously, like a real odometer
      const lastReel = reels[n - 1];
      lastReel.style.transition = "none";
      lastReel.style.transform = `translateY(${-(g % 10) * STEP}px)`;
    }
    function drawHands() {
      hand.style.transform = `rotate(${((gallons % 10) / 10) * 360}deg)`;
      star.style.transform = `rotate(${starDeg}deg)`;
    }
    function frame(t) {
      if (!running) return;
      const dt = last ? Math.min((t - last) / 1000, 0.1) : 0;
      last = t;
      gallons += rate * dt;
      if (gallons >= 999999) gallons = 0;
      starDeg = (starDeg + Math.min((rate / 0.25) * 360, 1440) * dt) % 360;
      drawOdo(gallons);
      drawHands();
      raf = requestAnimationFrame(frame);
    }
    function pick(input, announce) {
      const day = parseFloat(input.dataset.day) || 0;
      rate = day / 24;
      const copy = COPY[input.value];
      if (copy) {
        result.textContent = copy[0];
        waBtn.href = wa(`Hi! I think I have a leak: ${copy[1]}. Can you come and fix it?`);
      }
      gallons = 0;
      reels.forEach((_, i) => setReel(i, 0, false));
      if (reduce) {
        // no spinning: the odometer shows what the leak wastes in a year
        const year = Math.round(day * 365);
        reels.forEach((_, i) => setReel(i, Math.floor(year / Math.pow(10, reels.length - 1 - i)) % 10, false));
        hand.style.transform = "rotate(0deg)";
      }
      if (announce) say(copy ? copy[0] : "");
    }
    $$('input[name="leak"]').forEach((r) => r.addEventListener("change", () => pick(r, false)));
    const checked = $('input[name="leak"]:checked');
    if (checked) pick(checked, false);
    if (!reduce) {
      const start = () => { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } };
      const stop = () => { running = false; cancelAnimationFrame(raf); };
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? start() : stop())), { threshold: 0.15 }).observe(dial);
      } else start();
      document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (dial.getBoundingClientRect().top < innerHeight) start(); });
    }
  }

  /* ---------- the toilet colour test: 10 minutes ---------- */
  const timer = $("#timer");
  if (timer) {
    const TOTAL = 600;
    const C = 326.73;
    const KEY = "mpk-dye-test-end";
    const fill = $("#timer-fill");
    const time = $("#timer-time");
    const startBtn = $("#timer-start");
    const resetBtn = $("#timer-reset");
    const done = $("#timer-done");
    let endAt = 0;
    let iv = 0;
    const store = {
      get() { try { return parseInt(localStorage.getItem(KEY) || "0", 10); } catch (e) { return 0; } },
      set(v) { try { if (v) localStorage.setItem(KEY, String(v)); else localStorage.removeItem(KEY); } catch (e) { /* private mode */ } },
    };
    function show(sec) {
      const s = Math.max(0, Math.ceil(sec));
      time.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; // taste-skill-ignore: a clock
      fill.style.strokeDashoffset = (C * (1 - s / TOTAL)).toFixed(2);
    }
    function tick() {
      const left = (endAt - Date.now()) / 1000;
      show(left);
      if (left <= 0) finish();
    }
    function finish() {
      clearInterval(iv);
      store.set(0);
      done.hidden = false;
      say("Time is up. Look in the toilet bowl now: colour in the water means the toilet leaks.");
      if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
    function run(end) {
      endAt = end;
      store.set(end);
      startBtn.hidden = true;
      resetBtn.hidden = false;
      done.hidden = true;
      clearInterval(iv);
      tick();
      iv = setInterval(tick, 250);
    }
    startBtn.addEventListener("click", () => { run(Date.now() + TOTAL * 1000); say("Timer started: 10 minutes. Do not flush."); });
    resetBtn.addEventListener("click", () => { run(Date.now() + TOTAL * 1000); say("Timer started again: 10 minutes."); });
    const saved = store.get();
    if (saved && saved > Date.now()) run(saved);
    else show(TOTAL);
  }

  /* ---------- contact: the form writes the WhatsApp message ---------- */
  const form = $("#ask-form");
  if (form) {
    const err = $("#form-error");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const el = form.elements;
      const name = el.namedItem("name").value.trim();
      if (!name) {
        err.hidden = false;
        el.namedItem("name").focus();
        return;
      }
      err.hidden = true;
      const area = el.namedItem("area").value.trim();
      const job = el.namedItem("job").value;
      const now = (form.querySelector('input[name="now"]:checked') || {}).value === "yes";
      const when = el.namedItem("when").value.trim();
      const more = el.namedItem("more").value.trim();
      const lines = [`Hi! My name is ${name}.`];
      if (now) lines.push("Water is leaking right now.");
      lines.push(`I need help with: ${job}.`);
      if (area) lines.push(`I'm in ${area}.`);
      if (when) lines.push(`You can come ${when}.`);
      if (more) lines.push(more);
      lines.push("I'll send a photo of the problem here.");
      window.location.href = wa(lines.join("\n"));
    });
  }

  /* ---------- motion ---------- */
  function motion() {
    if (!window.gsap || reduce) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    const inView = (el) => el.getBoundingClientRect().top < window.innerHeight * 0.92;
    const fontsIn = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const fontsOrTimeout = Promise.race([fontsIn, new Promise((r) => setTimeout(r, 1200))]);

    // home: the tagline rises line by line, the badge rolls into its place like a coin
    const hero = $(".hero");
    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-title .ln-in", { yPercent: 108, duration: 0.95, stagger: 0.12 }, 0.05)
        .from(".hero-badge", { scale: 0.2, rotate: -320, xPercent: -140, duration: 1.15, ease: "back.out(1.4)" }, 0.25)
        .from(".hero-lead, .hero .actions > *, .hero-hours", { y: 22, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.55)
        .fromTo(".hero-photo", { clipPath: "inset(0% 0% 99% 0%)", scale: 1.14 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, duration: 1.3, ease: "power4.out" }, 0.35);
    }
    // inner pages: the big title rises out of its own line
    $$(".page-title, .call-title").forEach((t) => {
      if (t.classList.contains("fit-lines")) {
        gsap.from($$(".ln-in", t), { yPercent: 108, duration: 0.9, stagger: 0.1, ease: "power3.out", delay: 0.05 });
        return;
      }
      gsap.set(t, { autoAlpha: 0 });
      fontsOrTimeout.then(() => {
        gsap.set(t, { autoAlpha: 1 });
        if (window.SplitText) {
          const split = new SplitText(t, { type: "lines", mask: "lines" });
          gsap.from(split.lines, { yPercent: 110, duration: 0.85, stagger: 0.09, ease: "power3.out" });
        } else {
          gsap.from(t, { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" });
        }
      });
    });
    if (!window.ScrollTrigger) return;

    // each service sentence: the text rises, then its picture fills its slot
    $$(".fix").forEach((row, i) => {
      const slotEl = $(".slot", row);
      const now = inView(row);
      const tl = gsap.timeline(now ? { delay: 0.3 + i * 0.07 } : { scrollTrigger: { trigger: row, start: "top 88%", once: true } });
      tl.from($(".fix-line", row), { y: 30, opacity: 0, duration: 0.65, ease: "power3.out" })
        .from(slotEl, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.7, ease: "power3.inOut" }, 0.15)
        .from($(".fix-note", row), { y: 12, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.3);
    });

    // the sea: the pill of sea in the sentence opens below it until the picture fills the screen
    const sea = $(".sea");
    if (sea) {
      sea.classList.add("is-pinned");
      const stage = $(".sea-stage", sea);
      const full = $(".sea-full", sea);
      const text = $(".sea-text", sea);
      const pill = () => (window.innerWidth < 900 ? "inset(41% 10% 41% 10% round 400px)" : "inset(36% 27% 36% 27% round 400px)");
      gsap.from(".sea-title .ln-in", { yPercent: 108, duration: 0.9, stagger: 0.1, ease: "power3.out", scrollTrigger: { trigger: ".sea-title", start: "top 85%", once: true } });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: stage, start: "top top", end: "+=110%", pin: true, scrub: 0.6, invalidateOnRefresh: true },
      });
      tl.fromTo(full, { clipPath: () => pill() }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 }, 0)
        .fromTo($(".sea-photo", sea), { scale: 1.2 }, { scale: 1, ease: "none", duration: 1 }, 0)
        .fromTo(text, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" }, 0.66);
    }

    // the meter arrives, then starts counting
    const dialEl = $("#meter-dial");
    if (dialEl) {
      gsap.from(dialEl, { scale: 0.82, rotate: -24, opacity: 0, duration: 1.1, ease: "back.out(1.3)", scrollTrigger: { trigger: dialEl, start: "top 85%", once: true } });
    }
    const stars = $$(".r-star");
    if (stars.length) {
      gsap.from(stars, { scale: 0, rotate: -90, transformOrigin: "50% 50%", duration: 0.6, stagger: 0.09, ease: "back.out(2)", scrollTrigger: { trigger: ".star-row", start: "top 88%", once: true } });
    }
    $$(".last-photo, .band img").forEach((p) => {
      gsap.fromTo(p, { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: p.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".svc-photo img").forEach((p) => {
      gsap.fromTo(p, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: p.closest(".svc"), start: "top bottom", end: "bottom top", scrub: true } });
    });

    // every section: its heading, then its text, then its pictures
    const groups = [
      ".fixes .sec-title", ".fixes > .btn", ".meter-head > *", ".meter-pick > *", ".stars h2", ".stars > p", ".stars .actions",
      ".last-card > *", ".page-hero > p", ".page-hero > .actions", ".page-hero-copy > p", ".page-hero-copy > .actions", ".page-hero-photo",
      ".svc-index a", ".svc-text > *", ".first h2", ".steps li", ".hunt-head > *", ".test > *", ".checks li",
      ".call-hero .lead", ".ask-form > *", ".ask-side > *", ".credit-list li", ".credits > p", ".foot > *",
    ];
    groups.forEach((sel) => {
      $$(sel).forEach((el, i) => {
        const now = inView(el);
        const vars = { y: 26, opacity: 0, duration: 0.6, ease: "power3.out", delay: now ? 0.3 + (i % 6) * 0.07 : (i % 4) * 0.06 };
        if (!now) vars.scrollTrigger = { trigger: el, start: "top 90%", once: true };
        gsap.from(el, vars);
      });
    });
  }
  motion();
  window.addEventListener("load", () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, { once: true });
})();
