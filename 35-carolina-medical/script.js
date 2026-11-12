// Carolina Medical concept: the slow crossfade inside the sun, section entrances, and the fasting slip.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Number children so CSS can stagger their entrances.
  const stagger = (sel, child) => document.querySelectorAll(sel).forEach((p) => [...p.querySelectorAll(child)].forEach((el, i) => el.style.setProperty('--i', i)));
  stagger('.card .inner', ':scope > *');
  stagger('.points', 'li');
  stagger('.lab-intro', ':scope > *');
  stagger('.panel .text', ':scope > *');
  stagger('.faq', '.qa');
  stagger('.discs', '.d');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
  document.querySelectorAll('.points-sec, .lab, .panel, .faq, .coupon-sec, .foot').forEach((el) => io.observe(el));

  // The sun's lens: four pictures of the three trades crossfade slowly, captions in step.
  const shots = [...document.querySelectorAll('.lens img')];
  const notes = [...document.querySelectorAll('.room .caption span')];
  let k = 0, timer = null;
  const step = () => {
    k = (k + 1) % shots.length;
    shots.forEach((img, i) => img.classList.toggle('is-on', i === k));
    notes.forEach((n, i) => n.classList.toggle('is-on', i === k));
  };
  const start = () => { if (!reduce && !timer) timer = setInterval(step, 6000); };
  const stop = () => { clearInterval(timer); timer = null; };
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();

  // The fasting slip.
  const form = document.querySelector('.fast');
  if (!form) return;
  const HOURS = { sugar: 8, chol: 12, both: 12, count: 0, unsure: null };
  const NAMES = { sugar: 'Blood sugar', chol: 'Cholesterol', both: 'Blood sugar and cholesterol', count: 'Blood count', unsure: 'Not sure yet' };
  const clock = (m) => {
    const t = ((m % 1440) + 1440) % 1440, h = Math.floor(t / 60), mm = t % 60;
    return `${h % 12 || 12}:${String(mm).padStart(2, '0')} ${h >= 12 ? 'pm' : 'am'}`; // taste-skill-ignore: a clock
  };
  const out = (key) => document.querySelector(`.slip [data-s="${key}"]`);
  const set = (key, text) => {
    const el = out(key);
    if (!el || el.textContent === text) return;
    el.textContent = text;
    el.classList.remove('changed'); void el.offsetWidth; el.classList.add('changed');
  };
  const update = () => {
    const test = form.querySelector('input[name="test"]:checked').value;
    const appt = Number(form.querySelector('#appt').value);
    const hours = HOURS[test];
    set('test', NAMES[test]);
    set('appt', clock(appt));
    set('arrive', clock(appt - 10));
    if (hours === null) {
      set('last', 'call us first');
      set('fast', 'Call 649 946 4367 to check');
    } else if (hours === 0) {
      set('last', 'eat as normal');
      set('fast', 'No fasting needed');
    } else {
      const last = appt - hours * 60;
      set('last', last < 0 ? `by ${clock(last)} the night before` : `by ${clock(last)}`);
      set('fast', `${hours} hours without food`);
    }
  };
  form.addEventListener('change', update);
  update();
})();
