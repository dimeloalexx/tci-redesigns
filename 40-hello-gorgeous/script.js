/* Hello Gorgeous Makeup Artistry: sample site #40 */
(() => {
  "use strict";
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = window.matchMedia("(max-width: 859px)");
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* 1. The name, fitted to its space (hero, poster list and footer) */
  const monument = $(".monument");
  const foot = $(".foot");
  const footMark = $(".foot-mark");
  const poster = $(".poster");

  const widest = (els) => Math.max(...els.map((el) => el.offsetWidth));
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  function fit() {
    const vw = root.clientWidth;
    const m = clamp(vw * 0.022, 20, 32);

    if (monument) {
      root.style.setProperty("--mono", "100px");
      let w;
      let target;
      if (phone.matches) {
        w = widest($$(".m-line", monument));
        target = vw - 32;
      } else {
        w = monument.offsetWidth;
        target = vw * 0.63 - m - 20;
      }
      const size = w ? clamp((100 * target) / w, 56, 260) : 120;
      root.style.setProperty("--mono", size.toFixed(1) + "px");

      root.style.removeProperty("--poster");
      if (poster && !phone.matches) {
        const avail = poster.clientWidth;
        let worst = 1;
        $$("a", poster).forEach((a) => {
          const need = $(".p-name", a).offsetWidth + $(".p-fact", a).offsetWidth + 24;
          worst = Math.min(worst, avail / need);
        });
        if (worst < 1) root.style.setProperty("--poster", (size * worst * 0.97).toFixed(1) + "px");
      }
    }

    if (foot && footMark) {
      foot.style.setProperty("--foot", "100px");
      const lines = $$(".fm-line", footMark);
      const w = phone.matches ? widest(lines) : footMark.offsetWidth;
      const target = phone.matches ? vw - 40 : vw - 2 * m;
      if (w) foot.style.setProperty("--foot", clamp((100 * target) / w, 48, 420).toFixed(1) + "px");
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

  /* 6. Motion */
  function motion() {
    const g = window.gsap;
    const ST = window.ScrollTrigger;
    if (!g || !ST) { root.classList.add("anim-off"); return; }
    g.registerPlugin(ST);
    if (reduce) { root.classList.add("anim-ready"); return; }
    const late = root.classList.contains("anim-off");

    if (!late) {
      const tl = g.timeline({ defaults: { ease: "power3.out" } });
      tl.set(".hero-copy", { opacity: 1 }, 0)
        .fromTo(".hero-frame", { opacity: 0, clipPath: "inset(100% 0% 0% 0%)" }, { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", duration: 1.15, ease: "power4.inOut" }, 0)
        .fromTo(".hero-ring", { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 1.3 }, 0.45)
        .fromTo(".hero-bride", { opacity: 0, yPercent: 6 }, { opacity: 1, yPercent: 0, duration: 1.2 }, 0.5)
        .fromTo(".m-line", { opacity: 0, yPercent: 45 }, { opacity: 1, yPercent: 0, duration: 1, stagger: 0.12 }, 0.35)
        .fromTo(".hero-copy > *", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.09 }, 0.7);

      const ins = g.utils.toArray("[data-in]");
      g.set(ins, { opacity: 0, y: 26 });
      ST.batch(ins, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => g.to(batch, { opacity: 1, y: 0, duration: 0.85, stagger: 0.08, ease: "power3.out", overwrite: true, clearProps: "transform" }),
      });
      g.from(".frame", {
        x: 60, opacity: 0, duration: 0.9, stagger: 0.05, ease: "power3.out", clearProps: "transform,opacity",
        scrollTrigger: { trigger: ".work", start: "top 72%", once: true },
      });
    }
    root.classList.add("anim-ready");

    /* The signature move: the name settles as the first screen leaves, and grows back in the footer */
    g.to(".monument", { scale: 0.94, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.fromTo(".foot-mark", { scale: 0.94 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });

    /* The moving picture: the bride breathes in her frame */
    g.to(".hero-bride", { yPercent: -1.4, scale: 1.015, duration: 5.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: late ? 0 : 1.7 });

    /* The step photographs drift behind their verbs */
    g.utils.toArray(".step-img").forEach((img) => {
      g.fromTo(img, { scale: 1.1, yPercent: -3 }, {
        scale: 1.02, yPercent: 3, ease: "none",
        scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true },
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
