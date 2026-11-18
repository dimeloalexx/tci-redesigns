// Chef Romane: the greeting in the six languages Chef Romane speaks, the WhatsApp message written in the one the
// visitor picks, the seven menus as tabs, the evening that lights up as you scroll, and the motion layer (GSAP 3.15).
// Without the script every menu shows, every row of the evening shows and the buttons open WhatsApp in English.
(() => {
  const PHONE = "16493475343";
  const LANGS = {
    en: { name: "English", greet: "Dinner is served.", hi: "Hi Chef Romane! I found your website and I'd like to book you.",
          menu: m => `Hi Chef Romane! I found your website and I'd like to book the ${m} menu.`, date: "Date", guests: "Guests", where: "Villa or area" },
    es: { name: "Español", greet: "La cena está servida.", hi: "¡Hola, Chef Romane! Vi su página web y me gustaría reservar con usted.",
          menu: m => `¡Hola, Chef Romane! Vi su página web y me gustaría reservar el menú ${m}.`, date: "Fecha", guests: "Invitados", where: "Villa o zona" },
    fr: { name: "Français", greet: "Le dîner est servi.", hi: "Bonjour Chef Romane ! J'ai vu votre site et j'aimerais réserver vos services.",
          menu: m => `Bonjour Chef Romane ! J'ai vu votre site et j'aimerais réserver le menu ${m}.`, date: "Date", guests: "Invités", where: "Villa ou quartier" },
    de: { name: "Deutsch", greet: "Das Abendessen ist serviert.", hi: "Hallo Chef Romane! Ich habe Ihre Website gesehen und möchte Sie gerne buchen.",
          menu: m => `Hallo Chef Romane! Ich habe Ihre Website gesehen und möchte gerne das Menü ${m} buchen.`, date: "Datum", guests: "Gäste", where: "Villa oder Gegend" },
    pt: { name: "Português", greet: "O jantar está servido.", hi: "Olá, Chef Romane! Vi o seu site e gostaria de reservar os seus serviços.",
          menu: m => `Olá, Chef Romane! Vi o seu site e gostaria de reservar o menu ${m}.`, date: "Data", guests: "Convidados", where: "Villa ou zona" },
    it: { name: "Italiano", greet: "La cena è servita.", hi: "Ciao Chef Romane! Ho visto il tuo sito e vorrei prenotarti.",
          menu: m => `Ciao Chef Romane! Ho visto il tuo sito e vorrei prenotare il menù ${m}.`, date: "Data", guests: "Ospiti", where: "Villa o zona" },
  };
  const ORDER = ["en", "es", "fr", "de", "pt", "it"];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const motion = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined" && !reduce;

  /* ---------- The language and the WhatsApp message ---------- */
  let lang = "en";
  let chosen = false;
  try {
    const saved = localStorage.getItem("romane-lang");
    if (saved && LANGS[saved]) { lang = saved; chosen = true; }
  } catch (e) { /* private window: stay in English */ }

  const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const message = menu => {
    const L = LANGS[lang];
    const colon = lang === "fr" ? " :" : ":";
    return [menu ? L.menu(menu) : L.hi, "", `${L.date}${colon} `, `${L.guests}${colon} `, `${L.where}${colon} `].join("\n");
  };
  function paint() {
    document.querySelectorAll("[data-wa]").forEach(a => { a.href = `https://wa.me/${PHONE}?text=${enc(message(a.dataset.menu))}`; });
    document.querySelectorAll("[data-lang-name]").forEach(el => { el.textContent = LANGS[lang].name; });
    document.querySelectorAll(".chip[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  const greet = document.querySelector(".greet-line");
  let shown = "en";
  function showGreeting(code, animate) {
    if (!greet || code === shown) return;
    const swap = () => { greet.textContent = LANGS[code].greet; greet.lang = code; shown = code; };
    if (!animate || !motion) { swap(); return; }
    gsap.killTweensOf(greet);
    gsap.to(greet, {
      yPercent: -100, autoAlpha: 0, duration: 0.32, ease: "power2.in",
      onComplete: () => {
        swap();
        gsap.fromTo(greet, { yPercent: 100, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: "power3.out" });
      },
    });
  }
  let cycle = null;
  function startCycle() {
    if (!motion || chosen || cycle) return;
    let i = 0;
    cycle = setInterval(() => {
      if (document.hidden) return;
      i = (i + 1) % ORDER.length;
      showGreeting(ORDER[i], true);
    }, 2800);
  }

  document.querySelectorAll(".chip[data-lang]").forEach(b => b.addEventListener("click", () => {
    lang = b.dataset.lang;
    chosen = true;
    if (cycle) { clearInterval(cycle); cycle = null; }
    try { localStorage.setItem("romane-lang", lang); } catch (e) { /* not kept, still works */ }
    paint();
    showGreeting(lang, true);
  }));
  paint();
  if (chosen) showGreeting(lang, false);

  /* ---------- The seven menus as tabs ---------- */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(t => document.getElementById(t.getAttribute("aria-controls")));
  const menuCard = document.getElementById("menu-card");
  const narrow = window.matchMedia("(max-width: 1099px)");
  function select(i, opts = {}) {
    tabs.forEach((t, j) => {
      const on = j === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[j].hidden = !on;
    });
    if (opts.focus) tabs[i].focus();
    if (opts.animate && motion) {
      gsap.fromTo(panels[i], { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" });
    }
    if (opts.scroll && narrow.matches && menuCard) {
      const top = menuCard.getBoundingClientRect().top;
      if (top > window.innerHeight * 0.55 || top < 0) menuCard.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(i, { animate: true, scroll: true }));
    t.addEventListener("keydown", e => {
      let j = null;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") j = (i + 1) % tabs.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") j = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = tabs.length - 1;
      if (j === null) return;
      e.preventDefault();
      select(j, { focus: true, animate: true });
    });
  });
  if (tabs.length && panels.every(Boolean)) select(0);

  /* ---------- The booking stub: on after the menu card, off over the booking card and the footer ---------- */
  const stub = document.querySelector(".stub");
  const heroCard = document.querySelector(".card");
  if (stub && heroCard && "IntersectionObserver" in window) {
    let past = false;
    const covering = new Set();
    const set = () => stub.classList.toggle("is-on", past && covering.size === 0);
    new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe(heroCard);
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) covering.add(e.target); else covering.delete(e.target); });
      set();
    }, { threshold: 0.2 });
    document.querySelectorAll(".book, .visit, .back").forEach(el => io.observe(el));
  }

  /* ---------- The evening ---------- */
  const night = document.querySelector(".night");
  const rows = night ? [...night.querySelectorAll(".rows li")] : [];
  const photos = night ? [...night.querySelectorAll(".np")] : [];
  const showStep = s => photos.forEach(p => p.classList.toggle("is-on", +p.dataset.step === s));
  const light = p => {
    const lit = Math.min(rows.length, 1 + Math.floor(p * rows.length));
    rows.forEach((r, i) => r.classList.toggle("is-lit", i < lit));
    showStep(lit ? +rows[lit - 1].dataset.step : 0);
  };

  /* ---------- Rolling numbers ---------- */
  function count(el) {
    const to = parseFloat(el.dataset.count);
    const dec = +(el.dataset.dec || 0);
    if (!motion || Number.isNaN(to)) return;
    const o = { v: 0 };
    gsap.fromTo(o, { v: 0 }, {
      v: to, duration: 1.6, ease: "power2.out", immediateRender: false,
      onStart: () => { el.textContent = (0).toFixed(dec); },
      onUpdate: () => { el.textContent = o.v.toFixed(dec); },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  }

  if (!motion) return;

  /* ---------- Motion ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  document.documentElement.classList.add("js-motion");

  // On load: the card is set down, the name rises letter by letter, the plates are served from both sides.
  const h1 = document.getElementById("hero-title");
  const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
  tl.from(".card", { y: 46, autoAlpha: 0, duration: 0.9 });
  if (window.SplitText && h1) {
    const split = SplitText.create(h1, { type: "chars" });
    tl.from(split.chars, { y: 34, autoAlpha: 0, duration: 0.6, stagger: 0.035 }, "-=0.5");
  }
  tl.from(".plate", {
    x: (i, el) => (el.dataset.from === "left" ? -1 : 1) * Math.min(window.innerWidth * 0.35, 520),
    y: 30, rotation: (i, el) => (el.dataset.from === "left" ? -16 : 16), autoAlpha: 0,
    duration: 1.1, stagger: 0.12, ease: "power4.out",
  }, "-=0.7");
  tl.from(".card .greet, .card .facts li, .card .lede, .card .langs, .card-stub > *", {
    y: 16, autoAlpha: 0, duration: 0.6, stagger: 0.07,
  }, "-=1");
  tl.add(startCycle, "+=0.8");

  const mm = gsap.matchMedia();

  // Leaving the hero on a wide screen, the plates drift apart and the card settles.
  mm.add("(min-width: 1100px)", () => {
    gsap.to(".plate", {
      yPercent: i => [-24, 18, -18, 26][i] || 0, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
    gsap.to(".card", { scale: 0.95, yPercent: 4, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  });

  // The evening: pinned on a tall wide screen, lighting row by row; elsewhere each row lights as it arrives.
  if (night) {
    mm.add("(min-width: 1100px) and (min-height: 800px)", () => {
      night.classList.add("is-story");
      light(0);
      ScrollTrigger.create({
        trigger: night, start: "center center", end: () => "+=" + Math.round(window.innerHeight * 1.3),
        pin: true, scrub: true, onUpdate: s => light(s.progress), onLeave: () => light(1),
      });
      return () => { night.classList.remove("is-story"); rows.forEach(r => r.classList.remove("is-lit")); showStep(0); };
    });
    mm.add("(max-width: 1099px), (max-height: 799px)", () => {
      night.classList.add("is-story");
      rows.forEach(r => ScrollTrigger.create({
        trigger: r, start: "top 80%", once: true,
        onEnter: () => { r.classList.add("is-lit"); showStep(+r.dataset.step); },
      }));
      return () => night.classList.remove("is-story");
    });
  }

  // Headings rise line by line; the parts of each section follow.
  if (window.SplitText) {
    document.querySelectorAll("[data-split]").forEach(el => {
      SplitText.create(el, {
        type: "lines", autoSplit: true,
        onSplit: self => gsap.from(self.lines, {
          y: 40, autoAlpha: 0, duration: 0.8, stagger: 0.1, ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        }),
      });
    });
  }
  gsap.utils.toArray("[data-rise]").forEach(el => {
    gsap.from(el, { y: 28, autoAlpha: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  // The menus: the giant word, the bars one after another, the card tipped onto the table.
  gsap.from(".giant", { yPercent: 18, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: ".menus", start: "top 75%", once: true } });
  gsap.from(".tabs [role='tab']", { x: -26, autoAlpha: 0, duration: 0.5, stagger: 0.06, scrollTrigger: { trigger: ".tabs", start: "top 85%", once: true } });
  gsap.from(".menu-card", { y: 50, rotation: -2, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: ".menu-card", start: "top 85%", once: true } });

  // The letter: the promise is marked as you read it.
  const letter = document.querySelector(".letter");
  if (letter) ScrollTrigger.create({ trigger: letter, start: "top 60%", once: true, onEnter: () => letter.classList.add("is-in") });

  // The guest book: the entries arrive one by one, the numbers roll.
  gsap.from(".entry", { y: 26, autoAlpha: 0, duration: 0.7, stagger: 0.14, scrollTrigger: { trigger: ".book-page", start: "top 80%", once: true } });
  document.querySelectorAll("[data-count]").forEach(count);

  // The booking card is dealt onto the photo.
  gsap.from(".visit-card", { rotation: 2.5, y: 60, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".visit", start: "top 70%", once: true } });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
