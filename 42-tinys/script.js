// Sample #42 · Tiny's Restaurant & Cafe. "Your usual": save the plate you always get and the page
// offers it back next time (hero, card, WhatsApp text). Menu: the sticky plate follows the dish you
// are reading. GSAP adds the entrance, scroll moves and the rolling 4.4; without it the page is complete.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let DATA = {};
  try { DATA = JSON.parse($("#dish-data").textContent); } catch (e) { DATA = {}; }
  const dishes = DATA.dishes || {};
  const KEY = "tinys-usual";
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) { /* private mode */ } },
  };
  const enc = (t) => encodeURIComponent(t).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const wa = (t) => `https://wa.me/${DATA.phone}?text=${enc(t)}`;
  const usualText = (d) => `Hi Tiny's! My usual please: ${d.name}. What time can I pick it up?`;
  const sqSet = (k) => {
    const s = (DATA.sq || {})[k] || [600];
    return [`img/${k}-sq-600.webp ${s[0]}w`, s[1] ? `img/${k}-sq-1200.webp ${s[1]}w` : ""].filter(Boolean).join(", ");
  };
  const setImg = (img, k, alt) => {
    if (!img || !k) return;
    img.srcset = sqSet(k);
    img.src = `img/${k}-sq-600.webp`;
    if (alt !== undefined) img.alt = alt;
  };
  const live = document.createElement("p");
  live.className = "sr-only";
  live.setAttribute("aria-live", "polite");
  document.body.appendChild(live);

  /* ---------- your usual (home) ---------- */
  const heroImg = $("#hero-img");
  const heroLabel = $("#hero-label");
  const heroOrder = $("#hero-order");
  const heroDefault = heroImg ? {
    srcset: heroImg.getAttribute("srcset"), src: heroImg.getAttribute("src"), alt: heroImg.alt,
    label: heroLabel ? heroLabel.textContent : "", text: heroOrder ? heroOrder.textContent : "", href: heroOrder ? heroOrder.href : "",
  } : null;

  function renderUsual(animate) {
    const id = store.get();
    const d = id && dishes[id] && dishes[id].img ? dishes[id] : null;
    $$(".pick").forEach((p) => {
      const on = !!d && p.dataset.dish === id;
      p.classList.toggle("is-usual", on);
      p.setAttribute("aria-pressed", on ? "true" : "false");
    });
    $$(".star").forEach((b) => b.setAttribute("aria-pressed", d && b.dataset.dish === id ? "true" : "false"));
    const card = $("#usual-card");
    if (card) {
      card.hidden = !d;
      if (d) {
        setImg($("#usual-img"), d.img, d.alt);
        $("#usual-name").textContent = d.name;
        $("#usual-desc").textContent = d.desc;
        $("#usual-order").href = wa(usualText(d));
      }
    }
    if (heroImg && heroDefault) {
      if (d) {
        setImg(heroImg, d.img, d.alt);
        if (heroLabel) heroLabel.textContent = `Your usual: ${d.name}`;
        if (heroOrder) { heroOrder.textContent = "Order my usual"; heroOrder.href = wa(usualText(d)); }
      } else {
        heroImg.setAttribute("srcset", heroDefault.srcset);
        heroImg.src = heroDefault.src;
        heroImg.alt = heroDefault.alt;
        if (heroLabel) heroLabel.textContent = heroDefault.label;
        if (heroOrder) { heroOrder.textContent = heroDefault.text; heroOrder.href = heroDefault.href; }
      }
    }
    if (animate && d && card && window.gsap && !reduce) {
      gsap.fromTo("#usual-card .plate", { scale: 0.55, rotate: -50 }, { scale: 1, rotate: 0, duration: 0.7, ease: "back.out(1.5)" });
      gsap.fromTo("#usual-card .usual-text > *", { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: "power2.out" });
    }
  }

  $$(".pick").forEach((p) => {
    p.setAttribute("role", "button");
    p.addEventListener("click", (e) => {
      e.preventDefault();
      const id = p.dataset.dish;
      store.set(id);
      renderUsual(true);
      if (dishes[id]) live.textContent = `${dishes[id].name} is saved as your usual.`;
      const card = $("#usual-card");
      if (card) card.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    });
  });
  const change = $("#usual-change");
  if (change) change.addEventListener("click", () => {
    const first = $(".pick");
    $("#picks").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    if (first) first.focus({ preventScroll: true });
  });

  /* ---------- menu: stars and the plate that follows ---------- */
  $$(".star").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.dish;
    const now = store.get() === id ? null : id;
    store.set(now);
    renderUsual(false);
    live.textContent = now && dishes[now] ? `${dishes[now].name} is saved as your usual.` : "Your usual is cleared.";
  }));

  const plateA = $("#menu-a");
  const plateB = $("#menu-b");
  const menuLabel = $("#menu-label");
  let showing = "ackee";
  let front = plateA;
  let token = 0;
  if (plateA) plateA.classList.add("is-on");
  function showPlate(key, name) {
    if (!plateA || !plateB || !key || key === showing) return;
    showing = key;
    const my = ++token;
    const back = front === plateA ? plateB : plateA;
    setImg(back, key, "");
    // only the newest request may swap, so two quick changes never leave both pictures off
    const swap = () => {
      if (my !== token) return;
      back.classList.add("is-on");
      (back === plateA ? plateB : plateA).classList.remove("is-on");
      front = back;
    };
    if (back.decode) back.decode().then(swap, swap); else swap();
    if (menuLabel) menuLabel.textContent = name;
  }
  const rows = $$(".dish[data-img]");
  const setActive = (row) => {
    rows.forEach((r) => r.classList.toggle("is-active", r === row));
    const d = dishes[row.dataset.dish];
    if (d) showPlate(row.dataset.img, d.name);
  };
  if (rows.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    rows.forEach((r) => io.observe(r));
    rows.forEach((r) => {
      r.addEventListener("mouseenter", () => setActive(r));
      r.addEventListener("focusin", () => setActive(r));
    });
  }

  /* ---------- the stack: the longest dish name fits its column ---------- */
  const lines = $(".stack-lines");
  function fitLines() {
    if (!lines) return;
    const ls = $$(".l", lines);
    ls.forEach((l) => { l.style.fontSize = ""; });
    const base = parseFloat(getComputedStyle(ls[0]).fontSize);
    const widest = Math.max(...ls.map((l) => l.getBoundingClientRect().width));
    const room = lines.clientWidth * 0.94;
    if (!widest || !room) return;
    const size = Math.min(base * (room / widest), base * 1.25);
    ls.forEach((l) => { l.style.fontSize = size.toFixed(1) + "px"; });
  }
  if (lines) {
    fitLines();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitLines);
    if (document.fonts) document.fonts.addEventListener("loadingdone", fitLines);
    if ("ResizeObserver" in window) new ResizeObserver(fitLines).observe(lines);
  }

  renderUsual(false);

  /* ---------- motion ---------- */
  function motion() {
    if (!window.gsap || reduce) return;
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    const hero = $(".hero");
    if (hero) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".hero-plate .plate", { xPercent: 55, rotate: 150, duration: 1.25 }, 0)
        .from(".sticker", { scale: 0, rotate: -70, duration: 0.6, ease: "back.out(2)" }, 0.85)
        .from(".hero .plate-label", { y: 16, opacity: 0, duration: 0.45 }, 1.0);
      gsap.set(".hero-title", { autoAlpha: 0 });
      const fontsIn = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      Promise.race([fontsIn, new Promise((r) => setTimeout(r, 1200))]).then(() => {
        gsap.set(".hero-title", { autoAlpha: 1 });
        if (window.SplitText) {
          const split = new SplitText(".hero-title", { type: "lines", mask: "lines" });
          gsap.from(split.lines, { yPercent: 110, duration: 0.85, stagger: 0.09, ease: "power3.out" });
        } else {
          gsap.from(".hero-title", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" });
        }
      });
      tl.from(".hero-lead, .hero .actions > *", { y: 22, opacity: 0, duration: 0.6, stagger: 0.08 }, 0.5);
      gsap.to(".sticker", { rotate: -4, duration: 2.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.6 });
    }
    const head = $(".page-head");
    if (head) gsap.from($$(".page-head > *"), { y: 26, opacity: 0, duration: 0.7, stagger: 0.08, ease: "power3.out" });
    if (!window.ScrollTrigger) return;
    if (hero) gsap.to(".plate-hero .plate-img", { rotate: 55, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    const stack = $(".stack");
    if (stack) {
      $$(".stack .l").forEach((l, i) => gsap.fromTo(l, { x: i % 2 ? -12 : 12 }, { x: i % 2 ? 12 : -12, ease: "none", scrollTrigger: { trigger: stack, start: "top bottom", end: "bottom top", scrub: true } }));
      gsap.fromTo(".plate-stack .plate-img", { rotate: 0 }, { rotate: -120, ease: "none", scrollTrigger: { trigger: stack, start: "top bottom", end: "bottom top", scrub: true } });
    }
    $$(".roll").forEach((el) => {
      const to = parseFloat(el.dataset.to);
      const box = el.getBoundingClientRect();
      if (box.top < window.innerHeight) return;
      const o = { v: 0 };
      el.textContent = "0.0";
      gsap.to(o, { v: to, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%", once: true }, onUpdate: () => { el.textContent = o.v.toFixed(1); } });
    });
    // every section: its heading, then its text, then its pictures (in view at load: straight away)
    const groups = [
      ".usual-head > *", ".picks li", ".stack-facts > *", ".proof-text > *", ".visit-card > *",
      ".meal h2, .meal-when", ".dish", ".map-box", ".info-block > *", ".strip li", ".credit-list li", ".foot-text > *",
    ];
    groups.forEach((sel) => {
      $$(sel).forEach((el, i) => {
        const inView = el.getBoundingClientRect().top < window.innerHeight * 0.92;
        const vars = { y: 26, opacity: 0, duration: 0.6, ease: "power3.out", delay: inView ? 0.25 + (i % 6) * 0.07 : (i % 4) * 0.06 };
        if (!inView) vars.scrollTrigger = { trigger: el, start: "top 90%", once: true };
        gsap.from(el, vars);
      });
    });
    const band = $(".band-photo");
    if (band) gsap.fromTo(band, { scale: 1.12 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".visit-card-band", start: "top bottom", end: "bottom top", scrub: true } });
  }
  motion();
  window.addEventListener("load", () => { if (window.ScrollTrigger) ScrollTrigger.refresh(); }, { once: true });
})();
