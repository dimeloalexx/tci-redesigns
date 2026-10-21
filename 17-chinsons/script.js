(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "info@chinsonsgrillshack.com";
  const NS = "http://www.w3.org/2000/svg";

  // ---------- The two kitchens, from Chinson's own menu ----------
  // colour = roughly how the dish looks on the plate
  const SIDES = {
    island: {
      cap: "Jerk and BBQ, slow-cooked for hours",
      note: "The jerk and BBQ cook for hours and can sell out for the day. Come early, or order ahead.",
      mains: [["Jerk chicken", "#3b2416"], ["BBQ chicken", "#7a2e14"], ["BBQ pork ribs", "#6b2a12"], ["Pulled pork", "#a0603a"], ["Curry goat", "#c08a2a"], ["Stewed oxtail", "#5b3220"], ["Steamed grouper", "#e6d4ad"], ["Fish and chips", "#d9a441"], ["Conch fritters", "#c98a3c"]],
      sides: [["Rice and peas", "#b48a78"], ["White rice", "#f4f0e6"], ["Fried plantains", "#e2a23a"], ["Festival", "#d9a050"], ["Mac and cheese", "#f2c444"], ["Coleslaw", "#d6e4b4"], ["Country cornbread", "#e7bf5e"], ["Fries", "#e9b949"], ["Salad", "#7fb35a"]],
      just: true,
    },
    wok: {
      cap: "The Chinese side: lemon chicken to lobster Cantonese",
      note: "The Chinese menu runs all day, right next to the grill.",
      mains: [["Lemon chicken", "#f0c43a"], ["Beef and broccoli", "#5a3a26"], ["Shrimp with oyster sauce", "#e8875a"], ["Chicken in mango sauce", "#f2a33a"], ["Chow mein", "#c9934e"], ["Chicken fried rice", "#d9b36a"], ["Lobster Cantonese", "#e0603a"]],
      sides: [["White rice", "#f4f0e6"], ["Fried rice", "#d9b36a"], ["Spring roll", "#d39a4a"], ["Egg roll", "#c98a3c"], ["Fried wontons", "#e2b45a"], ["Crab rangoon", "#efd08a"]],
      just: false,
    },
  };
  let side = "island", main = null, picks = [], just = false;

  const body = document.body, cap = $("[data-stage-cap]"), sideNote = $("[data-side-note]");
  const mainsEl = $("[data-mains]"), sidesEl = $("[data-sides]"), count = $("[data-sides-count]"), justBox = $("[data-just]");
  const food = $("[data-food]"), sum = $("[data-sum]"), order = $("[data-order]");

  function chips(el, list, isMain) {
    el.innerHTML = list.map(([n]) => `<button type="button" aria-pressed="false" data-${isMain ? "main" : "side"}="${n}">${n}</button>`).join("");
  }
  function setSide(s) {
    side = s; main = null; picks = []; just = false; justBox.checked = false;
    body.dataset.side = s;
    $$("[data-side-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sideBtn === s)));
    cap.textContent = SIDES[s].cap; sideNote.textContent = SIDES[s].note;
    chips(mainsEl, SIDES[s].mains, true); chips(sidesEl, SIDES[s].sides, false);
    justBox.closest(".just").hidden = !SIDES[s].just;
    render();
  }
  $$("[data-side-btn]").forEach(b => b.addEventListener("click", () => setSide(b.dataset.sideBtn)));

  mainsEl.addEventListener("click", e => {
    const b = e.target.closest("[data-main]"); if (!b) return;
    main = b.dataset.main; render();
  });
  sidesEl.addEventListener("click", e => {
    const b = e.target.closest("[data-side]"); if (!b || just) return;
    const n = b.dataset.side;
    if (picks.includes(n)) picks = picks.filter(x => x !== n);
    else { picks.push(n); if (picks.length > 2) picks.shift(); }
    render();
  });
  justBox.addEventListener("change", () => { just = justBox.checked; if (just) picks = []; render(); });

  // ---------- Draw the plate ----------
  const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const colour = (list, name) => (list.find(([n]) => n === name) || [, "#ccc"])[1];
  function label(g, x, y, text) {
    const words = text.split(" "), lines = [];
    words.forEach(w => { const l = lines.at(-1); if (l && (l + " " + w).length <= 11) lines[lines.length - 1] = l + " " + w; else lines.push(w); });
    lines.forEach((l, i) => { const t = el("text", { x, y: y + i * 14 - (lines.length - 1) * 7 }); t.textContent = l; g.appendChild(t); });
  }
  function drawPlate() {
    food.innerHTML = "";
    const S = SIDES[side];
    if (!main) return;
    const g = el("g", { class: "food" });
    const big = just || !picks.length;
    const cx = big ? 150 : 122, rx = big ? 82 : 64, ry = big ? 66 : 74;
    g.appendChild(el("ellipse", { cx, cy: 150, rx, ry, fill: colour(S.mains, main), transform: `rotate(-14 ${cx} 150)` }));
    // grill marks stay above and below the label, never across it
    if (/jerk|bbq|ribs/i.test(main)) for (let i = 0; i < 6; i++) g.appendChild(el("rect", { x: cx - 38 + i * 13, y: i % 2 ? 196 : 98, width: 10, height: 4, rx: 2, fill: "#1a0f0a", opacity: .7 }));
    if (/broccoli/i.test(main)) for (let i = 0; i < 5; i++) g.appendChild(el("circle", { cx: cx - 30 + i * 15, cy: 130 + (i % 2) * 34, r: 8, fill: "#3f8f3a" }));
    label(g, cx, 152, main);
    const textFill = /oxtail|jerk|bbq|ribs|beef|pulled/i.test(main) ? "#ffffff" : "#1f1712";
    [...g.querySelectorAll("text")].forEach(t => t.setAttribute("style", `fill:${textFill}`));
    if (just) {
      g.appendChild(el("ellipse", { cx: 230, cy: 104, rx: 22, ry: 12, fill: "#d9a050" }));
      g.appendChild(el("ellipse", { cx: 238, cy: 128, rx: 22, ry: 12, fill: "#d9a050" }));
      label(g, 232, 160, "Festival or bread");
    } else {
      picks.forEach((p, i) => {
        const y = i === 0 ? 96 : 206, x = 222;
        g.appendChild(el("circle", { cx: x, cy: y, r: 40, fill: colour(S.sides, p) }));
        // the peas sit around the rim of the scoop, clear of the label
        if (/peas/i.test(p)) for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; g.appendChild(el("circle", { cx: x + Math.cos(a) * 31, cy: y + Math.sin(a) * 31, r: 3.4, fill: "#5b2a22" })); }
        label(g, x, y + 4, p);
      });
    }
    food.appendChild(g);
  }

  function render() {
    $$("[data-main]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.main === main)));
    $$("[data-side]").forEach(b => { b.setAttribute("aria-pressed", String(picks.includes(b.dataset.side))); b.disabled = just; });
    count.textContent = just ? "(none: just da meat)" : `(${picks.length} of 2)`;
    drawPlate();
    let text;
    if (!main) text = "Pick a main to start your plate.";
    else if (just) text = `${main}, just da meat, with festival or bread.`;
    else if (!picks.length) text = `${main}. Now pick two sides.`;
    else text = `${main} with ${picks.map(p => p.toLowerCase()).join(" and ")}.`;
    sum.textContent = text;
    const subject = main ? `Pickup order: ${main}` : "Pickup order";
    const lines = main ? `${main}${just ? " (just da meat, with festival or bread)" : picks.length ? " with " + picks.join(" and ") : ""}` : "";
    const bodyText = `Hello Chinson's,\n\nI'd like to order for pickup:\n${lines ? "- " + lines + "\n" : ""}\nPickup time:\nName:\nPhone:\n\nThank you!`;
    order.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  }

  setSide("island");
  // start with a plate already served, so the plate is never empty on arrival
  main = "Jerk chicken"; picks = ["Rice and peas", "Fried plantains"]; render();

  // ---------- Quiet entrances for the menu and reviews ----------
  const rev = $$(".h2, .grp, .items li, .snaps li, .score, .stars, .q, .owner, .vcard");
  rev.forEach(n => n.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(n => n.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${i * 60}ms`; e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.1 });
    rev.forEach(n => io.observe(n));
  }
})();
