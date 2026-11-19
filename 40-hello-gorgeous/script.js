/* Hello Gorgeous Makeup Artistry: sample site #40 */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = window.matchMedia("(max-width: 859px)");
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* 1. The giant name is sized in CSS from the measured width of her typeface.
        Here we only make sure the longest price line never runs past its row. */
  const poster = $(".poster");

  function fit() {
    if (!poster) return;
    root.style.removeProperty("--poster");
    if (phone.matches) return;
    const avail = poster.clientWidth;
    let worst = 1;
    $$("a", poster).forEach((a) => {
      const need = $(".p-name", a).offsetWidth + $(".p-fact", a).offsetWidth + 24;
      worst = Math.min(worst, avail / need);
    });
    if (worst < 1) {
      const size = parseFloat(getComputedStyle($(".p-name", poster)).fontSize);
      root.style.setProperty("--poster", (size * worst * 0.97).toFixed(1) + "px");
    }
  }

  /* 2. Menu on small screens */
  const toggle = $(".menu-toggle");
  const menu = $("#menu");
  if (toggle && menu) {
    const close = () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
    document.addEventListener("click", (e) => {
      if (menu.classList.contains("open") && !e.target.closest(".nav")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.classList.contains("open")) { close(); toggle.focus(); }
    });
  }

  /* 3. The mirror: soft, shimmer, the gorgeous way */
  const looks = $(".looks");
  const radios = $$('input[name="look"]');
  if (looks && radios.length) {
    const order = radios.map((r) => r.value);
    const setLook = (v) => {
      const r = radios.find((x) => x.value === v);
      if (!r) return;
      r.checked = true;
      looks.dataset.look = v;
    };
    radios.forEach((r) => r.addEventListener("change", () => { if (r.checked) looks.dataset.look = r.value; }));
    const checked = radios.find((r) => r.checked);
    if (checked) looks.dataset.look = checked.value;

    const mirror = $(".mirror", looks);
    let sx = null;
    let sy = 0;
    mirror.style.touchAction = "pan-y";
    mirror.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    mirror.addEventListener("pointercancel", () => { sx = null; });
    mirror.addEventListener("pointerup", (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dy) > 24 && Math.abs(dy) > Math.abs(dx)) return;
      const i = order.indexOf(looks.dataset.look);
      const step = Math.abs(dx) > 40 ? (dx < 0 ? 1 : -1) : 1;
      setLook(order[(i + step + order.length) % order.length]);
    });
  }

  /* 4. Bridal inquiry form (her five parts), sent to her email through FormSubmit */
  const form = $(".form");
  if (form) {
    const status = $(".form-status", form);
    const btn = $('button[type="submit"]', form);
    const date = $("#f-date", form);
    const pad = (n) => String(n).padStart(2, "0"); // taste-skill-ignore: date digits
    const setMin = () => {
      const d = new Date();
      date.min = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    };
    setMin();
    const words = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
    const sentText = "Inquiry sent. Jas will reply by email or WhatsApp.";
    const done = () => {
      form.reset();
      setMin();
      btn.textContent = "Inquiry sent";
      btn.disabled = true;
      status.classList.remove("error");
      status.textContent = sentText;
    };
    if (location.hash === "#sent") status.textContent = sentText;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      status.classList.remove("error");
      const bad = [];
      const fields = [["f-name", "your full name"], ["f-email", "a valid email"], ["f-phone", "your phone or WhatsApp number"], ["f-date", "your wedding date"], ["f-venue", "your venue or resort"], ["f-people", "how many people need makeup"]];
      fields.forEach(([id, label]) => {
        const el = document.getElementById(id);
        const ok = el.value.trim() !== "" && el.checkValidity();
        el.closest(".field").classList.toggle("invalid", !ok);
        if (ok) el.removeAttribute("aria-invalid");
        else { el.setAttribute("aria-invalid", "true"); bad.push([el, label]); }
      });
      const services = $("#g-services", form);
      const anyService = $$('input[name="Services"]', form).some((i) => i.checked);
      services.classList.toggle("invalid", !anyService);
      if (!anyService) bad.push([$('input[name="Services"]', form), "at least one service"]);
      const agree = $("#f-agree", form);
      $("#agree-label", form).classList.toggle("invalid", !agree.checked);
      if (!agree.checked) bad.push([agree, "a tick in the box at the end"]);
      if (bad.length) {
        status.classList.add("error");
        status.textContent = "Please add " + words(bad.map((b) => b[1])) + ".";
        bad[0][0].focus();
        return;
      }
      if (form.querySelector('[name="_honey"]').value) { done(); return; }

      btn.disabled = true;
      btn.textContent = "Sending";
      const data = {};
      for (const [k, v] of new FormData(form).entries()) {
        if (k === "_next" || k === "_honey") continue;
        data[k] = k in data ? data[k] + ", " + v : v;
      }
      try {
        const res = await fetch("https://formsubmit.co/ajax/hellogorgeoustci@gmail.com", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        const out = await res.json().catch(() => ({}));
        if (!res.ok || String(out.success) === "false") throw new Error(out.message || String(res.status));
        done();
      } catch (err) {
        btn.disabled = false;
        btn.textContent = "Send inquiry";
        status.classList.add("error");
        status.textContent = /activat/i.test(String(err && err.message))
          ? "This form is waiting for a one-time confirmation from Jas. Please message her on WhatsApp for now."
          : "Your inquiry could not be sent. Please try again, or message Jas on WhatsApp.";
      }
    });
  }

  /* 5. Her work: drag the strip with a mouse, arrows from the keyboard */
  const strip = $(".strip");
  if (strip) {
    let down = false;
    let moved = false;
    let startX = 0;
    let startL = 0;
    strip.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startL = strip.scrollLeft;
    });
    window.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 4) { moved = true; strip.classList.add("dragging"); }
      strip.scrollLeft = startL - dx;
    });
    window.addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      strip.classList.remove("dragging");
    });
    strip.addEventListener("click", (e) => {
      if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
    }, true);
    strip.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      strip.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * strip.clientWidth * 0.6, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* 6. Gallery: a simple photo viewer */
  const dlg = $(".lightbox");
  const items = $$(".g-item");
  if (dlg && items.length && typeof dlg.showModal === "function") {
    const img = $(".lb-img", dlg);
    const count = $(".lb-count", dlg);
    let at = 0;
    const show = (n) => {
      at = (n + items.length) % items.length;
      const a = items[at];
      img.src = a.dataset.full;
      img.alt = $("img", a).alt;
      count.textContent = at + 1 + " of " + items.length;
      dlg.classList.toggle("lb-blush", a.dataset.bg === "blush");
    };
    items.forEach((a, n) => a.addEventListener("click", (e) => { e.preventDefault(); show(n); dlg.showModal(); }));
    $(".lb-prev", dlg).addEventListener("click", () => show(at - 1));
    $(".lb-next", dlg).addEventListener("click", () => show(at + 1));
    $(".lb-close", dlg).addEventListener("click", () => dlg.close());
    dlg.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") show(at + 1);
      if (e.key === "ArrowLeft") show(at - 1);
    });
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    let px = null;
    dlg.addEventListener("pointerdown", (e) => { px = e.clientX; });
    dlg.addEventListener("pointerup", (e) => {
      if (px === null) return;
      const dx = e.clientX - px;
      px = null;
      if (Math.abs(dx) > 50) show(at + (dx < 0 ? 1 : -1));
    });
    dlg.addEventListener("close", () => items[at].focus());
  }

  /* 7. Motion */
  function motion() {
    const g = window.gsap;
    const ST = window.ScrollTrigger;
    if (!g || !ST) { root.classList.add("anim-off"); return; }
    g.registerPlugin(ST);
    if (reduce) { root.classList.add("anim-ready"); return; }
    const late = root.classList.contains("anim-off");
    const hero = $(".hero");

    if (!late) {
      if (hero) {
        const tl = g.timeline({ defaults: { ease: "power3.out" } });
        tl.set(".hero-copy", { opacity: 1 }, 0)
          .fromTo(".hero-frame", { opacity: 0, clipPath: "inset(100% 0% 0% 0%)" }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "power4.inOut" }, 0)
          .fromTo(".hero-photo", { scale: 1.12 }, { scale: 1, duration: 1.6, ease: "power2.out" }, 0.2)
          .fromTo(".m-line", { opacity: 0, yPercent: 45 }, { opacity: 1, yPercent: 0, duration: 1, stagger: 0.12 }, 0.35)
          .fromTo(".hero-copy > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 }, 0.7);
      }
      const head = $(".page-head");
      if (head) g.fromTo(head.children, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" });

      const ins = g.utils.toArray("[data-in]");
      g.set(ins, { opacity: 0, y: 26 });
      ST.batch(ins, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: "power3.out", overwrite: true, clearProps: "transform" }),
      });
      if ($(".work")) {
        g.from(".frame", {
          x: 60, opacity: 0, duration: 0.9, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity",
          scrollTrigger: { trigger: ".work", start: "top 72%", once: true },
        });
      }
      const tiles = g.utils.toArray(".g-grid li");
      if (tiles.length) {
        g.set(tiles, { opacity: 0, y: 30 });
        ST.batch(tiles, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "power3.out", clearProps: "transform" }),
        });
      }
    }
    root.classList.add("anim-ready");

    /* The signature move: the name settles as the first screen leaves, and grows back in the footer */
    if (hero) {
      g.to(".monument", { scale: 0.94, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
      /* The moving picture: the cover photo breathes in its frame */
      g.to(".hero-photo", { scale: 1.05, duration: 7, ease: "sine.inOut", yoyo: true, repeat: -1, delay: late ? 0 : 1.8 });
    }
    const foot = $(".foot");
    if (foot) g.fromTo(".foot-mark", { scale: 0.94 }, { scale: 1, ease: "none", scrollTrigger: { trigger: foot, start: "top bottom", end: "bottom bottom", scrub: true } });

    /* The step photographs drift behind their verbs */
    g.utils.toArray(".step-img").forEach((im) => {
      g.fromTo(im, { scale: 1.1, yPercent: -3 }, {
        scale: 1.02, yPercent: 3, ease: "none",
        scrollTrigger: { trigger: im.parentElement, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  fit();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fit();
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });
  }
  let raf = 0;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(fit);
  });
  motion();
})();
