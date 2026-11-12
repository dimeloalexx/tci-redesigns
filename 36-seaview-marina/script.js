/* Seaview Marina: code flags flying in the wind, the pump's number wheels, and the scroll choreography. */
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

  /* ------------------------------------------------------------------ */
  /* Code flags (International Code of Signals), drawn on canvas          */
  /* ------------------------------------------------------------------ */
  const FC = { r: '#d42a33', b: '#1f3f99', y: '#f5c518', k: '#161616', w: '#ffffff' };
  const SWALLOW = { A: true, B: true };

  function paint(g, L, w, h) {
    const R = (c, x, y, ww, hh) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
    const P = (c, pts) => {
      g.fillStyle = c;
      g.beginPath();
      g.moveTo(pts[0], pts[1]);
      for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]);
      g.closePath();
      g.fill();
    };
    const saltire = (c) => {
      g.save();
      g.beginPath(); g.rect(0, 0, w, h); g.clip();
      g.strokeStyle = c; g.lineWidth = Math.min(w, h) * 0.2;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(w, h); g.moveTo(w, 0); g.lineTo(0, h); g.stroke();
      g.restore();
    };
    const cross = (c) => { R(c, w * 0.4, 0, w * 0.2, h); R(c, 0, h * 0.4, w, h * 0.2); };
    const n = w * 0.25;
    switch (L) {
      case 'A': P(FC.w, [0, 0, w / 2, 0, w / 2, h, 0, h]); P(FC.b, [w / 2, 0, w, 0, w - n, h / 2, w, h, w / 2, h]); break;
      case 'B': P(FC.r, [0, 0, w, 0, w - n, h / 2, w, h, 0, h]); break;
      case 'C': [FC.b, FC.w, FC.r, FC.w, FC.b].forEach((c, i) => R(c, 0, (i * h) / 5, w, h / 5 + 1)); break;
      case 'D': R(FC.y, 0, 0, w, h); R(FC.b, 0, h / 4, w, h / 2); break;
      case 'E': R(FC.b, 0, 0, w, h / 2); R(FC.r, 0, h / 2, w, h / 2); break;
      case 'F': R(FC.w, 0, 0, w, h); P(FC.r, [w / 2, 0, w, h / 2, w / 2, h, 0, h / 2]); break;
      case 'G': for (let i = 0; i < 6; i++) R(i % 2 ? FC.b : FC.y, (i * w) / 6, 0, w / 6 + 1, h); break;
      case 'H': R(FC.w, 0, 0, w / 2, h); R(FC.r, w / 2, 0, w / 2, h); break;
      case 'I': R(FC.y, 0, 0, w, h); g.fillStyle = FC.k; g.beginPath(); g.arc(w / 2, h / 2, h / 4, 0, Math.PI * 2); g.fill(); break;
      case 'J': R(FC.b, 0, 0, w, h); R(FC.w, 0, h / 3, w, h / 3); break;
      case 'K': R(FC.y, 0, 0, w / 2, h); R(FC.b, w / 2, 0, w / 2, h); break;
      case 'L': R(FC.y, 0, 0, w / 2, h / 2); R(FC.k, w / 2, 0, w / 2, h / 2); R(FC.k, 0, h / 2, w / 2, h / 2); R(FC.y, w / 2, h / 2, w / 2, h / 2); break;
      case 'M': R(FC.b, 0, 0, w, h); saltire(FC.w); break;
      case 'N': for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) R((i + j) % 2 ? FC.w : FC.b, (i * w) / 4, (j * h) / 4, w / 4 + 1, h / 4 + 1); break;
      case 'O': P(FC.y, [0, 0, w, h, 0, h]); P(FC.r, [0, 0, w, 0, w, h]); break;
      case 'P': R(FC.b, 0, 0, w, h); R(FC.w, w / 3, h / 3, w / 3, h / 3); break;
      case 'Q': R(FC.y, 0, 0, w, h); break;
      case 'R': R(FC.r, 0, 0, w, h); cross(FC.y); break;
      case 'S': R(FC.w, 0, 0, w, h); R(FC.b, w / 3, h / 3, w / 3, h / 3); break;
      case 'T': R(FC.r, 0, 0, w / 3, h); R(FC.w, w / 3, 0, w / 3, h); R(FC.b, (2 * w) / 3, 0, w / 3 + 1, h); break;
      case 'U': R(FC.r, 0, 0, w / 2, h / 2); R(FC.w, w / 2, 0, w / 2, h / 2); R(FC.w, 0, h / 2, w / 2, h / 2); R(FC.r, w / 2, h / 2, w / 2, h / 2); break;
      case 'V': R(FC.w, 0, 0, w, h); saltire(FC.r); break;
      case 'W': R(FC.b, 0, 0, w, h); R(FC.w, w / 6, h / 6, (w * 2) / 3, (h * 2) / 3); R(FC.r, w / 3, h / 3, w / 3, h / 3); break;
      case 'X': R(FC.w, 0, 0, w, h); cross(FC.b); break;
      case 'Y': {
        R(FC.y, 0, 0, w, h);
        g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
        const s = (w + h) / 10;
        for (let i = -h; i < w + h; i += 2 * s) P(FC.r, [i, 0, i + s, 0, i + s - h, h, i - h, h]);
        g.restore();
        break;
      }
      case 'Z': R(FC.y, 0, 0, w, h); P(FC.k, [0, 0, w / 2, h / 2, 0, h]); P(FC.r, [0, h, w / 2, h / 2, w, h]); P(FC.b, [w, h, w / 2, h / 2, w, 0]); break;
      default: R(FC.y, 0, 0, w, h);
    }
    // a soft edge so the white flags still read on light grounds
    g.save();
    g.strokeStyle = 'rgba(20,26,44,.3)';
    g.lineWidth = Math.max(1, w / 80);
    const e = g.lineWidth / 2;
    g.beginPath();
    if (SWALLOW[L]) {
      g.moveTo(e, e); g.lineTo(w - e, e); g.lineTo(w - n, h / 2); g.lineTo(w - e, h - e); g.lineTo(e, h - e); g.closePath();
    } else {
      g.rect(e, e, w - 2 * e, h - 2 * e);
    }
    g.stroke();
    g.restore();
  }

  const sprites = new Map();
  function sprite(L, w, h) {
    const key = `${L}:${w}x${h}`;
    let s = sprites.get(key);
    if (s) return s;
    const make = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    const c = make();
    paint(c.getContext('2d'), L, w, h);
    const silhouette = (col) => {
      const t = make();
      const g = t.getContext('2d');
      g.drawImage(c, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = col;
      g.fillRect(0, 0, w, h);
      return t;
    };
    s = { c, dk: silhouette('#000'), lt: silhouette('#fff') };
    sprites.set(key, s);
    return s;
  }

  const live = new Set();
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.target._flag) e.target._flag.visible = e.isIntersecting; }), { rootMargin: '120px' })
    : null;
  const ro = 'ResizeObserver' in window
    ? new ResizeObserver((es) => es.forEach((e) => { const f = e.target._flag; if (f) { f.resize(); if (!MOTION) f.draw(1.3); } }))
    : null;

  class Flag {
    constructor(canvas, i) {
      this.c = canvas;
      this.g = canvas.getContext('2d');
      this.L = (canvas.dataset.l || 'Q').toUpperCase();
      this.i = i || 0;
      this.visible = true;
      this.gust = 0;
      canvas._flag = this;
      this.resize();
      live.add(this);
      if (io) io.observe(canvas);
      if (ro) ro.observe(canvas);
    }
    resize() {
      const r = this.c.getBoundingClientRect();
      const d = Math.min(window.devicePixelRatio || 1, 2);
      const W = Math.max(2, Math.round(r.width * d));
      const H = Math.max(2, Math.round(r.height * d));
      if (this.c.width !== W) this.c.width = W;
      if (this.c.height !== H) this.c.height = H;
      this.d = d;
      this.fw = Math.max(1, W - Math.round(3 * d));
      this.fh = Math.max(1, Math.round(H / 1.3));
      this.y0 = Math.round((H - this.fh) / 2);
      this.spr = sprite(this.L, this.fw, this.fh);
    }
    draw(phase) {
      const { g, c, spr, fw, fh, y0 } = this;
      g.clearRect(0, 0, c.width, c.height);
      const sw = Math.max(2, Math.round(2 * this.d));
      const amp = fh * (0.1 + this.gust * 0.09);
      const k = (Math.PI * 2) / 0.92;
      const off = this.i * 0.9;
      for (let sx = 0; sx < fw; sx += sw) {
        const u = sx / fw;
        const a = k * u - phase + off;
        const y = y0 + amp * Math.pow(u, 1.15) * Math.sin(a);
        const ww = Math.min(sw, fw - sx);
        g.drawImage(spr.c, sx, 0, ww, fh, sx, y, ww + 0.5, fh);
        const sh = Math.cos(a) * Math.pow(u, 0.75);
        if (sh > 0.06) {
          g.globalAlpha = sh * 0.2;
          g.drawImage(spr.lt, sx, 0, ww, fh, sx, y, ww, fh);
          g.globalAlpha = 1;
        } else if (sh < -0.06) {
          g.globalAlpha = -sh * 0.3;
          g.drawImage(spr.dk, sx, 0, ww, fh, sx, y, ww, fh);
          g.globalAlpha = 1;
        }
      }
    }
    destroy() {
      live.delete(this);
      if (io) io.unobserve(this.c);
      if (ro) ro.unobserve(this.c);
    }
  }

  let phase = 0;
  let last = 0;
  function tick(now) {
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    phase += (6 + 1.8 * Math.sin(now / 2100) + 0.8 * Math.sin(now / 770)) * dt;
    live.forEach((f) => {
      if (!f.visible) return;
      if (f.gust > 0) f.gust = Math.max(0, f.gust - dt * 0.8);
      f.draw(phase);
    });
    requestAnimationFrame(tick);
  }

  $$('.hoist .flag').forEach((c, i) => new Flag(c, i));
  $$('.code .flag').forEach((c, i) => {
    const f = new Flag(c, i);
    if (MOTION) c.closest('li').addEventListener('pointerenter', () => { f.gust = 1; });
  });
  if (MOTION) requestAnimationFrame(tick);
  else live.forEach((f) => f.draw(1.3));

  /* ------------------------------------------------------------------ */
  /* Number wheels, like the counters on the pump                        */
  /* ------------------------------------------------------------------ */
  const pos = (idx) => -(idx / 30) * 100;
  function strip() {
    // the digits 0-9 three times over come from CSS (.strip::before), so the strip adds no text to the page
    const st = document.createElement('span');
    st.className = 'strip';
    return st;
  }
  function place(st, idx) {
    if (HAS_GSAP) G.set(st, { yPercent: pos(idx) });
    else st.style.transform = `translateY(${pos(idx)}%)`;
  }
  function buildRoll(el) {
    const txt = el.dataset.roll || el.textContent;
    const vis = document.createElement('span');
    vis.className = 'roll-vis';
    vis.setAttribute('aria-hidden', 'true');
    for (const ch of txt) {
      if (/\d/.test(ch)) {
        const w = document.createElement('span');
        w.className = 'wheel';
        w.dataset.d = ch;
        const st = strip();
        w.appendChild(st);
        vis.appendChild(w);
        place(st, MOTION ? 0 : 20 + Number(ch));
      } else {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        vis.appendChild(s);
      }
    }
    const sr = document.createElement('span');
    sr.className = 'sr';
    sr.textContent = txt;
    el.textContent = '';
    el.append(sr, vis);
    return vis;
  }
  function roll(vis) {
    $$('.wheel', vis).forEach((w, i) => {
      G.fromTo(w.firstChild, { yPercent: pos(0) }, { yPercent: pos(20 + Number(w.dataset.d)), duration: 1 + i * 0.25, ease: 'back.out(1.1)', overwrite: true });
    });
  }
  $$('.roll').forEach(buildRoll);

  /* the pump: three wheels that roll forward when you add and back when you take away */
  const pump = { box: $('#wheels'), st: [], idx: [], value: -1 };
  if (pump.box) {
    pump.box.textContent = '';
    for (let i = 0; i < 3; i++) {
      const w = document.createElement('span');
      w.className = 'wheel';
      const st = strip();
      w.appendChild(st);
      pump.box.appendChild(w);
      pump.st.push(st);
      pump.idx.push(10);
      place(st, 10);
    }
  }
  function rollPump(i, d, dir, dur) {
    const st = pump.st[i];
    let cur = MOTION ? -(G.getProperty(st, 'yPercent') / 100) * 30 : pump.idx[i];
    const curD = ((Math.round(cur) % 10) + 10) % 10;
    let next = dir > 0 ? Math.round(cur) + ((d - curD + 10) % 10) : Math.round(cur) - ((curD - d + 10) % 10);
    if (next > 27) { cur -= 10; next -= 10; }
    if (next < 2) { cur += 10; next += 10; }
    pump.idx[i] = next;
    if (!MOTION) { place(st, next); return; }
    G.set(st, { yPercent: pos(cur) });
    G.to(st, { yPercent: pos(next), duration: dur, ease: 'back.out(1.5)', overwrite: true });
  }
  function setPump(v, fromZero) {
    if (!pump.st.length) return;
    v = Math.max(0, Math.min(999, Math.round(v)));
    if (v === pump.value && !fromZero) return;
    const digits = String(v).padStart(3, '0').split('').map(Number);
    const dir = fromZero || v >= pump.value ? 1 : -1;
    pump.value = v;
    digits.forEach((d, i) => {
      if (fromZero && MOTION) {
        pump.idx[i] = 10 + d + (i === 2 ? 10 : 0);
        G.fromTo(pump.st[i], { yPercent: pos(10) }, { yPercent: pos(pump.idx[i]), duration: 0.9 + i * 0.3, ease: 'back.out(1.2)', overwrite: true });
      } else {
        rollPump(i, d, dir, 0.45 + (2 - i) * 0.08);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /* Tell the dock: the pump is the form                                 */
  /* ------------------------------------------------------------------ */
  const form = $('#pump');
  const gal = $('#gal');
  const fuel = () => (form ? (form.querySelector('input[name=grade]:checked') || {}).value || '' : '');
  const gallons = () => (fuel() && gal ? Number(gal.value) : 0);
  const num = (v) => { const x = parseFloat(String(v).replace(',', '.')); return Number.isFinite(x) && x > 0 ? x : 0; };
  const short = (x) => String(Math.round(x * 10) / 10);
  const listJoin = (a) => (a.length < 2 ? a[0] || '' : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

  let boatWord = '';
  function setBoatFlags(name) {
    const box = $('#boat-flags');
    if (!box) return;
    const word = name.toUpperCase().replace(/[^A-Z ]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
    if (word === boatWord) return;
    let p = 0;
    while (p < word.length && p < boatWord.length && word[p] === boatWord[p]) p++;
    while (box.children.length > p) {
      const el = box.lastElementChild;
      if (el._flag) el._flag.destroy();
      el.remove();
    }
    for (let i = p; i < word.length; i++) {
      if (word[i] === ' ') {
        const s = document.createElement('span');
        s.className = 'gap';
        box.appendChild(s);
        continue;
      }
      const c = document.createElement('canvas');
      c.className = 'flag';
      c.dataset.l = word[i];
      box.appendChild(c);
      const f = new Flag(c, i);
      if (MOTION) {
        f.gust = 1;
        G.from(c, { yPercent: 70, autoAlpha: 0, duration: 0.45, ease: 'back.out(2)' });
      } else {
        f.draw(1.3);
      }
    }
    boatWord = word;
    const hint = $('#flags-hint');
    if (hint) hint.hidden = word.length > 0;
  }

  function update(rollIt) {
    if (!form) return;
    const g = fuel();
    const v = gallons();
    if (gal) {
      gal.disabled = !g;
      gal.setAttribute('aria-valuetext', `${gal.value} gallons`);
    }
    $$('.step', form).forEach((b) => { b.disabled = !g; });
    if (rollIt) setPump(v, false);

    const extras = $$('.also input:checked', form).map((i) => i.value);
    const name = $('#boat').value.trim().replace(/\s+/g, ' ');
    const L = num($('#len').value);
    const D = num($('#draft').value);
    const size = [L ? `${short(L)} ft` : '', D ? `${short(D)} ft draft` : ''].filter(Boolean).join(', ');
    const wants = [];
    if (g && v > 0) wants.push(`about ${v} gallons of ${g}`);
    wants.push(...extras);

    let s = `Hi Seaview Marina, this is ${name || 'a boat'}${size ? ` (${size})` : ''}. We plan to arrive ${$('#when').value}`;
    s += wants.length ? ` and would like ${listJoin(wants)}.` : '.';
    s += ' Where should we come alongside? Thank you.';
    $('#msg').textContent = s;
    $('#send').href = `https://wa.me/16492314554?text=${encodeURIComponent(s)}`;
    const call = name || 'your boat';
    $('#vhf').textContent = name
      ? `Seaview Marina, Seaview Marina, this is ${call}, ${call}. Over.`
      : 'Seaview Marina, Seaview Marina, this is your boat. Over.';
    $('#warn').hidden = !(D > 3);
    setBoatFlags(name);
  }

  if (form) {
    form.addEventListener('submit', (e) => e.preventDefault());
    form.addEventListener('input', (e) => update(e.target === gal));
    form.addEventListener('change', () => update(true));
    $$('.step', form).forEach((b) => b.addEventListener('click', () => {
      gal.value = String(Math.max(0, Math.min(300, Number(gal.value) + Number(b.dataset.step))));
      update(true);
    }));
    update(false);
    if (MOTION) setPump(0, false);
    else setPump(gallons(), false);
  }

  /* ------------------------------------------------------------------ */
  /* Scroll choreography                                                 */
  /* ------------------------------------------------------------------ */
  if (!MOTION) return;
  const ST = window.ScrollTrigger;
  G.registerPlugin(ST, window.SplitText);
  ST.config({ ignoreMobileResize: true });

  // 1. the name rolls in like the pump's wheels, the photograph rises under it
  (function intro() {
    const title = $('.hero-title');
    const split = window.SplitText.create($$('.ln', title), { type: 'chars', mask: 'chars' });
    G.set(title, { autoAlpha: 1 });
    G.timeline({ delay: 0.1 })
      .from(split.chars, { yPercent: 118, duration: 0.85, ease: 'back.out(1.6)', stagger: 0.055 })
      .from('.rise', { yPercent: 24, duration: 1.3, ease: 'expo.out' }, 0.1)
      .from('.plates .plate', { y: 28, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12 }, 0.6)
      .from('.nav', { yPercent: -100, duration: 0.6, ease: 'power3.out' }, 0);
  })();

  // 2. scroll opens the photograph to the whole harbour, then the name runs up the halyard in flags
  const mm = G.matchMedia();
  mm.add({ phone: '(max-width: 640px)', wide: '(min-width: 641px)' }, (ctx) => {
    const phone = ctx.conditions.phone;
    const hero = $('.hero');
    const title = $('.hero-title');
    const lines = $$('.ln', title);
    const side = phone ? 16 : 36.5;
    const card = () => {
      const hr = hero.getBoundingClientRect();
      const tr = title.getBoundingClientRect();
      const tuck = phone ? 6 : hr.width * 0.012;
      const top = Math.min(70, Math.max(16, ((tr.bottom - hr.top - tuck) / hr.height) * 100));
      return `inset(${top.toFixed(2)}% ${side}% 0% ${side}%)`;
    };
    G.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: hero, start: 'top top', end: '+=140%', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2 },
    })
      .fromTo('.rise', { clipPath: card }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55 }, 0)
      .fromTo('.rise img', { scale: 1.16 }, { scale: 1, duration: 0.55 }, 0)
      .to(lines[0], { yPercent: -35, autoAlpha: 0, duration: 0.3 }, 0.04)
      .to(lines[1], { yPercent: 35, autoAlpha: 0, duration: 0.3 }, 0.04)
      .to('.hoist', { autoAlpha: 1, duration: 0.06 }, 0.42)
      .fromTo('.hoist-flags', { yPercent: 102 }, { yPercent: 0, duration: 0.42, ease: 'power1.out' }, 0.44)
      .fromTo('.hoist-cap', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.84);
  });

  // 3. at the pumps: each word rolls up like a counter, the pump tilts as it passes
  $$('.stack li').forEach((li, i) => {
    const sp = window.SplitText.create(li, { type: 'chars', mask: 'chars' });
    G.from(sp.chars, { yPercent: 118, duration: 0.8, ease: 'back.out(1.5)', stagger: 0.04, delay: i * 0.12, scrollTrigger: { trigger: '.stack', start: 'top 82%', once: true } });
    G.fromTo(li, { x: (i % 2 ? 1 : -1) * 12 }, { x: (i % 2 ? -1 : 1) * 12, ease: 'none', scrollTrigger: { trigger: '.pumps', start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  G.fromTo('.object', { rotate: 12, yPercent: 14 }, { rotate: 2, yPercent: -8, ease: 'none', scrollTrigger: { trigger: '.pumps', start: 'top bottom', end: 'bottom top', scrub: true } });
  G.from('.house', { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.house', start: 'top 85%', once: true } });
  G.from('.pumps-text .lead-p', { y: 24, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.pumps-text', start: 'top 82%', once: true } });

  // 4. coming in: the passage pans past, one leg of the way in at a time
  (function passage() {
    const sec = $('.passage');
    if (!sec) return;
    const img = $('.pan img', sec);
    const legs = $$('.leg', sec);
    sec.classList.add('is-pinned');
    const dist = () => Math.max(0, img.getBoundingClientRect().width - window.innerWidth);
    const n = legs.length;
    const tl = G.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: sec, start: 'top top', end: () => `+=${Math.round(window.innerHeight * 2.4)}`, pin: true, scrub: 0.8, invalidateOnRefresh: true, refreshPriority: 1 },
    });
    tl.fromTo('.pan', { x: 0 }, { x: () => -dist(), duration: 1 }, 0)
      .to('.in-head', { autoAlpha: 0, y: -40, duration: 0.06, ease: 'power2.in' }, 1 / n - 0.07);
    legs.forEach((leg, i) => {
      const at = i / n;
      if (i > 0) tl.fromTo(leg, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.07, ease: 'power2.out' }, at);
      if (i < n - 1) tl.to(leg, { autoAlpha: 0, y: -30, duration: 0.06, ease: 'power2.in' }, at + 1 / n - 0.07);
      const v = $('.roll-vis', leg);
      if (v) tl.call(() => roll(v), null, at + 0.01);
    });
    img.addEventListener('load', () => ST.refresh(), { once: true });
  })();

  // 5. ashore: the photograph unfurls into a swallowtail flag
  G.fromTo('.shape', { '--notch': '100%' }, { '--notch': '74%', ease: 'none', scrollTrigger: { trigger: '.ashore', start: 'top 85%', end: 'top 25%', scrub: true } });
  G.fromTo('.shape img', { yPercent: -9 }, { yPercent: -1, ease: 'none', scrollTrigger: { trigger: '.ashore', start: 'top bottom', end: 'bottom top', scrub: true } });
  G.from('.ashore .sub', { y: 24, autoAlpha: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: '.ashore .sub', start: 'top 88%', once: true } });
  G.from('.points li', { y: 28, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '.points', start: 'top 86%', once: true } });

  // 6. stay the night: the anchorage comes closer as you scroll
  G.fromTo('.stay-bg img', { scale: 1.3 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.stay', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  G.from('.stay .plate', { y: 60, autoAlpha: 0, duration: 0.9, ease: 'expo.out', stagger: 0.15, scrollTrigger: { trigger: '.stay', start: 'top 55%', once: true } });

  // 7. the pump wheels count up to the first order when the pump comes into view
  G.from('.pump', { y: 50, autoAlpha: 0, duration: 0.9, ease: 'expo.out', scrollTrigger: { trigger: '.pump', start: 'top 90%', once: true } });
  ST.create({ trigger: '.pump', start: 'top 70%', once: true, onEnter: () => setPump(gallons(), true) });
  G.from('.contact .c-row', { x: -24, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: '.contact', start: 'top 90%', once: true } });

  // 8. footer flags run up one after another
  G.from('.code li', { y: 40, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.07, scrollTrigger: { trigger: '.code', start: 'top 92%', once: true } });

  // headings rise line by line out of a mask
  $$('[data-lines]').forEach((el) => {
    window.SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => G.from(self.lines, { yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: el, start: 'top 88%', once: true } }),
    });
  });

  window.addEventListener('load', () => ST.refresh());
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ST.refresh());
})();
