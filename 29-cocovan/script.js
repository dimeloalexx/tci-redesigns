// Cocovan: draws the Airstream's rivets and lights, renders the real menu, runs "Feed the table" and the open sign in Grace Bay time.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const NS = "http://www.w3.org/2000/svg";
  const money = n => "$" + n.toFixed(2);

  /* ---------- the Airstream: rivets along every seam, string lights on the awning ---------- */
  const rivets = $("[data-rivets]");
  if (rivets) {
    const dot = (x, y) => { const c = document.createElementNS(NS, "circle"); c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", 2.4); rivets.append(c); };
    for (const y of [92, 148, 206, 264]) for (let x = 36; x < 970; x += 21) dot(x, y - 6);
    for (const x of [150, 318, 720, 860]) for (let y = 52; y < 336; y += 21) dot(x + 6, y);
  }
  const lights = $("[data-lights]");
  if (lights) {
    const wire = document.createElementNS(NS, "path");
    wire.setAttribute("d", "M346 66 Q544 104 742 66");
    lights.append(wire);
    for (let i = 1; i < 12; i++) {
      const t = i / 12, x = (1 - t) ** 2 * 346 + 2 * (1 - t) * t * 544 + t * t * 742, y = (1 - t) ** 2 * 66 + 2 * (1 - t) * t * 104 + t * t * 66;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", x.toFixed(1)); c.setAttribute("cy", (y + 7).toFixed(1)); c.setAttribute("r", 6.5);
      c.style.animation = reduce ? "none" : `twinkle ${2.6 + (i % 4) * .7}s ${i * .23}s ease-in-out infinite`;
      lights.append(c);
    }
    const st = document.createElement("style");
    st.textContent = "@keyframes twinkle{0%,100%{opacity:1}50%{opacity:.45}}";
    document.head.append(st);
  }

  /* ---------- the window: dishes take turns on the counter ---------- */
  const dishes = $$(".dish");
  if (dishes.length > 1 && !reduce) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      dishes[i].classList.remove("is-on");
      i = (i + 1) % dishes.length;
      dishes[i].classList.add("is-on");
    }, 5600);
  }

  /* ---------- the name fills the width ---------- */
  const fit = $("[data-fit]");
  const sizeName = () => {
    if (!fit) return;
    const root = document.documentElement, pad = parseFloat(getComputedStyle(fit.parentElement).paddingLeft) * 2;
    root.style.setProperty("--ns", "100px");
    const w = fit.getBoundingClientRect().width, room = fit.parentElement.clientWidth - pad;
    root.style.setProperty("--ns", Math.min(100 * room / w, 320) + "px");
  };
  sizeName();
  document.fonts && document.fonts.ready.then(sizeName);
  addEventListener("resize", sizeName);

  /* ---------- open sign and footer clock, in Grace Bay time ---------- */
  const tciNow = () => {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date());
    const get = t => +parts.find(p => p.type === t).value;
    return { h: get("hour"), m: get("minute") };
  };
  const sign = $("[data-open]"), clock = $("[data-clock]");
  const tick = () => {
    const { h, m } = tciNow();
    if (sign) {
      const open = h >= 11 && h < 21;
      sign.classList.toggle("is-open", open);
      sign.textContent = open ? (h === 20 ? `Open now, last hour: the window closes at 9 pm` : "Open now until 9 pm") : h < 11 ? "Closed now. The window opens today at 11 am" : "Closed now. The window opens tomorrow at 11 am";
    }
    if (clock) clock.textContent = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"} in Grace Bay`;
  };
  tick();
  setInterval(tick, 30000);

  /* ---------- the menu, as printed on cocovan.tc ---------- */
  const MENU = [
    { id: "m-tacos", name: "Tacos", note: "On a flour tortilla, or swap for a corn tortilla or a lettuce cup.", items: [
      ["Spicy and Crispy Steak Tacos", "2 for $20 · 3 for $30", "Sesame, sweet chili, sriracha, creamy chili, green onion, cucumber, radish, lettuce."],
      ["Mahi Tacos", "2 for $20 · 3 for $30", "Grilled or fried. Fresh guacamole, jalapeño crema, green onion, cucumber, tropical salsa, lettuce.", "Vegetarian option available"],
      ["“Peking” Duck Tacos", "2 for $20 · 3 for $30", "Shredded duck, hoisin sauce, green onion and cucumber."],
      ["Chicken Taquitos", "3 for $15", "Flour tortilla, pepper jack, pickled onion, cilantro, with a side of guac and spicy crema."],
    ] },
    { id: "m-sandwiches", name: "Sandwiches", note: "On a homemade, sesame-free bun, with fries, rice, side salad or coleslaw. Seasoned fries +$1, poutine +$4.", items: [
      ["Buttermilk Chicken Sandwich", "$20", "Fried or grilled, with pickles, zesty coleslaw and tangy remoulade."],
      ["Korean Chicken Sandwich", "$20", "Fried chicken thigh, honey gochujang BBQ sauce, pickles, cabbage, jalapeño, crispy wonton chips, spicy crema."],
      ["Cocovan Cheese Burger", "$21 · double $25", "4 oz chuck, brisket and short rib patty, special sauce, caramelized onions, lettuce, tomato, pickle, American cheese."],
      ["Beyond Veggie Burger", "$20", "Special sauce, caramelized onions, lettuce, tomato, pickle, American cheese.", "Vegetarian"],
      ["Grouper Sandwich", "$20", "Blackened or fried, with lettuce, tomato and tangy remoulade."],
    ] },
    { id: "m-share", name: "Small and shareable", items: [
      ["Tuna Tartar", "2 for $20 · 3 for $30", "On Asian crispy rice with sesame and panko, spicy crema, cilantro."],
      ["Fried Mac & Cheese Balls", "3 for $9 · 6 for $18", "Served with spicy crema."],
      ["“Big Mac” Cheeseburger Egg Roll", "$6 · 3 for $15", "The burger, rolled up and fried."],
      ["Poutine Fries", "$12", "Wisconsin cheese curds and demi-glace gravy."],
      ["Steak Cut Fries", "$6 · seasoned $7", "Plain or seasoned."],
      ["Jasmine Rice or Zesty Coleslaw", "$4", "On the side."],
    ] },
    { id: "m-greens", name: "Salads and veggies", items: [
      ["Tomato, Avocado, Feta Salad", "$14", "Spring mix, cucumber, cherry tomato, avocado, fried onion, feta, honey dijon vinaigrette. Add mahi or chicken +$7."],
      ["Spicy Falafel Bowl", "$18", "Lemon yogurt tahini dressing, jasmine rice, lettuce, jalapeño, pico de gallo, cucumber, pickled onion.", "Vegetarian"],
      ["Simple Side Salad", "$6", "Iceberg, red onion, cucumber and tomato, with ranch, bleu cheese, honey dijon or oil and vinegar."],
      ["Buffalo Cauliflower", "$15", "With a side of blue cheese dressing.", "Vegetarian"],
    ] },
    { id: "m-kids", name: "Kids", items: [
      ["Kids Hot Dog & Fries", "$10", "A hot dog with fries."],
      ["Kids Chicken or Steak Quesadilla & Fries", "$15", "Chicken or steak, with fries."],
    ] },
    { id: "m-sweet", name: "Dessert", items: [
      ["Caicos Churros", "$15", "With liquid chocolate and vanilla soft serve."],
      ["Ice Cream Sandwich", "$9", "Vanilla, strawberry or chocolate with rainbow sprinkles."],
      ["Milkshake", "$9 · boozy +$5", "Vanilla, strawberry or chocolate with rainbow sprinkles and whipped cream."],
      ["Ice Cream Scoops", "$4", "A cup of vanilla, chocolate or strawberry."],
    ] },
  ];
  const carton = `<svg viewBox="0 0 56 44" aria-hidden="true"><path class="carton-a" d="M4 14 L52 14 L46 40 L10 40 Z"/><path class="carton-b" d="M12 14 h6 l-2 26 h-5 Z M25 14 h6 v26 h-6 Z M38 14 h6 l-3 26 h-5 Z"/><path class="carton-a" d="M4 14 L52 14 L46 40 L10 40 Z" fill="none"/><path d="M14 14 C16 6 22 4 28 8 C33 3 41 5 43 14" fill="none" stroke="#16130a" stroke-width="2.5" stroke-linecap="round"/></svg>`;
  const body = $("[data-menu]");
  if (body) {
    body.innerHTML = MENU.map(c => `
      <section class="cat" id="${c.id}" aria-labelledby="${c.id}-h">
        <div class="cat-head"><h3 id="${c.id}-h">${c.name}</h3><p>${c.items.length} ${c.items.length === 1 ? "item" : "items"}</p></div>
        ${c.note ? `<p class="cat-note">${c.note}</p>` : ""}
        <ul class="items">${c.items.map(([n, p, d, t]) => `<li class="item">${carton}<div><div class="item-top"><h4>${n}</h4><span>${p}</span></div><p>${d}${t ? ` <b class="tag">${t}.</b>` : ""}</p></div></li>`).join("")}</ul>
      </section>`).join("") + `<p class="menu-foot">Menu subject to change with availability and freshness. Call 649 231 8226 to order.</p>`;
  }

  /* ---------- Feed the table ---------- */
  const TACOS = ["Spicy and Crispy Steak Tacos", "Mahi Tacos", "“Peking” Duck Tacos"];
  const SANDW = [["Cocovan Cheese Burger", 21], ["Buttermilk Chicken Sandwich", 20], ["Korean Chicken Sandwich", 20], ["Grouper Sandwich", 20]];
  const VEG = { light: [["Tomato, Avocado, Feta Salad", 14], ["Spicy Falafel Bowl", 18]], other: [["Spicy Falafel Bowl", 18], ["Beyond Veggie Burger", 20]] };
  const SHARE = { meat: [["Fried Mac & Cheese Balls, 6 for $18", 18], ["“Big Mac” Egg Rolls, 3 for $15", 15], ["Poutine Fries", 12], ["Tuna Tartar, 3 for $30", 30]], veg: [["Buffalo Cauliflower", 15], ["Poutine Fries", 12], ["Fried Mac & Cheese Balls, 6 for $18", 18]] };
  const KIDS = [["Kids Hot Dog & Fries", 10], ["Kids Chicken Quesadilla & Fries", 15]];

  const state = { adults: 4, kids: 0, hunger: "hungry", lean: "tacos" };
  try { Object.assign(state, JSON.parse(localStorage.getItem("cv-table") || "{}")); } catch {}
  const save = () => { try { localStorage.setItem("cv-table", JSON.stringify(state)); } catch {} };

  const order = () => {
    const lines = new Map();
    const add = (label, price, qty = 1) => { const l = lines.get(label) || { label, price, qty: 0 }; l.qty += qty; lines.set(label, l); };
    const { adults: A, kids: K, hunger: H, lean: L } = state;
    for (let i = 0; i < A; i++) {
      if (L === "tacos") H === "light" ? add(`${TACOS[i % 3]}, 2 for $20`, 20) : add(`${TACOS[i % 3]}, 3 for $30`, 30);
      else if (L === "sandwiches") {
        const [n, p] = SANDW[i % SANDW.length];
        if (n === "Cocovan Cheese Burger" && H === "starving") add("Cocovan Cheese Burger, double", 25); else add(n, p);
        if (H === "starving") add("Poutine instead of fries, +$4", 4);
      } else {
        const list = H === "light" ? VEG.light : VEG.other, [n, p] = list[i % list.length];
        add(n, p);
      }
    }
    const shares = H === "light" ? 0 : H === "hungry" ? Math.ceil(A / 4) : Math.ceil(A / 2);
    const pool = L === "veggie" ? SHARE.veg : SHARE.meat;
    for (let i = 0; i < shares; i++) add(...pool[i % pool.length]);
    for (let i = 0; i < K; i++) add(...KIDS[i % KIDS.length]);
    const sweet = H === "light" ? 0 : Math.ceil((A + K) / 4);
    if (sweet) add("Caicos Churros", 15, sweet);
    if (H === "light" && K) add("Ice Cream Scoops", 4, K);
    const list = [...lines.values()];
    const sub = list.reduce((s, l) => s + l.price * l.qty, 0), tax = sub * .12, svc = sub * .10;
    return { list, sub, tax, svc, total: sub + tax + svc };
  };

  const ticket = $("[data-ticket]");
  const render = (animate = true) => {
    $$("[data-out]").forEach(o => { o.textContent = state[o.dataset.out]; });
    $$("[data-seg]").forEach(g => $$("button", g).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.v === state[g.dataset.seg]))));
    const o = order();
    $("[data-lines]").innerHTML = o.list.map(l => `<li><span>${l.qty > 1 ? l.qty + " × " : ""}${l.label}</span><b>${money(l.price * l.qty)}</b></li>`).join("");
    $("[data-sub]").textContent = money(o.sub);
    $("[data-tax]").textContent = money(o.tax);
    $("[data-svc]").textContent = money(o.svc);
    $("[data-total]").textContent = money(o.total);
    const heads = state.adults + state.kids;
    $("[data-each]").textContent = `About ${money(o.total / heads)} a head for ${heads} ${heads === 1 ? "person" : "people"}.`;
    if (animate && ticket && !reduce) { ticket.classList.remove("is-new"); void ticket.offsetWidth; ticket.classList.add("is-new"); }
    return o;
  };
  if (ticket) {
    $$("[data-step]").forEach(b => b.addEventListener("click", () => {
      const k = b.dataset.step, lim = k === "adults" ? [1, 20] : [0, 12];
      state[k] = Math.max(lim[0], Math.min(lim[1], state[k] + Number(b.dataset.d)));
      save(); render();
    }));
    $$("[data-seg] button").forEach(b => b.addEventListener("click", () => { state[b.closest("[data-seg]").dataset.seg] = b.dataset.v; save(); render(); }));
    render(false);

    const note = $("[data-copied]"), orig = note.textContent;
    $("[data-copy]").addEventListener("click", async () => {
      const o = order();
      const text = `Cocovan order for ${state.adults} ${state.adults === 1 ? "grown-up" : "grown-ups"}${state.kids ? ` and ${state.kids} ${state.kids === 1 ? "kid" : "kids"}` : ""}:\n` +
        o.list.map(l => `${l.qty} × ${l.label}`).join("\n") + `\nFood ${money(o.sub)}, about ${money(o.total)} with 12% tax and 10% service.`;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        const ta = Object.assign(document.createElement("textarea"), { value: text });
        ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.append(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch {} ta.remove();
      }
      $("[data-copy]").dataset.last = text;
      note.textContent = ok ? "Order copied. Call 649 231 8226 and read it to the window." : "Could not copy here. Call 649 231 8226 and read the ticket above.";
      clearTimeout(note._t); note._t = setTimeout(() => { note.textContent = orig; }, 6000);
    });
  }

  /* ---------- one question open at a time (for browsers without details[name]) ---------- */
  $$(".qs details").forEach(d => d.addEventListener("toggle", () => { if (d.open) $$(".qs details").forEach(o => { if (o !== d) o.open = false; }); }));

  /* ---------- entrances: heading, then text, then picture ---------- */
  const groups = $$("section, .menu-intro");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$(".reveal", e.target).forEach((el, i) => { el.style.setProperty("--d", i * 80 + "ms"); el.classList.add("is-in"); });
      io.unobserve(e.target);
    }), { rootMargin: "0px 0px -12% 0px" });
    groups.forEach(g => io.observe(g));
    $$(".cat").forEach(c => { $$(".item", c).forEach(el => el.classList.add("reveal")); });
    $$(".cat").forEach(g => io.observe(g));
  } else $$(".reveal").forEach(el => el.classList.add("is-in"));

  /* ---------- phone bar: away while the hero or the footer is on screen ---------- */
  const bar = $("[data-bar]");
  if (bar && "IntersectionObserver" in window) {
    const seen = new Set();
    const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? seen.add(e.target) : seen.delete(e.target)); bar.classList.toggle("is-away", seen.size > 0); });
    [$(".hero"), $(".band"), $(".foot")].forEach(el => el && io.observe(el));
  }
})();
