// Turks Kebab concept: order by number, the ticket, open hours in island time, the hero crossfade and entrances.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const money = n => "$" + n;

  /* ---------- The menu, read from the page ---------- */
  const items = new Map();
  $$(".items li").forEach(li => {
    const key = li.dataset.n || li.dataset.id;
    const it = $(".it", li);
    const name = [...it.childNodes].filter(n => !(n.nodeType === 1 && (n.classList.contains("no") || n.classList.contains("pr")))).map(n => n.textContent).join("").trim();
    const price = Number(li.dataset.price);
    const opts = (li.dataset.opts || "").split("|").filter(Boolean).map(o => {
      const [label, p] = o.split(":");
      return { label, price: p ? Number(p) : price };
    });
    items.set(key, { key, n: li.dataset.n || "", name, price, opts, li });
    const add = document.createElement("button");
    add.type = "button";
    add.className = "add";
    add.setAttribute("aria-label", `Add ${li.dataset.n ? li.dataset.n + " " : ""}${name} to your order`);
    add.addEventListener("click", () => { addLine(key); flash(add); });
    li.append(add);
  });
  const label = it => (it.n ? it.n + " " : "") + it.name;
  const priceOf = (it, opt) => (it.opts[opt] ? it.opts[opt].price : it.price);

  /* ---------- The keypad ---------- */
  const typedEl = $("[data-typed]"), matchEl = $("[data-match]"), typeIn = $("[data-type-in]");
  const addKey = $('[data-key="add"]');
  let typed = "61", fresh = true;
  const numbers = [...items.values()].filter(i => i.n).map(i => i.n);

  function showTyped(note) {
    typedEl.textContent = typed;
    if (typeIn && document.activeElement !== typeIn) typeIn.value = fresh ? "" : typed;
    const it = items.get(typed);
    addKey.disabled = !it;
    matchEl.classList.toggle("is-miss", !it);
    if (note) { matchEl.textContent = note; return; }
    if (!typed) { matchEl.textContent = "Type a dish number from the menu."; return; }
    if (it) {
      const choice = it.opts.length ? ", " + it.opts.map(o => o.label.toLowerCase()).join(" or ") : "";
      matchEl.textContent = `${it.n} · ${it.name}${choice} · ${money(it.price)}`;
    } else if (numbers.some(n => n.startsWith(typed))) {
      matchEl.textContent = "Keep typing…";
    } else {
      matchEl.textContent = `There's no number ${typed} on the menu.`;
    }
  }
  function press(k) {
    if (k === "back") { typed = fresh ? "" : typed.slice(0, -1); fresh = false; return showTyped(); }
    if (k === "add") {
      const it = items.get(typed);
      if (!it) return;
      addLine(it.key);
      typed = ""; fresh = false;
      return showTyped(`Added ${label(it)}. Next number?`);
    }
    if (fresh) { typed = ""; fresh = false; }
    if (typed.length >= 3) return;
    typed += k;
    showTyped();
  }
  $$("[data-key]").forEach(b => b.addEventListener("click", () => press(b.dataset.key)));
  if (typeIn) {
    typeIn.addEventListener("input", () => { typed = typeIn.value.replace(/\D/g, "").slice(0, 3); fresh = false; showTyped(); });
    typeIn.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); press("add"); typeIn.value = ""; } });
  }

  /* ---------- The ticket ---------- */
  const linesEl = $("[data-lines]"), emptyEl = $("[data-empty]"), totalRow = $("[data-total-row]"), totalEl = $("[data-total]");
  const whoEl = $("[data-who]"), nameEl = $("[data-name]"), sendEl = $("[data-send]"), sayEl = $("[data-say]");
  const sayDefault = sayEl.innerHTML;
  let lines = [];
  try { lines = (JSON.parse(localStorage.getItem("tk-order")) || []).filter(l => items.has(l.key)); } catch (e) { lines = []; }

  function save() { try { localStorage.setItem("tk-order", JSON.stringify(lines)); } catch (e) { /* private mode: the ticket just won't persist */ } }
  function addLine(key, opt = 0) {
    const found = lines.find(l => l.key === key && l.opt === opt);
    if (found) found.qty += 1; else lines.push({ key, opt, qty: 1 });
    render();
  }
  const total = () => lines.reduce((s, l) => s + priceOf(items.get(l.key), l.opt) * l.qty, 0);
  const count = () => lines.reduce((s, l) => s + l.qty, 0);

  function render() {
    linesEl.textContent = "";
    lines.forEach((l, i) => {
      const it = items.get(l.key);
      const li = document.createElement("li");
      li.className = "line";
      const qty = document.createElement("div");
      qty.className = "qty";
      const less = document.createElement("button");
      less.type = "button"; less.textContent = "−"; less.setAttribute("aria-label", `One less ${label(it)}`);
      less.addEventListener("click", () => { l.qty -= 1; if (l.qty < 1) lines.splice(i, 1); render(); });
      const out = document.createElement("output");
      out.textContent = l.qty;
      const more = document.createElement("button");
      more.type = "button"; more.textContent = "+"; more.setAttribute("aria-label", `One more ${label(it)}`);
      more.addEventListener("click", () => { l.qty += 1; render(); });
      qty.append(less, out, more);
      const nm = document.createElement("div");
      nm.className = "line-name";
      nm.textContent = it.name;
      if (it.n) { const s = document.createElement("small"); s.textContent = "No. " + it.n; nm.prepend(s); }
      if (it.opts.length) {
        const sel = document.createElement("select");
        sel.setAttribute("aria-label", `Choice for ${label(it)}`);
        it.opts.forEach((o, k) => { const op = new Option(o.price !== it.price ? `${o.label}, ${money(o.price)}` : o.label, k); sel.append(op); });
        sel.value = l.opt;
        sel.addEventListener("change", () => {
          const opt = Number(sel.value), twin = lines.find(x => x !== l && x.key === l.key && x.opt === opt);
          if (twin) { twin.qty += l.qty; lines.splice(lines.indexOf(l), 1); } else l.opt = opt;
          render();
        });
        nm.append(sel);
      }
      const pr = document.createElement("span");
      pr.className = "line-pr";
      pr.textContent = money(priceOf(it, l.opt) * l.qty);
      li.append(qty, nm, pr);
      linesEl.append(li);
    });
    const has = lines.length > 0;
    emptyEl.hidden = has; totalRow.hidden = !has; whoEl.hidden = !has; sendEl.hidden = !has;
    totalEl.textContent = money(total());
    save();
    bar();
  }

  function orderText() {
    const rows = lines.map(l => {
      const it = items.get(l.key), o = it.opts[l.opt];
      return `${l.qty} x ${label(it)}${o ? " (" + o.label + ")" : ""}, ${money(priceOf(it, l.opt) * l.qty)}`;
    });
    const who = nameEl.value.trim();
    return ["Turks Kebab order for pickup", ...rows, `Total at menu prices: ${money(total())}`, who ? `Name: ${who}` : ""].filter(Boolean).join("\n");
  }
  $("[data-copy]").addEventListener("click", async () => {
    const text = orderText();
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.append(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove();
    }
    sayEl.textContent = ok ? "Order copied. Read it out when you call, or paste it into a message." : "Copying didn't work here. Your order is listed above to read out when you call.";
    clearTimeout(sayEl._t);
    sayEl._t = setTimeout(() => { sayEl.innerHTML = sayDefault; }, 6000);
  });

  function flash(btn) {
    btn.classList.add("is-done");
    setTimeout(() => btn.classList.remove("is-done"), 500);
  }

  /* ---------- Phone bar: shows the order while the pad is off screen ---------- */
  const barEl = $("[data-bar]"), pad = $("[data-pad]");
  let padSeen = false;
  function bar() {
    const has = lines.length > 0;
    barEl.hidden = !has;
    document.body.style.paddingBottom = has && innerWidth < 900 ? "80px" : "";
    if (!has) return;
    const c = count();
    $("[data-bar-count]").textContent = c + (c === 1 ? " item" : " items");
    $("[data-bar-total]").textContent = money(total());
    barEl.classList.toggle("is-away", padSeen);
  }
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { es.forEach(e => { padSeen = e.isIntersecting; }); bar(); }, { threshold: 0.15 }).observe(pad);
  }
  addEventListener("resize", bar);

  /* ---------- Hot sauce tabs and the side of sauce ---------- */
  const tabs = $$('[role="tab"]');
  function pick(t, focus) {
    tabs.forEach(x => {
      const on = x === t;
      x.setAttribute("aria-selected", on);
      x.tabIndex = on ? 0 : -1;
      $("#" + x.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => pick(t));
    t.addEventListener("keydown", e => {
      const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
      if (k === undefined) return;
      e.preventDefault();
      pick(tabs[(k + tabs.length) % tabs.length], true);
    });
  });
  const sauceBtn = $("[data-add-sauce]");
  sauceBtn.addEventListener("click", () => {
    addLine("97");
    const was = sauceBtn.textContent;
    sauceBtn.textContent = "Added to your order";
    setTimeout(() => { sauceBtn.textContent = was; }, 1800);
  });

  /* ---------- Open now, in island time (America/Grand_Turk) ---------- */
  function island() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), mins: Number(p.hour) * 60 + Number(p.minute), date: `${p.year}-${p.month}-${p.day}` };
  }
  function openLine() {
    const { day, mins } = island(), el = $("[data-open]");
    const workday = day >= 1 && day <= 6, open = workday && mins >= 660 && mins < 1380;
    let text;
    if (open) text = "Open now until 11 pm";
    else if (workday && mins < 660) text = "Opens today at 11 am";
    else if (day >= 1 && day <= 5) text = "Closed now, opens tomorrow at 11 am";
    else text = "Closed now, opens Monday at 11 am";
    el.textContent = text;
    el.classList.toggle("is-open", open);
  }
  openLine();
  setInterval(openLine, 60000);

  /* ---------- Groups of ten or more: the coupon becomes an email ---------- */
  const form = $("[data-group]"), gMsg = $("[data-g-msg]"), field = n => form.elements.namedItem(n);
  field("date").min = island().date;
  form.addEventListener("submit", e => {
    e.preventDefault();
    const size = Number(field("size").value), date = field("date").value, name = field("name").value.trim();
    let problem = "";
    if (!size || size < 10) problem = "Reservations are for groups of 10 or more. Smaller groups can just come by.";
    else if (!date) problem = "Pick a date for your group.";
    else if (date < island().date) problem = "That date has passed. Pick another one.";
    else if (new Date(date + "T12:00").getDay() === 0) problem = "Turks Kebab is closed on Sundays. Pick another day.";
    else if (!name) problem = "Add your name so the family knows who's asking.";
    if (problem) {
      gMsg.textContent = problem;
      const bad = !size || size < 10 ? field("size") : !date || problem.includes("date") || problem.includes("Sunday") ? field("date") : field("name");
      bad.setAttribute("aria-invalid", "true");
      bad.focus();
      return;
    }
    $$("[aria-invalid]", form).forEach(x => x.removeAttribute("aria-invalid"));
    const nice = new Date(date + "T12:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    const body = `Hello Turks Kebab,\n\nI'd like to reserve for a group of ${size} on ${nice} at ${field("time").value}.\n\nName: ${name}\n\nThank you!`;
    location.href = `mailto:turkskebaboffice@gmail.com?subject=${encodeURIComponent(`Group reservation: ${size} people, ${nice}`)}&body=${encodeURIComponent(body)}`;
    gMsg.textContent = `Your email app should open with the request for ${size} on ${nice}. Just press send.`;
  });

  /* ---------- Hero: the cone in slices, and the food changing inside the photo cone ---------- */
  const cone = $(".hero-cone"), sym = $("#cone");
  if (cone && sym) {
    cone.innerHTML = sym.innerHTML;
    $$("polygon", cone).forEach((p, i) => p.style.setProperty("--i", i));
  }
  const pics = $$("[data-fade] img");
  if (!reduce && pics.length > 1) {
    let at = 0;
    setInterval(() => {
      if (document.hidden) return;
      pics[at].classList.remove("is-on");
      at = (at + 1) % pics.length;
      pics[at].classList.add("is-on");
    }, 6000);
  }

  /* ---------- Entrances: each section's parts rise in, once ---------- */
  const groups = [
    [".hero-say h1", ".hero-say .lead", ".hero-act"],
    [".intro p"],
    [".order-head h2", ".order-head .lead"],
    [".pad"],
    [".sauce-pic", ".tabs", ".sauce-mid", ".sauce-act"],
    [".story-panel h2", ".story-text > div", ".story-text .btn", ".story-pic"],
    [".rev-pic", ".rev-quote", ".rev-small"],
    [".score", ".rev-more blockquote", ".leave"],
    [".faq h2", ".tiles details"],
    [".coupon-say", ".coupon-fields"],
    [".find > div"],
    [".blocks span"],
  ];
  const watched = [];
  groups.forEach(g => {
    let k = 0;
    g.forEach(sel => $$(sel).forEach(el => { el.classList.add("rv"); el.style.setProperty("--d", Math.min(k++, 8) * 75 + "ms"); watched.push(el); }));
  });
  $$(".cat").forEach(c => { [$(".cat-head", c), ...$$(".items li", c).slice(0, 6)].filter(Boolean).forEach((el, k) => { el.classList.add("rv"); el.style.setProperty("--d", k * 70 + "ms"); watched.push(el); }); });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    watched.forEach(el => io.observe(el));
  }
  setTimeout(() => watched.forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight) el.classList.add("in"); }), 2500);

  showTyped();
  render();
})();
