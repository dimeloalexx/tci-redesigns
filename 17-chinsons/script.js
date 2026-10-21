(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const EMAIL = "info@chinsonsgrillshack.com";
  const NS = "http://www.w3.org/2000/svg";

  // ---------- The two kitchens, from Chinson's own menu ----------
  // [name, how it is drawn, colour]
  const SIDES = {
    island: {
      note: "The jerk and BBQ cook for hours and can sell out for the day. Come early, or order ahead.",
      mains: [["Jerk chicken", "drum", "#3b2416"], ["BBQ chicken", "drum", "#8a3418"], ["BBQ pork ribs", "ribs", "#6b2a12"], ["Pulled pork", "shreds", "#a0603a"], ["Curry goat", "curry", "#c98a2a"], ["Stewed oxtail", "oxtail", "#5b3220"], ["Steamed grouper", "parcel", "#efe2c2"], ["Fish and chips", "fishfry", "#d9a441"], ["Conch fritters", "balls", "#c98a3c"]],
      sides: [["Rice and peas", "ricepeas"], ["White rice", "rice"], ["Fried plantains", "plantain"], ["Festival", "festival"], ["Mac and cheese", "mac"], ["Coleslaw", "slaw"], ["Country cornbread", "cornbread"], ["Fries", "fries"], ["Salad", "salad"]],
      just: true,
    },
    wok: {
      note: "The Chinese menu runs all day, right next to the grill.",
      mains: [["Lemon chicken", "lemon", "#f0c43a"], ["Beef and broccoli", "beefbroc", "#5a3a26"], ["Shrimp with oyster sauce", "shrimp", "#ee8c5e"], ["Chicken in mango sauce", "mango", "#f2a33a"], ["Chow mein", "noodles", "#c9934e"], ["Chicken fried rice", "friedrice", "#d9b36a"], ["Lobster Cantonese", "lobster", "#e0603a"]],
      sides: [["White rice", "rice"], ["Fried rice", "friedrice"], ["Spring roll", "rolls"], ["Egg roll", "eggrolls"], ["Fried wontons", "wonton"], ["Crab rangoon", "rangoon"]],
      just: false,
    },
  };
  let side = "island", main = null, picks = [], just = false, serve = "plate";

  const body = document.body, duo = $("[data-duo]"), sideNote = $("[data-side-note]");
  const mainsEl = $("[data-mains]"), sidesEl = $("[data-sides]"), count = $("[data-sides-count]"), justBox = $("[data-just]");
  const vessel = $("[data-vessel]"), food = $("[data-food]"), sum = $("[data-sum]"), order = $("[data-order]");

  function chips(el, list, attr) {
    el.innerHTML = list.map(([n]) => `<button type="button" aria-pressed="false" data-${attr}="${n}">${n}</button>`).join("");
  }
  function setSide(s, keepPlate) {
    const changed = s !== side;
    side = s; body.dataset.side = s;
    // on a phone the narrow side keeps enough room for its label
    const wide = window.matchMedia("(min-width: 600px)").matches ? 64 : 60;
    duo.style.setProperty("--split", (s === "island" ? wide : 100 - wide) + "%");
    $$("[data-side-btn]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.sideBtn === s)));
    if (changed || !keepPlate) {
      sideNote.textContent = SIDES[s].note;
      chips(mainsEl, SIDES[s].mains, "main"); chips(sidesEl, SIDES[s].sides, "side");
      justBox.closest(".just").hidden = !SIDES[s].just;
      // a new side starts with its signature plate already served
      if (s === "island") { main = "Jerk chicken"; picks = ["Rice and peas", "Fried plantains"]; }
      else { main = "Lemon chicken"; picks = ["Fried rice", "Spring roll"]; }
      just = false; justBox.checked = false;
      render();
    }
  }
  $$("[data-side-btn]").forEach(b => b.addEventListener("click", () => { if (!dragged) setSide(b.dataset.sideBtn, true); }));

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
  $$("[data-serve]").forEach(b => b.addEventListener("click", () => {
    serve = b.dataset.serve;
    $$("[data-serve]").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
    render();
  }));

  // ---------- Drag the line between the two kitchens ----------
  let dragged = false;
  const seam = $("[data-seam]");
  seam.addEventListener("pointerdown", e => {
    e.preventDefault(); dragged = false;
    seam.setPointerCapture(e.pointerId); duo.classList.add("dragging");
    const r = duo.getBoundingClientRect();
    const move = ev => {
      dragged = true;
      const pct = Math.min(85, Math.max(15, ((ev.clientX - r.left) / r.width) * 100));
      duo.style.setProperty("--split", pct + "%");
    };
    const up = ev => {
      seam.removeEventListener("pointermove", move); seam.removeEventListener("pointerup", up); seam.removeEventListener("pointercancel", up);
      duo.classList.remove("dragging");
      const pct = ((ev.clientX - r.left) / r.width) * 100;
      setSide(dragged ? (pct >= 50 ? "island" : "wok") : (side === "island" ? "wok" : "island"), true);
      setTimeout(() => { dragged = false; }, 0);
    };
    seam.addEventListener("pointermove", move); seam.addEventListener("pointerup", up); seam.addEventListener("pointercancel", up);
  });

  // ---------- Draw the plate ----------
  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    if (parent) parent.appendChild(n);
    return n;
  };
  // the same dish always lands the same way
  const rng = seed => { let h = 0; for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0; return () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296); };
  const inDisc = (r, rand) => { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r; return [Math.cos(a) * d, Math.sin(a) * d]; };

  function drawVessel() {
    vessel.innerHTML = "";
    if (serve === "plate") {
      el("circle", { cx: 150, cy: 150, r: 146, fill: "#fbf7f0" }, vessel);
      el("circle", { cx: 150, cy: 150, r: 120, fill: "#f2e9db" }, vessel);
      el("circle", { cx: 150, cy: 150, r: 133, fill: "none", stroke: "#e6dccb", "stroke-width": 2 }, vessel);
    } else {
      el("rect", { x: 26, y: 2, width: 248, height: 64, rx: 18, fill: "#e8e6e0", stroke: "#d2cec5", "stroke-width": 3 }, vessel);
      for (let i = 0; i < 4; i++) el("line", { x1: 60 + i * 60, y1: 16, x2: 60 + i * 60, y2: 54, stroke: "#d6d2c9", "stroke-width": 3, "stroke-linecap": "round" }, vessel);
      el("rect", { x: 10, y: 46, width: 280, height: 250, rx: 26, fill: "#fbfaf6", stroke: "#d2cec5", "stroke-width": 3 }, vessel);
      el("rect", { x: 24, y: 60, width: 252, height: 222, rx: 16, fill: "#f1efe8" }, vessel);
    }
  }

  function drawMain(g, kind, c, cx, cy, R, rand) {
    const at = (dx, dy) => `translate(${cx + dx} ${cy + dy})`;
    if (kind === "drum") {
      [[-.3, -.38, -20], [.2, -.06, 25], [-.22, .36, -8]].forEach(([dx, dy, a]) => {
        const p = el("g", { transform: `${at(dx * R, dy * R)} rotate(${a})` }, g);
        el("rect", { x: R * .3, y: -3.5, width: R * .32, height: 7, rx: 3.5, fill: "#f4e7cf" }, p);
        el("circle", { cx: R * .64, cy: -4, r: 5, fill: "#f4e7cf" }, p);
        el("circle", { cx: R * .64, cy: 4, r: 5, fill: "#f4e7cf" }, p);
        el("ellipse", { cx: 0, cy: 0, rx: R * .42, ry: R * .28, fill: c, stroke: "#c0561c", "stroke-width": 2.5 }, p);
        el("ellipse", { cx: -R * .1, cy: -R * .09, rx: R * .2, ry: R * .07, fill: "#ffffff", opacity: .18 }, p);
        for (let i = 0; i < 3; i++) el("line", { x1: -R * .22 + i * R * .16, y1: -R * .2, x2: -R * .3 + i * R * .16, y2: R * .2, stroke: "#140b06", "stroke-width": 3.5, "stroke-linecap": "round", opacity: .75 }, p);
      });
    } else if (kind === "ribs") {
      const p = el("g", { transform: `${at(0, 0)} rotate(-14)` }, g);
      for (let i = 0; i < 6; i++) el("rect", { x: -R * .78 + i * R * .3, y: -R * .62, width: 8, height: R * 1.24, rx: 4, fill: "#f4e7cf" }, p);
      el("rect", { x: -R * .85, y: -R * .44, width: R * 1.7, height: R * .88, rx: 16, fill: c }, p);
      for (let i = 0; i < 5; i++) el("line", { x1: -R * .6 + i * R * .3, y1: -R * .3, x2: -R * .7 + i * R * .3, y2: R * .3, stroke: "#1a0c06", "stroke-width": 4, "stroke-linecap": "round", opacity: .6 }, p);
    } else if (kind === "shreds") {
      el("ellipse", { cx, cy, rx: R * .9, ry: R * .78, fill: "#7a4426", opacity: .35 }, g);
      for (let i = 0; i < 46; i++) {
        const [x, y] = inDisc(R * .78, rand), a = rand() * Math.PI;
        el("line", { x1: cx + x, y1: cy + y, x2: cx + x + Math.cos(a) * 14, y2: cy + y + Math.sin(a) * 14, stroke: i % 3 ? c : "#6e3a1e", "stroke-width": 5, "stroke-linecap": "round" }, g);
      }
    } else if (kind === "curry" || kind === "oxtail") {
      el("ellipse", { cx, cy, rx: R * .95, ry: R * .82, fill: kind === "curry" ? "#d9a12e" : "#6a3a22" }, g);
      for (let i = 0; i < 7; i++) {
        const [x, y] = inDisc(R * .6, rand);
        el("circle", { cx: cx + x, cy: cy + y, r: R * (.16 + rand() * .08), fill: kind === "curry" ? "#8a5a1a" : "#3e2012" }, g);
      }
      for (let i = 0; i < 7; i++) {
        const [x, y] = inDisc(R * .7, rand);
        if (kind === "curry") el("rect", { x: cx + x - 6, y: cy + y - 6, width: 12, height: 12, rx: 3, fill: "#f2d68a" }, g);
        else el("ellipse", { cx: cx + x, cy: cy + y, rx: 7, ry: 4.5, fill: "#f1e5c6", transform: `rotate(${rand() * 180} ${cx + x} ${cy + y})` }, g);
      }
    } else if (kind === "parcel" || kind === "fishfry") {
      if (kind === "parcel") el("path", { d: `M${cx - R} ${cy - R * .2} L${cx - R * .4} ${cy - R * .85} L${cx + R * .7} ${cy - R * .7} L${cx + R} ${cy + R * .1} L${cx + R * .45} ${cy + R * .85} L${cx - R * .7} ${cy + R * .7} Z`, fill: "#fbf6ea", stroke: "#e2d6bd", "stroke-width": 2 }, g);
      const p = el("g", { transform: `${at(0, 0)} rotate(-10)` }, g);
      el("path", { d: `M${R * .55} 0 L${R * .92} ${-R * .3} L${R * .92} ${R * .3} Z`, fill: kind === "parcel" ? "#e2cfa4" : "#c98f33" }, p);
      el("ellipse", { cx: -R * .05, cy: 0, rx: R * .66, ry: R * .34, fill: c }, p);
      if (kind === "parcel") {
        el("circle", { cx: -R * .48, cy: -R * .08, r: 3.5, fill: "#3a2a1a" }, p);
        for (let i = 0; i < 6; i++) el("circle", { cx: -R * .3 + i * R * .14, cy: (i % 2 ? -1 : 1) * R * .1, r: 4, fill: i % 2 ? "#e0533a" : "#5aa047" }, p);
      } else {
        for (let i = 0; i < 14; i++) { const [x, y] = inDisc(R * .26, rand); el("circle", { cx: x * 2, cy: y, r: 2, fill: "#b07420" }, p); }
      }
    } else if (kind === "balls") {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2, d = i === 6 ? 0 : R * .52, x = cx + Math.cos(a) * d * (i === 6 ? 0 : 1), y = cy + Math.sin(a) * d;
        el("circle", { cx: i === 6 ? cx : x, cy: i === 6 ? cy : y, r: R * .25, fill: c }, g);
        el("circle", { cx: (i === 6 ? cx : x) - 5, cy: (i === 6 ? cy : y) - 5, r: R * .08, fill: "#e8b062" }, g);
      }
    } else if (kind === "lemon" || kind === "mango" || kind === "lobster") {
      el("ellipse", { cx, cy, rx: R * .92, ry: R * .8, fill: kind === "lobster" ? "#f3d7a2" : "#f6c65a", opacity: .55 }, g);
      for (let i = 0; i < 10; i++) {
        const [x, y] = inDisc(R * .62, rand);
        el("rect", { x: cx + x - 13, y: cy + y - 9, width: 26, height: 18, rx: 8, fill: c, stroke: "#00000022", "stroke-width": 1, transform: `rotate(${rand() * 90} ${cx + x} ${cy + y})` }, g);
      }
      if (kind === "lemon") [[-.45, -.45], [.45, .4]].forEach(([dx, dy]) => {
        el("circle", { cx: cx + dx * R, cy: cy + dy * R, r: 13, fill: "#fff3a6", stroke: "#f2c12e", "stroke-width": 3 }, g);
        for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; el("line", { x1: cx + dx * R - Math.cos(a) * 10, y1: cy + dy * R - Math.sin(a) * 10, x2: cx + dx * R + Math.cos(a) * 10, y2: cy + dy * R + Math.sin(a) * 10, stroke: "#f2c12e", "stroke-width": 1.5 }, g); }
      });
      if (kind === "mango") for (let i = 0; i < 9; i++) { const [x, y] = inDisc(R * .7, rand); el("rect", { x: cx + x - 5, y: cy + y - 5, width: 10, height: 10, rx: 2, fill: "#ffb11f" }, g); }
      if (kind === "lobster") for (let i = 0; i < 12; i++) { const [x, y] = inDisc(R * .75, rand); el("circle", { cx: cx + x, cy: cy + y, r: 2.6, fill: "#4c9a3c" }, g); }
    } else if (kind === "beefbroc") {
      el("ellipse", { cx, cy, rx: R * .92, ry: R * .8, fill: "#a0682e", opacity: .4 }, g);
      for (let i = 0; i < 13; i++) { const [x, y] = inDisc(R * .66, rand); el("rect", { x: cx + x - 17, y: cy + y - 6, width: 34, height: 12, rx: 6, fill: c, stroke: "#2e1c10", "stroke-width": 1.5, transform: `rotate(${rand() * 180} ${cx + x} ${cy + y})` }, g); }
      for (let i = 0; i < 5; i++) {
        const [x, y] = inDisc(R * .6, rand), fx = cx + x, fy = cy + y;
        el("rect", { x: fx - 3, y: fy, width: 6, height: 13, rx: 3, fill: "#8cc56a" }, g);
        [[-6, -2], [6, -2], [0, -8]].forEach(([dx, dy]) => el("circle", { cx: fx + dx, cy: fy + dy, r: 7, fill: "#2f7d31" }, g));
      }
    } else if (kind === "shrimp") {
      el("ellipse", { cx, cy, rx: R * .92, ry: R * .8, fill: "#8a5a2b", opacity: .4 }, g);
      for (let i = 0; i < 8; i++) {
        const [x, y] = inDisc(R * .58, rand), a = rand() * 360;
        el("path", { d: "M-11 0 A11 11 0 1 1 6 9", fill: "none", stroke: c, "stroke-width": 9, "stroke-linecap": "round", transform: `translate(${cx + x} ${cy + y}) rotate(${a})` }, g);
      }
      for (let i = 0; i < 10; i++) { const [x, y] = inDisc(R * .75, rand); el("circle", { cx: cx + x, cy: cy + y, r: 2.6, fill: "#4c9a3c" }, g); }
    } else if (kind === "noodles") {
      el("ellipse", { cx, cy, rx: R * .92, ry: R * .82, fill: c, opacity: .45 }, g);
      for (let i = 0; i < 16; i++) {
        const y = cy - R * .6 + i * R * .08, w = R * Math.sqrt(Math.max(0, 1 - ((y - cy) / (R * .72)) ** 2)) * .8;
        let d = `M${cx - w} ${y}`; for (let x = -w; x < w; x += 12) d += ` q6 ${i % 2 ? 6 : -6} 12 0`;
        el("path", { d, fill: "none", stroke: i % 4 ? c : "#a87232", "stroke-width": 3.5, "stroke-linecap": "round" }, g);
      }
      for (let i = 0; i < 10; i++) { const [x, y] = inDisc(R * .65, rand); el("rect", { x: cx + x - 6, y: cy + y - 2, width: 12, height: 4, rx: 2, fill: i % 2 ? "#4c9a3c" : "#f08a2a" }, g); }
    } else if (kind === "friedrice") {
      grains(g, cx, cy, R * .95, "#e2c27e", ["#f6e3b0", "#c99a4c"], rand, 120);
      for (let i = 0; i < 16; i++) { const [x, y] = inDisc(R * .7, rand); el("circle", { cx: cx + x, cy: cy + y, r: 3, fill: i % 3 ? "#4c9a3c" : "#ffd23f" }, g); }
    }
  }

  function grains(g, cx, cy, r, base, tones, rand, n) {
    el("circle", { cx, cy, r, fill: base }, g);
    for (let i = 0; i < n; i++) {
      const [x, y] = inDisc(r * .9, rand);
      el("ellipse", { cx: cx + x, cy: cy + y, rx: 2.8, ry: 1.3, fill: tones[i % tones.length], transform: `rotate(${rand() * 180} ${cx + x} ${cy + y})` }, g);
    }
  }

  function drawSide(g, kind, x, y, rand) {
    const r = 40;
    if (kind === "rice") grains(g, x, y, r, "#f4efe2", ["#ffffff", "#e6dfcd"], rand, 70);
    else if (kind === "ricepeas") {
      grains(g, x, y, r, "#dcc6b2", ["#f6efe4", "#c8ab95"], rand, 60);
      for (let i = 0; i < 16; i++) { const [a, b] = inDisc(r * .82, rand); el("ellipse", { cx: x + a, cy: y + b, rx: 3.6, ry: 2.6, fill: "#6b2b25" }, g); }
    } else if (kind === "friedrice") grains(g, x, y, r, "#e2c27e", ["#f6e3b0", "#c99a4c", "#4c9a3c"], rand, 70);
    else if (kind === "plantain") {
      for (let i = 0; i < 5; i++) {
        const a = -60 + i * 30, px = x + Math.cos((a - 90) * Math.PI / 180) * 18, py = y + 14 + Math.sin((a - 90) * Math.PI / 180) * 18;
        el("ellipse", { cx: px, cy: py, rx: 9, ry: 19, fill: "#e59a2f", stroke: "#a85f17", "stroke-width": 2, transform: `rotate(${a} ${px} ${py})` }, g);
        el("ellipse", { cx: px, cy: py, rx: 5, ry: 13, fill: "#f7c85e", transform: `rotate(${a} ${px} ${py})` }, g);
      }
    } else if (kind === "festival") {
      [[-6, -16, -18], [6, 0, 12], [-4, 17, -6]].forEach(([dx, dy, a]) =>
        el("ellipse", { cx: x + dx, cy: y + dy, rx: 27, ry: 10, fill: "#d79a45", stroke: "#a96d27", "stroke-width": 2, transform: `rotate(${a} ${x + dx} ${y + dy})` }, g));
    } else if (kind === "mac") {
      el("circle", { cx: x, cy: y, r, fill: "#f3c443" }, g);
      for (let i = 0; i < 16; i++) { const [a, b] = inDisc(r * .75, rand); el("path", { d: "M-5 0 a5 5 0 0 1 10 0", fill: "none", stroke: "#d99a1e", "stroke-width": 3, "stroke-linecap": "round", transform: `translate(${x + a} ${y + b}) rotate(${rand() * 360})` }, g); }
      for (let i = 0; i < 6; i++) { const [a, b] = inDisc(r * .7, rand); el("circle", { cx: x + a, cy: y + b, r: 3.5, fill: "#c97a1a", opacity: .6 }, g); }
    } else if (kind === "slaw") {
      el("circle", { cx: x, cy: y, r, fill: "#f2f1df" }, g);
      for (let i = 0; i < 34; i++) { const [a, b] = inDisc(r * .78, rand), t = rand() * Math.PI; el("line", { x1: x + a, y1: y + b, x2: x + a + Math.cos(t) * 11, y2: y + b + Math.sin(t) * 11, stroke: ["#a9c97a", "#8e4b8a", "#f08a2a"][i % 3], "stroke-width": 2.4, "stroke-linecap": "round" }, g); }
    } else if (kind === "cornbread") {
      [[-12, -10], [12, 12]].forEach(([dx, dy]) => {
        el("rect", { x: x + dx - 18, y: y + dy - 18, width: 36, height: 36, rx: 6, fill: "#e8bf5c", stroke: "#b98a2c", "stroke-width": 2 }, g);
        for (let i = 0; i < 5; i++) el("circle", { cx: x + dx - 10 + rand() * 20, cy: y + dy - 10 + rand() * 20, r: 1.8, fill: "#c9962f" }, g);
      });
    } else if (kind === "fries") {
      for (let i = 0; i < 12; i++) { const [a, b] = inDisc(r * .55, rand); el("rect", { x: x + a - 3.5, y: y + b - 15, width: 7, height: 30, rx: 2, fill: i % 3 ? "#efc04e" : "#d9a032", transform: `rotate(${rand() * 180} ${x + a} ${y + b})` }, g); }
    } else if (kind === "salad") {
      for (let i = 0; i < 9; i++) { const [a, b] = inDisc(r * .6, rand); el("ellipse", { cx: x + a, cy: y + b, rx: 14, ry: 9, fill: ["#6fb24a", "#4f9a3a", "#9ccc65"][i % 3], transform: `rotate(${rand() * 180} ${x + a} ${y + b})` }, g); }
      for (let i = 0; i < 3; i++) { const [a, b] = inDisc(r * .5, rand); el("circle", { cx: x + a, cy: y + b, r: 7, fill: "#e0442f" }, g); }
    } else if (kind === "rolls" || kind === "eggrolls") {
      [[-14, -8, -20], [0, 12, -20], [16, -14, -20]].forEach(([dx, dy, a]) => {
        const p = el("g", { transform: `translate(${x + dx} ${y + dy}) rotate(${a})` }, g);
        el("rect", { x: -24, y: -8, width: 48, height: 16, rx: 8, fill: kind === "rolls" ? "#e0a856" : "#c98a3c", stroke: "#9c6420", "stroke-width": 1.5 }, p);
        for (let k = 0; k < 3; k++) el("line", { x1: -12 + k * 12, y1: -7, x2: -16 + k * 12, y2: 7, stroke: "#b07a2e", "stroke-width": 1.5 }, p);
      });
    } else if (kind === "wonton" || kind === "rangoon") {
      [[-16, -10], [14, -14], [-6, 16], [20, 12]].forEach(([dx, dy], i) => {
        const p = el("g", { transform: `translate(${x + dx} ${y + dy}) rotate(${i * 40})` }, g);
        if (kind === "wonton") el("path", { d: "M-15 10 L0 -14 L15 10 Z", fill: "#e6b65a", stroke: "#b07a2e", "stroke-width": 2, "stroke-linejoin": "round" }, p);
        else el("path", { d: "M0 -15 L5 -5 L15 0 L5 5 L0 15 L-5 5 L-15 0 L-5 -5 Z", fill: "#f0d48c", stroke: "#c49a3e", "stroke-width": 2, "stroke-linejoin": "round" }, p);
      });
    }
  }

  function pill(g, x, y, text) {
    const w = text.length * 6.4 + 18, cx = Math.min(296 - w / 2, Math.max(4 + w / 2, x));
    el("rect", { x: cx - w / 2, y: y - 11, width: w, height: 22, rx: 11, fill: "#1d1611", opacity: .88 }, g);
    const t = el("text", { x: cx, y: y + 4, "text-anchor": "middle", fill: "#fff8ee", style: "font: 600 11.5px 'Work Sans', system-ui, sans-serif" }, g);
    t.textContent = text;
  }

  function drawPlate() {
    drawVessel();
    food.innerHTML = "";
    if (!main) return;
    const S = SIDES[side];
    const [, kind, c] = S.mains.find(([n]) => n === main);
    const g = el("g", { class: "food" });
    const big = just || !picks.length;
    const box = serve === "box";
    const cx = big ? (just ? 128 : 150) : 112, cy = box ? 172 : 150, R = big ? 78 : 64;
    drawMain(g, kind, c, cx, cy, R, rng(main));
    if (just) {
      drawSide(g, "festival", 232, cy - 6, rng("festival"));
    } else {
      picks.forEach((p, i) => {
        const k = S.sides.find(([n]) => n === p)[1];
        drawSide(g, k, 222, i === 0 ? (box ? 112 : 96) : (box ? 222 : 206), rng(p));
      });
    }
    // labels go on last so the food never covers them
    pill(g, cx, cy + R + 10, main);
    if (just) pill(g, 232, cy + 42, "Festival or bread");
    else picks.forEach((p, i) => pill(g, 222, (i === 0 ? (box ? 112 : 96) : (box ? 222 : 206)) + 50, p));
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
    sum.textContent = text + (serve === "box" ? " In a box, to go." : "");
    const subject = main ? `Pickup order: ${main}` : "Pickup order";
    const lines = main ? `${main}${just ? " (just da meat, with festival or bread)" : picks.length ? " with " + picks.join(" and ") : ""}` : "";
    const bodyText = `Hello Chinson's,\n\nI'd like to order:\n${lines ? "- " + lines + "\n" : ""}- ${serve === "box" ? "In a box to go" : "To eat at the shack"}\n\nTime I'll come by:\nName:\nPhone:\n\nThank you!`;
    order.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
  }

  setSide("island");

  // ---------- Open right now? (Turks and Caicos time) ----------
  function status() {
    let d, h;
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Grand_Turk", weekday: "short", hour: "numeric", hour12: false }).formatToParts(new Date()).map(p => [p.type, p.value]));
      d = parts.weekday; h = parseInt(parts.hour, 10) % 24;
    } catch (e) { return; }
    let state = "closed", text;
    if (d === "Sun") { state = "maybe"; text = "Sunday: call 649 941 3533 before you come"; }
    else if (h >= 8 && h < 21) { state = "open"; text = h >= 20 ? "Open now, last hour before 9pm" : "Open now, until 9pm"; }
    else if (h < 8) text = "Closed now, opens at 8am";
    else text = d === "Sat" ? "Closed now, back Monday at 8am" : "Closed now, opens tomorrow at 8am";
    $$("[data-status]").forEach(s => { s.dataset.state = state; $("[data-status-text]", s).textContent = text; });
  }
  status(); setInterval(status, 60000);

  // ---------- The name in the footer always fits, whole ----------
  const fitBox = $("[data-fit]"), fitText = $("[data-fit] span");
  function fit() {
    fitBox.style.fontSize = "100px";
    const w = fitText.getBoundingClientRect().width;
    if (w) fitBox.style.fontSize = Math.floor((fitBox.clientWidth / w) * 100 * .98) + "px";
  }
  fit(); window.addEventListener("resize", fit);
  if (document.fonts) document.fonts.ready.then(fit);

  // ---------- Entrances ----------
  const rev = $$(".h2:not(.title), .menu-head p, .board, .bakery, .extras > div, .run-row li, .score, .stars, .q, .mentions, .leave, .owner, .about-text p, .map, .vcard");
  rev.forEach(n => n.setAttribute("data-reveal", ""));
  if (!("IntersectionObserver" in window) || reduce) rev.forEach(n => n.classList.add("is-in"));
  else {
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${i * 70}ms`; e.target.classList.add("is-in"); io.unobserve(e.target);
    }), { threshold: 0.12 });
    rev.forEach(n => io.observe(n));
  }
})();
