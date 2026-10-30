// Top O' The Cove: open line and clock in Providenciales time, the take-a-number picker, the loaf cut across tiles, catering mail.
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const phone = matchMedia("(max-width: 899px)");
  const TZ = "America/Grand_Turk";
  const CATERING = "catering@topothecove.com";
  // Opening and closing, minutes after midnight, Sunday first
  const HOURS = [[420, 840], [420, 1020], [420, 1020], [420, 1020], [420, 1020], [420, 1020], [420, 900]];

  function tci() {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(new Date()).map(x => [x.type, x.value]));
    return { dow: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday), min: (+p.hour % 24) * 60 + +p.minute };
  }
  const clock = min => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""} ${h < 12 ? "am" : "pm"}`; };
  const clockFull = min => { const h = Math.floor(min / 60) % 24, m = min % 60; return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`; };

  // ---------- Open line and the footer clock ----------
  const openEl = $("[data-open]"), clockEl = $("[data-clock]");
  function paintTime() {
    const { dow, min } = tci();
    const [o, c] = HOURS[dow];
    let text;
    if (min < o) text = `Opens today at ${clock(o)}`;
    else if (min < c) text = `Open now until ${clock(c)}` + (dow === 0 ? ". Breakfast all day today" : "");
    else text = `Closed now. Opens ${dow === 6 ? "Sunday" : "tomorrow"} at ${clock(HOURS[(dow + 1) % 7][0])}`;
    if (openEl) openEl.textContent = text;
    if (clockEl) clockEl.textContent = clockFull(min);
  }
  paintTime();
  setInterval(paintTime, 30000);

  // ---------- Big words fit their tiles ----------
  function fit(el) {
    if (!el) return;
    el.style.fontSize = "";
    const box = el.parentElement;
    const cs = getComputedStyle(box);
    const avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const lines = el.children.length ? [...el.children] : [el];
    const widest = Math.max(...lines.map(s => { const r = document.createRange(); r.selectNodeContents(s); return r.getBoundingClientRect().width; }));
    if (widest > avail) el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * avail / widest * 0.97) + "px";
  }
  const fitAll = () => { fit($("[data-fit]")); fit($("[data-fit-mark]")); fit($(".giant")); };
  fitAll();
  if (document.fonts) { document.fonts.ready.then(fitAll); document.fonts.addEventListener?.("loadingdone", fitAll); }
  let rz;
  addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { fitAll(); cutMosaic(); }, 120); });

  // ---------- Entrances ----------
  $$(".board:not(.hero):not(.mosaic) > .t, .qs > details").forEach(el => el.classList.add("rv"));
  const rv = $$(".rv");
  rv.forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains("rv"));
    el.style.setProperty("--d", (Math.min(sibs.indexOf(el), 5) * 80) + "ms");
  });
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(el => io.observe(el));
    setTimeout(() => rv.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("in"); }), 2500);
  } else rv.forEach(el => el.classList.add("in"));

  // ---------- The loaf, cut across the board ----------
  const mosaic = $("[data-mosaic]");
  const IMG_W = 1600, IMG_H = 940;
  let layout = "";
  function cutMosaic() {
    if (!mosaic) return;
    const want = phone.matches ? "phone" : "desk";
    const cols = want === "phone" ? 3 : 6, rows = want === "phone" ? 7 : 4;
    const taken = 6;
    if (layout !== want) {
      $$(".piece", mosaic).forEach(p => p.remove());
      for (let i = 0; i < cols * rows - taken; i++) {
        const d = document.createElement("div");
        d.className = "piece";
        d.setAttribute("aria-hidden", "true");
        mosaic.append(d);
      }
      layout = want;
    }
    const gap = parseFloat(getComputedStyle(mosaic).columnGap) || 8;
    const t = (mosaic.clientWidth - gap * (cols - 1)) / cols;
    const bw = mosaic.clientWidth, bh = rows * t + (rows - 1) * gap;
    const s = Math.max(bw / IMG_W, bh / IMG_H);
    const iw = IMG_W * s, ih = IMG_H * s, ox = (bw - iw) / 2, oy = (bh - ih) / 2;
    $$(".piece", mosaic).forEach(p => {
      const c = Math.round(p.offsetLeft / (t + gap)), r = Math.round(p.offsetTop / (t + gap));
      p.style.setProperty("--bs", `${iw}px ${ih}px`);
      p.style.setProperty("--bp", `${ox - c * (t + gap)}px ${oy - r * (t + gap)}px`);
    });
    mosaic.classList.add("is-cut");
  }
  cutMosaic();

  // ---------- Take a number ----------
  const MENU = [
    ["Big Breakfast", "Three eggs any style, half grilled tomato, hash browns, Irish bacon, sausage and toast", 10.95, "breakfast", "hot", "breakfast"],
    ["Two Pancakes, Two Eggs, Two Strips of Bacon", "The whole morning on one plate", 9.95, "breakfast", "hot", "breakfast"],
    ["Steak and Eggs", "Philly steak and eggs on a fresh baked sub roll", 12.95, "breakfast", "hot", "steak"],
    ["Breakfast Burrito", "Eggs, beans, cheese and salsa in a wrap", 9.95, "breakfast", "hot", "breakfast"],
    ["Egg, Ham and Cheese Sub", "On a fresh baked sub roll", 9.95, "breakfast", "hot", "breakfast"],
    ["Omelet", "Ham and cheese, served with toast", 7.95, "breakfast", "hot", "breakfast"],
    ["French Toast, Pancakes or Waffles", "Your pick of the three", 5.95, "breakfast", "hot", "breakfast"],
    ["Two Eggs Any Style with Toast", "Add bacon or sausage for 2.00", 5.95, "breakfast", "hot", "breakfast"],
    ["Fried Egg Sandwich", "Simple and quick", 6.00, "breakfast", "hot", "breakfast"],
    ["Bageleggle", "Egg, ham and cheese on a New York bagel", 9.95, "both", "hot", "bagel"],
    ["Smoked Salmon Bagel", "Smoked salmon and cream cheese with onion and tomato", 10.95, "both", "cold", "bagel"],
    ["Turkey Bagel", "Turkey, lettuce, tomato and cheese on a bagel", 7.95, "both", "cold", "bagel"],
    ["Black Forest Bagel", "Black forest ham on a bagel with cream cheese", 5.00, "both", "cold", "bagel"],
    ["Tuna Bagel", "Tuna salad with lettuce and tomato on a bagel", 5.00, "both", "cold", "bagel"],
    ["Toasted Bagel with Cream Cheese", "Add lettuce and tomato for .50", 2.95, "both", "hot", "bagel"],
    ["Hot Pastrami", "Mounds of New York pastrami with melted swiss on rye", 9.95, "lunch", "hot", "pastrami"],
    ["Reuben", "Corned beef, swiss, sauerkraut and russian dressing on rye", 9.95, "lunch", "hot", "reuben"],
    ["Famous Steak and Onions", "Philly steak, cheese, onions and green peppers on a fresh baked sub roll", 12.95, "lunch", "hot", "steak"],
    ["Gyro", "Lamb and beef, lettuce and tomato on an oversized Greek pita with tzatziki", 10.95, "lunch", "hot", "gyro"],
    ["Meatball Hoagie", "Italian meatballs in sauce with parmesan and mozzarella on a fresh baked roll", 10.95, "lunch", "hot", "meatball"],
    ["Jumbo Deli Bacon Cheeseburger", "100% lean beef with cheese, bacon, onion, lettuce and tomato", 14.95, "lunch", "hot", "counter"],
    ["Hot Roast Beef Sub", "From the deli counter, served hot", 10.95, "lunch", "hot", "counter"],
    ["Grilled Ham and Cheese", "A deli classic off the grill", 6.95, "lunch", "hot", "counter"],
    ["Blackened Fish Wrap", "Island fish, blackened and wrapped", 10.95, "lunch", "hot", "counter"],
    ["Grilled Chicken Caesar Sub", "Grilled chicken and Caesar on a sub roll", 10.95, "lunch", "hot", "counter"],
    ["A slice of pizza", "New York style, by the slice", 3.95, "lunch", "hot", "pizza"],
    ["A large pizza", "The whole pie, to share or not", 16.95, "lunch", "hot", "pizza"],
    ["Classic Supreme", "Genoa and hard salami, pepperoni, provolone, parmesan, lettuce, tomato, onion, oil and vinegar", 9.95, "lunch", "cold", "counter"],
    ["Club Sub", "Turkey, ham and roast beef with cheese, lettuce and tomato", 9.95, "lunch", "cold", "counter"],
    ["Corned Beef or Pastrami Sub", "New York style, hot or cold. Cold today", 8.95, "lunch", "cold", "pastrami"],
    ["Smoked Turkey Breast Sub", "From the deli counter", 7.95, "lunch", "cold", "counter"],
    ["Black Forest Ham Sub", "From the deli counter", 8.95, "lunch", "cold", "counter"],
    ["Prosciutto Sub", "Thin-sliced prosciutto on a fresh roll", 9.50, "lunch", "cold", "counter"],
    ["BLT Sub", "Bacon, lettuce and tomato", 10.95, "lunch", "cold", "counter"],
    ["Salami or Pepperoni Sub", "From the deli counter", 6.95, "lunch", "cold", "counter"],
    ["Tuna Salad Sub", "House tuna salad on a fresh roll", 9.95, "lunch", "cold", "counter"],
    ["Egg Salad Sub", "House egg salad on a fresh roll", 9.95, "lunch", "cold", "counter"],
    ["Chef Salad Platter", "Lettuce, tomato, onion, ham and cheese with your choice of dressing", 9.95, "lunch", "cold", "salad"],
    ["Tuna or Chicken Salad Platter", "On lettuce and tomatoes, with crackers", 9.95, "lunch", "cold", "salad"],
    ["Egg Salad Platter", "Fresh egg salad on lettuce and tomato with a warm croissant", 9.95, "lunch", "cold", "salad"],
  ].map(([dish, desc, price, meal, temp, pic]) => ({ dish, desc, price, meal, temp, pic }));
  const PICS = { breakfast: "Eggs and bacon", steak: "A Philly steak sandwich", bagel: "A bagel with smoked salmon", pastrami: "Pastrami on rye", reuben: "A Reuben on rye", gyro: "Gyro meat on pita", meatball: "A meatball sub", counter: "The deli counter", pizza: "A New York slice", salad: "A chef salad" };

  const KEY = "tc-ticket";
  let st = { meal: "any", temp: "any", under: false, num: 0, last: "" };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) { /* storage blocked */ }
  if (!st.num) st.num = 20 + Math.floor(Math.random() * 60);
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* storage blocked */ } };

  const segs = $$("[data-seg]");
  function paintSegs() {
    segs.forEach(seg => $$("button", seg).forEach(b => b.setAttribute("aria-pressed", b.dataset.v === st[seg.dataset.seg])));
    const u = $("[data-under]");
    if (u) u.checked = !!st.under;
  }
  segs.forEach(seg => seg.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    st[seg.dataset.seg] = b.dataset.v;
    paintSegs();
    save();
  }));
  $("[data-under]")?.addEventListener("change", e => { st.under = e.target.checked; save(); });
  paintSegs();

  const ticket = $("[data-ticket]");
  const out = { num: $("[data-num]"), dish: $("[data-dish]"), desc: $("[data-desc]"), price: $("[data-price]"), tag: $("[data-tag]"), pic: $("[data-tk-pic]") };
  function matches(it) {
    if (st.meal !== "any" && it.meal !== st.meal && it.meal !== "both") return false;
    if (st.temp !== "any" && it.temp !== st.temp) return false;
    if (st.under && !(it.price < 10)) return false;
    return true;
  }
  function pull() {
    const pool = MENU.filter(matches);
    st.num = st.num >= 99 ? 1 : st.num + 1;
    out.num.textContent = st.num;
    if (!pool.length) {
      out.dish.textContent = "Nothing fits all that";
      out.desc.textContent = "Loosen one of the choices and pull again.";
      out.price.textContent = ""; out.tag.textContent = "";
      ticket.dataset.picked = "";
    } else {
      const choices = pool.length > 1 ? pool.filter(i => i.dish !== st.last) : pool;
      const it = choices[Math.floor(Math.random() * choices.length)];
      st.last = it.dish;
      out.dish.textContent = it.dish;
      out.desc.textContent = it.desc;
      out.price.textContent = "$" + it.price.toFixed(2);
      out.tag.textContent = (it.meal === "both" ? "Breakfast or lunch" : it.meal === "breakfast" ? "Breakfast" : "Lunch") + ", " + it.temp;
      out.pic.src = `assets/${it.pic}.jpg`;
      out.pic.alt = PICS[it.pic];
      ticket.dataset.picked = it.dish;
    }
    save();
    if (!reduce) { ticket.classList.remove("is-out"); void ticket.offsetWidth; ticket.classList.add("is-out"); }
  }
  $("[data-pull]")?.addEventListener("click", pull);
  if (out.num) out.num.textContent = st.num;

  // ---------- Catering by email ----------
  const cater = $("[data-cater]"), cMsg = $("[data-cater-msg]");
  cater?.addEventListener("submit", e => {
    e.preventDefault();
    const el = n => cater.elements.namedItem(n);
    const who = el("name").value.trim(), what = el("what").value.trim();
    if (!who) { cMsg.textContent = "Add your name first."; el("name").focus(); return; }
    if (!what) { cMsg.textContent = "Say the date and roughly how many people."; el("what").focus(); return; }
    const body = `Hi Angela,\n\nI'd like to ask about catering: ${what}.\n\nName: ${who}\n\nThank you!`;
    const href = `mailto:${CATERING}?subject=${encodeURIComponent("Catering request: " + what)}&body=${encodeURIComponent(body)}`;
    cater.dataset.lastMail = href;
    cMsg.textContent = "Your email app should open with the request written.";
    location.href = href;
  });

  // ---------- Phone bar: away over the hero and the picker ----------
  const bar = $("[data-bar]");
  if (bar && "IntersectionObserver" in window) {
    bar.classList.add("is-away");
    bar.hidden = false;
    const vis = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => vis.set(e.target, e.isIntersecting));
      bar.classList.toggle("is-away", [...vis.values()].some(Boolean));
    });
    [$(".hero"), $("#number"), $(".foot")].forEach(el => el && io.observe(el));
  }
})();
