/* Tiki Bar at the Grand Turk Lighthouse: the light switching on, the beam you can swing, and the scroll choreography. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const STILL = /[?&]still\b/.test(location.search);
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const G = window.gsap;
  const HAS_GSAP = !!(G && window.ScrollTrigger && window.SplitText);
  const MOTION = HAS_GSAP && !STILL && !REDUCED;
  if (!MOTION) root.classList.remove('anim');
  if (HAS_GSAP) G.registerPlugin(window.ScrollTrigger, window.SplitText);
  // Split headlines only once the faces have arrived, so the lines are measured in Fraunces.
  const fontsReady = Promise.race([
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 2500)),
  ]);

  /* ------------------------------------------------------------------ */
  /* Clip-path helpers                                                     */
  /* ------------------------------------------------------------------ */
  // "polygon(62% 118%, 2% -4%, ...)" -> [["62%","118%"], ...]
  const parsePoly = (s) => {
    const m = /polygon\((.*)\)/.exec(s || '');
    return m ? m[1].split(',').map(p => p.trim().split(/\s+/)) : null;
  };
  const joinPoly = (pts) => 'polygon(' + pts.map(p => p.join(' ')).join(', ') + ')';
  // Every point moved onto the apex's vertical line: a beam with no width.
  const collapseX = (s) => {
    const pts = parsePoly(s);
    if (!pts) return s;
    return joinPoly(pts.map(p => [pts[0][0], p[1]]));
  };

  /* ------------------------------------------------------------------ */
  /* Hero: the light switches on                                          */
  /* ------------------------------------------------------------------ */
  function heroIntro() {
    const light = $('.beam-light');
    const photo = $('.beam-photo');
    const img = $('.beam-photo img');
    const fullL = getComputedStyle(light).clipPath;
    const fullP = getComputedStyle(photo).clipPath;
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    G.set([light, photo], { visibility: 'visible' });
    tl.fromTo(light, { clipPath: collapseX(fullL) }, { clipPath: fullL, duration: 1.1, clearProps: 'clipPath' }, 0.15)
      .fromTo(photo, { clipPath: collapseX(fullP) }, { clipPath: fullP, duration: 1.1, clearProps: 'clipPath' }, 0.32)
      .fromTo(img, { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0.32);

    // Lines rise out of a mask; the mask is removed afterwards so no descender is ever clipped.
    fontsReady.then(() => {
      const st = SplitText.create('.hero .display', { type: 'lines', mask: 'lines' });
      G.set('.hero .display', { opacity: 1 });
      G.from(st.lines, { yPercent: 110, duration: 1, ease: 'expo.out', stagger: 0.09, delay: 0.1, onComplete: () => st.revert() });
    });
    tl.fromTo(['.hero .lead', '.hero .actions', '.hero .facts'], { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 }, 0.5);

    // The one moving picture: the tower breathes slowly inside the beam.
    tl.add(() => {
      G.to(img, { scale: 1.05, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }, 1.9);
  }

  /* ------------------------------------------------------------------ */
  /* Section entrances: heading, then text, then picture                  */
  /* ------------------------------------------------------------------ */
  function entrances() {
    const rise = (targets, trigger, opts = {}) => {
      const els = (Array.isArray(targets) ? targets : [targets]).flatMap(t => typeof t === 'string' ? $$(t) : [t]).filter(Boolean);
      if (!els.length) return;
      G.from(els, Object.assign({
        y: 26, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.075,
        scrollTrigger: { trigger: trigger || els[0], start: 'top 90%', once: true }
      }, opts));
    };
    const maskHeads = $$('.drinks .head, .light .head, .story .head, .ship .head, .proof .head');
    fontsReady.then(() => {
      maskHeads.forEach(h => {
        const st = SplitText.create(h, { type: 'lines', mask: 'lines' });
        G.from(st.lines, { yPercent: 105, duration: 0.95, ease: 'expo.out', stagger: 0.08, onComplete: () => st.revert(), scrollTrigger: { trigger: h, start: 'top 97%', once: true } });
      });
      window.ScrollTrigger.refresh();
    });

    rise('.drinks-head p', '.drinks-head');
    rise('.drinks-photo', '.drinks-head', { y: 60, duration: 1.1, delay: 0.15 });
    $$('.cat').forEach(c => {
      rise([$('.cat-top', c)], c);
      rise($$('.item', c), $('.items', c), { stagger: 0.06 });
      rise($$('.cat-note', c), $('.items', c), { delay: 0.3 });
    });

    rise('.light-head p', '.light-head');
    rise('.stage', '.stage', { y: 0, duration: 1 });
    rise('.stops button', '.stops', { stagger: 0.05, y: 16 });

    rise('.band-text p', '.band', { delay: 0.2 });
    rise('#h-since', '.band');

    rise('.panel', '.story', { y: 40, duration: 1 });
    rise('.panel-right > *', '.panel-right', { stagger: 0.09 });
    rise('.lens', '.lens', { y: 80, duration: 1.2 });

    rise('.ship-intro p', '.ship-intro');
    rise('.acc-panel', '.acc', { x: 40, y: 0, stagger: 0.07 });

    rise('.tile', '.tiles', { stagger: 0.06, y: 20 });

    rise('.card', '.visit', { y: 50, duration: 1 });
    G.fromTo('.visit-photo', { scale: 1.1 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.visit', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.fromTo('.lens img', { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.story', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Footer: the tower rises block by block, then the beams reach out.
    const blocks = $$('.mark .m-tower, .mark .m-lamp').reverse();
    G.from(blocks, { y: 40, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: '.mark', start: 'top 85%', once: true } });
    G.from('.mark .m-beam', { scaleX: 0, transformOrigin: (i) => i === 0 ? '100% 30%' : '0% 30%', duration: 1.1, ease: 'expo.out', delay: 0.5, scrollTrigger: { trigger: '.mark', start: 'top 85%', once: true } });
    rise('.foot-grid > *, .foot-last', '.foot-grid', { stagger: 0.08 });
  }

  /* ------------------------------------------------------------------ */
  /* The band: the beam opens as you scroll, the miles count up            */
  /* ------------------------------------------------------------------ */
  function band() {
    // The ground is everything outside the beam; as it shrinks, the beam opens out to sea.
    const ground = $('.band-ground');
    const mm = G.matchMedia();
    mm.add({ phone: '(max-width: 760px)', wide: '(min-width: 761px)' }, (ctx) => {
      const k = ctx.conditions.phone ? 2 / 3 : 30 / 130;
      const shape = (a) => {
        const y1 = (50 - (50 - a) * k).toFixed(2);
        const y2 = (50 + (50 - a) * k).toFixed(2);
        return `polygon(0 0, 100% 0, 100% ${a.toFixed(2)}%, 0 ${y1}%, 0 ${y2}%, 100% ${(100 - a).toFixed(2)}%, 100% 100%, 0 100%)`;
      };
      const o = { a: 44 };
      ground.style.clipPath = shape(o.a);
      const tw = G.to(o, { a: 0, ease: 'none', onUpdate: () => { ground.style.clipPath = shape(o.a); }, scrollTrigger: { trigger: '.band', start: 'top 92%', end: 'center 58%', scrub: 0.6 } });
      return () => { if (tw.scrollTrigger) tw.scrollTrigger.kill(); tw.kill(); ground.style.clipPath = ''; };
    });
    const count = $('.band .count');
    const to = Number(count.dataset.to) || 15;
    const o = { v: 0 };
    count.textContent = '0';
    G.to(o, { v: to, duration: 1.2, ease: 'power2.out', onUpdate: () => { count.textContent = String(Math.round(o.v)); }, scrollTrigger: { trigger: '.band', start: 'top 75%', once: true } });
  }

  /* ------------------------------------------------------------------ */
  /* Swing the light                                                       */
  /* ------------------------------------------------------------------ */
  const STOPS = [
    { name: 'The tower', text: 'Sixty feet of cast iron, made in England and standing here since 1852.' },
    { name: 'The pavilion', text: 'Picnic tables in the shade beside the tower.' },
    { name: 'The bar', text: 'Piña colada, blue curaçao, banana and grenadine, lined up and ready.' },
    { name: 'The old kitchen', text: "The keeper's Bermuda kitchen, still standing in the park." },
    { name: 'Your ship', text: 'Docked at the Cruise Center, about 20 minutes south by taxi.' },
  ];

  function beamExplorer() {
    const stage = $('#stage');
    if (!stage) return;
    const lightEl = $('.stage-light', stage);
    const photosEl = $('.stage-photos', stage);
    const imgs = $$('.stage-photos img', stage);
    const tower = $('.stage-tower', stage);
    const stopsEl = $('.stops');
    const btns = $$('.stops button');
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const cap = $('#stop-caption');
    let geo = null;
    let theta = 0;
    let active = -1;
    let tween = null;
    let auto = null;
    let userTook = false;
    let dragging = false;

    const sector = (a, half, R) => {
      const pts = [[geo.cx, geo.cy]];
      const n = 14;
      for (let k = 0; k <= n; k++) {
        const t = (a - half + (2 * half * k) / n) * Math.PI / 180;
        pts.push([geo.cx + R * Math.sin(t), geo.cy - R * Math.cos(t)]);
      }
      return pts;
    };
    const poly = (pts) => 'polygon(' + pts.map(([x, y]) => x.toFixed(1) + 'px ' + y.toFixed(1) + 'px').join(', ') + ')';
    const nearest = (a) => {
      let best = 0;
      geo.angles.forEach((x, i) => { if (Math.abs(x - a) < Math.abs(geo.angles[best] - a)) best = i; });
      return best;
    };

    function setActive(i) {
      if (i === active) return;
      active = i;
      imgs.forEach((im, k) => im.classList.toggle('on', k === i));
      btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
      cap.innerHTML = '<strong>' + STOPS[i].name + '.</strong> ' + STOPS[i].text;
      stage.setAttribute('aria-valuenow', String(i + 1));
      stage.setAttribute('aria-valuetext', STOPS[i].name + ': ' + STOPS[i].text);
    }

    function draw() {
      photosEl.style.clipPath = poly(sector(theta, geo.alpha, geo.L));
      lightEl.style.clipPath = poly(sector(theta, geo.alpha + 3.2, geo.L + 18));
      setActive(nearest(theta));
    }

    function measure() {
      const W = stage.clientWidth;
      const H = stage.clientHeight;
      const ring = W >= 700;
      const span = ring ? 52 : 30;
      const alpha = ring ? 25 : 21;
      // The beam leaves from the lantern of the little tower at the bottom of the stage.
      const th = tower.getBoundingClientRect().height || (ring ? 130 : 96);
      const apexY = H - th + th * (73 / 380);
      const L = apexY - (ring ? 60 : 20);
      geo = { W, H, cx: W / 2, cy: apexY, L, alpha, span, angles: [-span, -span / 2, 0, span / 2, span] };
      stopsEl.classList.toggle('ring', ring);
      btns.forEach((b, i) => {
        if (!ring) { b.style.left = ''; b.style.top = ''; return; }
        const a = geo.angles[i] * Math.PI / 180;
        const R = L + 36;
        const bw = b.offsetWidth;
        const bh = b.offsetHeight;
        b.style.left = clamp(geo.cx + R * Math.sin(a) - bw / 2, 8, W - bw - 8) + 'px';
        b.style.top = clamp(geo.cy - R * Math.cos(a) - bh / 2, 8, H - bh - 8) + 'px';
      });
      imgs.forEach((img, i) => {
        const pts = sector(geo.angles[i], alpha, geo.L);
        let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
        pts.forEach(([x, y]) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        x0 = Math.max(0, x0 - 10); x1 = Math.min(W, x1 + 10); y0 = Math.max(0, y0 - 10); y1 = Math.min(H, y1);
        Object.assign(img.style, { left: x0 + 'px', top: y0 + 'px', width: (x1 - x0) + 'px', height: (y1 - y0) + 'px', objectPosition: img.dataset.pos || '50% 50%' });
      });
      draw();
    }

    function goTo(i, instant) {
      i = Math.max(0, Math.min(STOPS.length - 1, i));
      const target = geo.angles[i];
      if (tween) tween.kill();
      if (!MOTION || instant) { theta = target; draw(); return; }
      const proxy = { t: theta };
      tween = G.to(proxy, { t: target, duration: 0.9, ease: 'power2.inOut', onUpdate: () => { theta = proxy.t; draw(); } });
    }

    function takeOver() {
      if (userTook) return;
      userTook = true;
      stage.classList.add('used');
      cap.setAttribute('aria-live', 'polite');
      if (auto) { clearInterval(auto); auto = null; }
    }
    // While the light sweeps by itself the caption changes quietly; it speaks once someone takes the beam.
    cap.setAttribute('aria-live', MOTION ? 'off' : 'polite');
    stage.addEventListener('focus', takeOver);
    stopsEl.addEventListener('focusin', takeOver);

    // Pointer: drag the beam around the lamp.
    const angleAt = (e) => {
      const r = stage.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;
      const a = Math.atan2(x - geo.cx, geo.cy - y) * 180 / Math.PI;
      return Math.max(-geo.span - 10, Math.min(geo.span + 10, a));
    };
    stage.addEventListener('pointerdown', (e) => {
      takeOver();
      dragging = true;
      if (tween) tween.kill();
      try { stage.setPointerCapture(e.pointerId); } catch (_) {}
      theta = angleAt(e);
      draw();
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      theta = angleAt(e);
      draw();
    });
    const release = () => {
      if (!dragging) return;
      dragging = false;
      goTo(nearest(theta));
    };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('lostpointercapture', release);

    stage.addEventListener('keydown', (e) => {
      const k = e.key;
      let i = null;
      if (k === 'ArrowLeft' || k === 'ArrowDown') i = active - 1;
      else if (k === 'ArrowRight' || k === 'ArrowUp') i = active + 1;
      else if (k === 'Home') i = 0;
      else if (k === 'End') i = STOPS.length - 1;
      if (i === null) return;
      e.preventDefault();
      takeOver();
      goTo(i);
    });
    btns.forEach((b, i) => b.addEventListener('click', () => { takeOver(); goTo(i); }));

    // Load the stage's pictures when it nears the screen (lazy images inside a clip never load on their own).
    const near = new IntersectionObserver((entries) => {
      if (entries.some(en => en.isIntersecting)) {
        imgs.forEach(im => { im.loading = 'eager'; });
        near.disconnect();
      }
    }, { rootMargin: '900px 0px' });
    near.observe(stage);

    // The light sweeps on its own until someone takes it.
    if (MOTION) {
      const order = [2, 3, 4, 3, 2, 1, 0, 1];
      let step = 0;
      const io = new IntersectionObserver((entries) => {
        const vis = entries.some(en => en.isIntersecting);
        if (vis && !auto && !userTook) {
          auto = setInterval(() => { step = (step + 1) % order.length; goTo(order[step]); }, 2600);
        } else if (!vis && auto) { clearInterval(auto); auto = null; }
      }, { threshold: 0.4 });
      io.observe(stage);
    }

    const ro = new ResizeObserver(() => measure());
    ro.observe(stage);
    measure();
    goTo(2, true);
  }

  /* ------------------------------------------------------------------ */
  /* Accordion: from your ship                                            */
  /* ------------------------------------------------------------------ */
  function accordion() {
    const panels = $$('.acc-panel');
    panels.forEach((p, i) => {
      $('.acc-h button', p).addEventListener('click', () => {
        panels.forEach((q, k) => {
          const on = k === i;
          q.classList.toggle('is-open', on);
          $('.acc-h button', q).setAttribute('aria-expanded', String(on));
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Phone dock: WhatsApp and directions once the hero has gone by         */
  /* ------------------------------------------------------------------ */
  function dock() {
    const d = $('#dock');
    const hero = $('.hero');
    const foot = $('.foot');
    let heroGone = false, footIn = false;
    const sync = () => d.classList.toggle('show', heroGone && !footIn);
    new IntersectionObserver(([en]) => { heroGone = !en.isIntersecting; sync(); }, { threshold: 0 }).observe(hero);
    new IntersectionObserver(([en]) => { footIn = en.isIntersecting; sync(); }, { threshold: 0 }).observe(foot);
  }

  accordion();
  beamExplorer();
  dock();
  if (MOTION) {
    heroIntro();
    entrances();
    band();
  }
})();
