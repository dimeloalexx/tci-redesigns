// Grace Bay Medical concept: open status in Turks and Caicos time, section entrances,
// the "what happened?" index with its photo frame, and the figures that count up.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Hours from the clinic's VisitTCI listing, in minutes after midnight (Sunday = 0).
  const HOURS = { 0: [540, 780], 1: [480, 1080], 2: [480, 1080], 3: [480, 1080], 4: [480, 1080], 5: [480, 1080], 6: [510, 960] };
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Grand_Turk', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

  const tciNow = () => {
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { day: DAYS.indexOf(p.weekday), min: (Number(p.hour) % 24) * 60 + Number(p.minute) };
  };
  const clock = (m) => {
    const h = Math.floor(m / 60), mm = m % 60, h12 = h % 12 || 12;
    return `${h12}${mm ? ':' + String(mm).padStart(2, '0') : ''} ${h >= 12 ? 'pm' : 'am'}`; // taste-skill-ignore: a clock
  };
  const status = () => {
    const { day, min } = tciNow();
    const [open, close] = HOURS[day];
    if (min >= open && min < close) return `Open now, until ${clock(close)}`;
    if (min < open) return `Closed now, opens today at ${clock(open)}`;
    return `Closed now, opens tomorrow at ${clock(HOURS[(day + 1) % 7][0])}`;
  };
  const paintStatus = () => {
    const s = status();
    document.querySelectorAll('[data-status]').forEach((el) => { el.textContent = `${s}. Emergency line 24 hours.`; });
    document.querySelectorAll('[data-status-short]').forEach((el) => { el.textContent = s; });
    const { min } = tciNow();
    document.querySelectorAll('[data-clock]').forEach((el) => { el.textContent = clock(min); });
  };
  paintStatus();
  setInterval(paintStatus, 30000);

  // Number each child so CSS can stagger the entrances.
  const stagger = (parent, selector) => [...parent.querySelectorAll(selector)].forEach((el, i) => el.style.setProperty('--i', i));
  document.querySelectorAll('[data-rise]').forEach((el) => stagger(el, ':scope > *'));
  document.querySelectorAll('.rows').forEach((el) => stagger(el, '.row'));
  document.querySelectorAll('.acc').forEach((el) => stagger(el, '.q'));
  document.querySelectorAll('.board').forEach((el) => stagger(el, ':scope > *'));
  document.querySelectorAll('.contact').forEach((el) => stagger(el, '.r'));
  document.querySelectorAll('.foot').forEach((el) => stagger(el, '.tile'));

  // Figures count up once when their tiles arrive.
  const countUp = (el) => {
    const end = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    if (reduce) { el.textContent = end.toFixed(decimals); return; }
    const start = performance.now(), dur = 1100;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (end * eased).toFixed(decimals);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const targets = '[data-rise], .rows, .visit, .stats, .about, .acc, .board, .contact, .foot';
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      entry.target.querySelectorAll('[data-count]').forEach(countUp);
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll(targets).forEach((el) => io.observe(el));

  // "What happened?": the hovered or open row shows its photograph in the frame.
  const grid = document.querySelector('.index-grid');
  if (grid) {
    const rows = [...grid.querySelectorAll('.row')];
    const shots = [...grid.querySelectorAll('.frame img')];
    const show = (key) => shots.forEach((img) => img.classList.toggle('is-on', img.dataset.key === key));
    const current = () => (rows.find((r) => r.open) || rows[0]).dataset.key;
    show(current());
    rows.forEach((row) => {
      row.querySelector('summary').addEventListener('pointerenter', () => show(row.dataset.key));
      row.addEventListener('toggle', () => { if (row.open) show(row.dataset.key); });
    });
    grid.querySelector('.rows').addEventListener('pointerleave', () => show(current()));
  }
})();
