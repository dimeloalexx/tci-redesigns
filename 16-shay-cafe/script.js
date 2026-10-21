(() => {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---------- Stickers: slapped onto the name once, then free to move ----------
  const stickers = $$("[data-st]");
  const wall = $("[data-wall]");
  // keep every sticker inside the wall on narrow screens
  function fit() {
    const W = wall.clientWidth;
    stickers.forEach(st => {
      st.style.left = "";
      const right = st.offsetLeft + st.offsetWidth;
      if (right > W - 6) st.style.left = `${Math.max(6, W - st.offsetWidth - 10)}px`;
    });
  }
  fit(); addEventListener("resize", fit);
  document.fonts && document.fonts.ready.then(fit);
  if (!reduce) {
    stickers.forEach(st => st.classList.add("pre"));
    requestAnimationFrame(() => requestAnimationFrame(() => stickers.forEach((st, i) => {
      st.style.transitionDelay = `${250 + i * 110}ms`;
      st.classList.remove("pre");
      setTimeout(() => (st.style.transitionDelay = ""), 1600 + i * 110);
    })));
  }
  stickers.forEach(st => {
    let sx = 0, sy = 0, ox = 0, oy = 0, moved = false;
    st.addEventListener("pointerdown", e => {
      st.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; moved = false;
      ox = parseFloat(st.style.getPropertyValue("--dx")) || 0;
      oy = parseFloat(st.style.getPropertyValue("--dy")) || 0;
      st.classList.add("dragging");
    });
    st.addEventListener("pointermove", e => {
      if (!st.classList.contains("dragging")) return;
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      st.style.setProperty("--dx", `${ox + dx}px`);
      st.style.setProperty("--dy", `${oy + dy}px`);
    });
    const end = () => st.classList.remove("dragging");
    st.addEventListener("pointerup", end);
    st.addEventListener("pointercancel", end);
    // a tap without dragging gives the sticker a little re-stick wiggle
    st.addEventListener("click", () => {
      if (moved || reduce) return;
      st.style.setProperty("--s", "1.12");
      setTimeout(() => st.style.setProperty("--s", "1"), 180);
    });
  });

  // ---------- The ticket: tap dishes, get a number like at the counter ----------
  const list = $("[data-list]"), noOut = $("[data-no]"), ticket = $("[data-ticket]");
  noOut.textContent = 10 + Math.floor(Math.random() * 89);
  const order = new Map();
  const float = document.createElement("button");
  float.type = "button"; float.className = "tk-float";
  float.addEventListener("click", () => ticket.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
  document.body.appendChild(float);

  function render() {
    const entries = [...order.entries()];
    if (!entries.length) list.innerHTML = '<li class="tk-empty">Nothing yet. Tap a dish on the counter.</li>';
    else list.innerHTML = entries.map(([name, n]) => `<li><span>${n} × ${name}</span><button type="button" data-less="${name}" aria-label="One less ${name}">−</button></li>`).join("");
    const total = entries.reduce((s, [, n]) => s + n, 0);
    float.textContent = `Your ticket · ${total} ${total === 1 ? "item" : "items"}`;
    float.classList.toggle("on", total > 0);
    $$("[data-item]").forEach(b => b.classList.toggle("added", order.has(b.dataset.item)));
  }
  $$("[data-item]").forEach(b => b.addEventListener("click", () => {
    order.set(b.dataset.item, (order.get(b.dataset.item) || 0) + 1);
    render();
  }));
  list.addEventListener("click", e => {
    const b = e.target.closest("[data-less]"); if (!b) return;
    const k = b.dataset.less, n = (order.get(k) || 0) - 1;
    if (n > 0) order.set(k, n); else order.delete(k);
    render();
  });
  $("[data-clear]").addEventListener("click", () => { order.clear(); noOut.textContent = 10 + Math.floor(Math.random() * 89); render(); });
  render();
})();
