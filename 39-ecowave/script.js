// EcoWave Charters & Water Sports: sample site script.
// WhatsApp links, the sunset in Providenciales, the trips list, the boat stage, the booking card and its calendar,
// the water under the boat (WebGL ripples you can touch) and the GSAP motion layer.
// Every part is optional: if one fails or a browser lacks it, the page still reads and books.
(() => {
  "use strict";
  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wide = window.matchMedia("(min-width: 900px)");
  const safe = (name, fn) => { try { fn(); } catch (e) { if (window.console) console.warn("[" + name + "]", e); } };

  /* ---------- WhatsApp ---------- */
  const PHONE = "16492421357";
  const enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const wa = text => `https://wa.me/${PHONE}?text=${enc(text)}`;
  const GENERAL = "Hi EcoWave! I'd like to book a day on the water.";
  function paintLinks() {
    $$("[data-wa]").forEach(a => {
      const v = a.dataset.wa;
      if (v === "general") a.href = wa(GENERAL);
      else if (v.includes("|")) {
        const [pack, what] = v.split("|");
        a.href = wa(`Hi EcoWave! I'd like to ask about the ${pack} (${what}).`);
      }
    });
  }

  /* ---------- The sun over Providenciales ---------- */
  const LAT = 21.78, LON = -72.27, TZ = "America/Grand_Turk", RAD = Math.PI / 180, DAY = 86400000;
  // Sunset on a calendar day, from the sunrise equation (good to a minute or two). Returns a timestamp in ms.
  function sunsetAt(y, m, d) {
    const jd0 = Date.UTC(y, m - 1, d) / DAY + 2440587.5;
    const n = Math.ceil(jd0 - 2451545 + 0.0008);
    const jStar = n - LON / 360;
    const M = (357.5291 + 0.98560028 * jStar) % 360;
    const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
    const L = (M + C + 180 + 102.9372) % 360;
    const transit = 2451545 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * L * RAD);
    const dec = Math.asin(Math.sin(L * RAD) * Math.sin(23.4397 * RAD));
    const cosW = (Math.sin(-0.833 * RAD) - Math.sin(LAT * RAD) * Math.sin(dec)) / (Math.cos(LAT * RAD) * Math.cos(dec));
    const w = Math.acos(Math.max(-1, Math.min(1, cosW))) / RAD;
    return (transit + w / 360 - 2440587.5) * DAY;
  }
  const clock = new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", minute: "2-digit" });
  const dayParts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
  const hhmm = t => clock.format(new Date(t)).replace(/\s?AM$/, " a.m.").replace(/\s?PM$/, " p.m.");
  function provoDay(t = Date.now()) {
    const p = {};
    dayParts.formatToParts(new Date(t)).forEach(x => { p[x.type] = x.value; });
    return [+p.year, +p.month, +p.day];
  }
  const span = ms => {
    const min = Math.max(1, Math.round(ms / 60000));
    const h = Math.floor(min / 60), m = min % 60;
    return h ? `${h} h ${m} min` : `${m} min`;
  };
  function tonight() {
    const now = Date.now();
    const set = sunsetAt(...provoDay(now));
    if (now < set) return `Tonight the sun sets in Providenciales at <b>${hhmm(set)}</b>, ${span(set - now)} from now.`;
    return `The sun has already set in Providenciales today. Tomorrow it sets at <b>${hhmm(sunsetAt(...provoDay(now + DAY)))}</b>`;
  }
  let sunCard = () => {};
  function sunShort() {
    const now = Date.now();
    const set = sunsetAt(...provoDay(now));
    return now < set
      ? `Sunset tonight in Providenciales: <b>${hhmm(set)}</b>`
      : `Sunset tomorrow in Providenciales: <b>${hhmm(sunsetAt(...provoDay(now + DAY)))}</b>`;
  }
  function sunTick() {
    const t = tonight(), s = sunShort();
    $$("[data-sun-today]").forEach(el => { el.innerHTML = t; });
    $$("[data-sun-short]").forEach(el => { el.innerHTML = s; });
    sunCard();
  }

  /* ---------- Trips: the row in the middle of the screen is the one shown ---------- */
  function trips() {
    const section = $(".trips");
    if (!section) return;
    const rows = $$(".row", section);
    const photos = $$(".trips-photo img", section);
    const band = $(".trips-photo", section);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    // the first fold happens at once, so the page height is final before the scroll animations measure it
    section.classList.add("js-rows", "rows-still");
    requestAnimationFrame(() => requestAnimationFrame(() => section.classList.remove("rows-still")));
    let active = null;

    function show(row) {
      if (!row || active === row) return;
      active = row;
      rows.forEach(r => r.classList.toggle("is-active", r === row));
      photos.forEach(p => {
        const on = p.dataset.photo === row.dataset.photo;
        if (on && p.loading === "lazy") p.loading = "eager";
        p.classList.toggle("is-on", on);
      });
    }
    // On a computer every description stays open; on a phone a tap opens it.
    function setOpen(row, on) {
      row.classList.toggle("is-open", on);
      const b = $(".row-btn", row);
      if (wide.matches) b.removeAttribute("aria-expanded");
      else b.setAttribute("aria-expanded", String(on));
    }
    function layout() { rows.forEach(r => setOpen(r, wide.matches ? true : r.classList.contains("is-open"))); }
    rows.forEach(r => r.classList.remove("is-open"));
    layout();
    show(rows[0]);
    (wide.addEventListener ? wide.addEventListener("change", layout) : wide.addListener(layout));

    rows.forEach(row => {
      const btn = $(".row-btn", row);
      btn.addEventListener("click", () => {
        if (!wide.matches) setOpen(row, !row.classList.contains("is-open"));
        show(row);
      });
      btn.addEventListener("focus", () => show(row));
      row.addEventListener("mouseenter", () => { if (fine.matches && wide.matches) show(row); });
    });

    let queued = false;
    function pick() {
      queued = false;
      const box = section.getBoundingClientRect();
      if (box.bottom < 0 || box.top > innerHeight) return;
      const line = wide.matches ? innerHeight / 2 : band.getBoundingClientRect().bottom + 48;
      let best = null, bestD = Infinity;
      rows.forEach(r => {
        const b = $(".row-btn", r).getBoundingClientRect();
        const d = Math.abs(b.top + b.height / 2 - line);
        if (d < bestD) { bestD = d; best = r; }
      });
      show(best);
    }
    addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(pick); } }, { passive: true });
  }

  /* ---------- The boat: one frame, three distances ---------- */
  function boat() {
    const sec = $(".boat");
    if (!sec) return;
    const frames = $$(".bf", sec);
    sec.classList.add("js-stage");
    let stage = -1;
    function set(s) {
      if (s === stage) return;
      stage = s;
      sec.dataset.stage = String(s);
      frames.forEach((f, i) => {
        if (i <= s + 1 && f.loading === "lazy") f.loading = "eager";
        f.classList.toggle("is-on", i === s);
      });
    }
    function onScroll() {
      const r = sec.getBoundingClientRect();
      const total = r.height - innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
      set(p < 0.34 ? 0 : p < 0.68 ? 1 : 2);
    }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    onScroll();
  }

  /* ---------- Booking card ---------- */
  const parseDate = v => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || ""); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; // taste-skill-ignore: a date
  const longDate = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const dayMonth = d => d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const shortDate = d => d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const provoToday = () => { const [y, m, d] = provoDay(); return new Date(y, m - 1, d); };

  function booking() {
    const card = $(".book-card");
    if (!card) return;
    const send = $('[data-wa="booking"]', card);
    const line = $("[data-sun-line]", card);
    const people = $("#b-people", card);
    const dateInput = $("#b-date", card);
    let dateBtn = null;
    const count = () => {
      const n = Math.round(Number(people.value));
      return Number.isFinite(n) ? Math.min(12, Math.max(1, n)) : 2;
    };

    function update() {
      const trip = ($('input[name="trip"]:checked', card) || {}).value || "Half-Day Charter (3 hours)";
      const n = count();
      const who = n === 1 ? "1 person" : `${n} people`;
      const date = parseDate(dateInput.value);
      const when = ($('input[name="when"]:checked', card) || {}).value || "";
      const setText = date ? hhmm(sunsetAt(date.getFullYear(), date.getMonth() + 1, date.getDate())) : "";
      const at = when === "morning" ? " in the morning"
        : when === "afternoon" ? " in the afternoon"
        : when === "sunset" ? (date ? ` at sunset (the sun sets at ${setText} that day)` : " at sunset")
        : "";
      send.href = wa(date
        ? `Hi EcoWave! I'd like to book the ${trip} on ${longDate(date)} for ${who}${at}. Could you tell me the price${when ? "" : " and the times"}?`
        : `Hi EcoWave! I'd like to book the ${trip} for ${who}${at}. Could you tell me the price and which days you have free?`);
      line.innerHTML = date
        ? `On ${dayMonth(date)} the sun sets in Providenciales at <b>${hhmm(sunsetAt(date.getFullYear(), date.getMonth() + 1, date.getDate()))}</b>`
        : tonight();
      if (dateBtn) dateBtn.textContent = date ? shortDate(date) : "Choose the date";
    }
    sunCard = update;

    $$('input[name="trip"], input[name="when"]', card).forEach(r => r.addEventListener("change", update));
    $$(".step", card).forEach(b => b.addEventListener("click", () => {
      people.value = String(Math.min(12, Math.max(1, count() + Number(b.dataset.step))));
      update();
    }));
    people.addEventListener("input", update);
    people.addEventListener("change", () => { people.value = String(count()); update(); });
    dateInput.addEventListener("change", update);

    // The calendar (as on The Cake Lady): a month grid where days already gone cannot be picked.
    // Without the script, the phone's own date field stays.
    safe("calendar", () => {
      const label = $('label[for="b-date"]', card);
      const row = dateInput.closest(".field-row");
      const today = provoToday();
      const monthOf = d => new Date(d.getFullYear(), d.getMonth(), 1);
      const first = monthOf(today);
      const last = new Date(today.getFullYear(), today.getMonth() + 18, 1);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-btn";
      btn.id = "b-date-btn";
      btn.textContent = "Choose the date";
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-controls", "b-cal");
      label.id = "b-date-label";
      label.htmlFor = btn.id;
      btn.setAttribute("aria-labelledby", "b-date-label b-date-btn");

      const cal = document.createElement("div");
      cal.className = "cal";
      cal.id = "b-cal";
      cal.hidden = true;
      cal.setAttribute("role", "group");
      cal.setAttribute("aria-label", "Calendar");
      cal.innerHTML = `<div class="cal-head">
          <button type="button" class="cal-nav" data-dir="-1" aria-label="Previous month">&lsaquo;</button>
          <p class="cal-title" aria-live="polite"></p>
          <button type="button" class="cal-nav" data-dir="1" aria-label="Next month">&rsaquo;</button>
        </div>
        <div class="cal-week" aria-hidden="true">${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(w => `<span>${w}</span>`).join("")}</div>
        <div class="cal-days"></div>`;
      const title = $(".cal-title", cal);
      const days = $(".cal-days", cal);
      const [prev, next] = $$(".cal-nav", cal);
      let view = first;
      let focusDate = today;

      function render(focus) {
        const chosen = parseDate(dateInput.value);
        title.textContent = view.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
        prev.setAttribute("aria-disabled", String(+view <= +first));
        next.setAttribute("aria-disabled", String(+view >= +last));
        const total = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
        let html = "<span></span>".repeat(view.getDay());
        for (let n = 1; n <= total; n++) {
          const d = new Date(view.getFullYear(), view.getMonth(), n);
          const gone = d < today;
          const picked = chosen && +d === +chosen;
          html += `<button type="button" class="cal-day${picked ? " is-chosen" : ""}" data-date="${iso(d)}" tabindex="-1"`
            + `${gone ? ' aria-disabled="true"' : ""}${+d === +today ? ' aria-current="date"' : ""}`
            + ` aria-label="${longDate(d)}${gone ? ", already passed" : picked ? ", chosen" : ""}">${n}</button>`;
        }
        days.innerHTML = html;
        // One day takes the Tab key; the arrow keys move between the days.
        const target = $(`[data-date="${iso(focusDate)}"]`, days) || $(".cal-day:not([aria-disabled])", days) || $(".cal-day", days);
        target.tabIndex = 0;
        if (focus) target.focus();
      }
      function show(d) {
        focusDate = d;
        if (+monthOf(d) !== +view) { view = monthOf(d); render(true); return; }
        $$(".cal-day", days).forEach(b => { b.tabIndex = -1; });
        const target = $(`[data-date="${iso(d)}"]`, days);
        target.tabIndex = 0;
        target.focus();
      }
      function open() {
        const chosen = parseDate(dateInput.value);
        focusDate = chosen && chosen >= today ? chosen : today;
        view = monthOf(focusDate);
        cal.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        render(true);
      }
      function close(refocus) {
        cal.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        if (refocus) btn.focus();
      }
      btn.addEventListener("click", () => (cal.hidden ? open() : close(false)));
      [prev, next].forEach(b => b.addEventListener("click", () => {
        if (b.getAttribute("aria-disabled") === "true") return;
        view = new Date(view.getFullYear(), view.getMonth() + Number(b.dataset.dir), 1);
        focusDate = new Date(view.getFullYear(), view.getMonth(), Math.min(focusDate.getDate(), 28));
        render(false);
      }));
      days.addEventListener("click", e => {
        const b = e.target.closest(".cal-day");
        if (!b || b.getAttribute("aria-disabled") === "true") return;
        dateInput.value = b.dataset.date;
        close(true);
        update();
      });
      cal.addEventListener("keydown", e => {
        if (e.key === "Escape") { e.preventDefault(); close(true); return; }
        if (!e.target.classList.contains("cal-day")) return;
        const cur = parseDate(e.target.dataset.date);
        const y = cur.getFullYear(), m = cur.getMonth(), n = cur.getDate();
        const moves = {
          ArrowLeft: [y, m, n - 1], ArrowRight: [y, m, n + 1], ArrowUp: [y, m, n - 7], ArrowDown: [y, m, n + 7],
          Home: [y, m, n - cur.getDay()], End: [y, m, n + 6 - cur.getDay()],
          PageUp: [y, m - 1, Math.min(n, 28)], PageDown: [y, m + 1, Math.min(n, 28)],
        };
        if (!moves[e.key]) return;
        e.preventDefault();
        const to = new Date(...moves[e.key]);
        if (monthOf(to) < first || monthOf(to) > last) return;
        show(to);
      });

      const kept = parseDate(dateInput.value);
      if (kept && kept < today) dateInput.value = "";
      dateInput.type = "hidden";
      dateInput.after(btn);
      row.after(cal);
      dateBtn = btn;
    });

    update();
  }

  /* ---------- The small Book button once the hero has gone ---------- */
  function floatBook() {
    const b = $(".float-book"), hero = $(".hero"), book = $(".book");
    if (!b || !hero || !("IntersectionObserver" in window)) return;
    let pastHero = false, atBook = false;
    const paint = () => { b.classList.toggle("is-on", pastHero); b.classList.toggle("is-over-book", atBook); };
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; paint(); }).observe(hero);
    if (book) new IntersectionObserver(([e]) => { atBook = e.isIntersecting; paint(); }, { rootMargin: "0px 0px -30% 0px" }).observe(book);
  }

  /* ---------- The water under the boat: touch it and it ripples ---------- */
  function water() {
    const hero = $(".hero"), img = $(".hero-photo"), cv = $(".hero-water"), hint = $(".water-hint");
    const off = () => root.classList.add("no-water");
    if (!hero || !img || !cv || reduce) { off(); return; }
    let gl = null;
    try { gl = cv.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }); } catch (e) { gl = null; }
    if (!gl) { off(); return; }

    const VS = "attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}";
    const FS = [
      "precision mediump float;",
      "varying vec2 v;",
      "uniform sampler2D uImg;uniform sampler2D uH;",
      "uniform vec2 uCell;uniform vec4 uMap;uniform float uLine;",
      "void main(){",
      "  float l=texture2D(uH,v-vec2(uCell.x,0.)).r;",
      "  float r=texture2D(uH,v+vec2(uCell.x,0.)).r;",
      "  float t=texture2D(uH,v-vec2(0.,uCell.y)).r;",
      "  float b=texture2D(uH,v+vec2(0.,uCell.y)).r;",
      "  vec2 g=vec2(r-l,b-t);",
      "  vec2 iv=v*uMap.xy+uMap.zw;",
      "  float m=smoothstep(uLine,uLine+.05,iv.y);",
      "  vec3 c=texture2D(uImg,clamp(iv+g*.06*m,0.,1.)).rgb;",
      "  float s=clamp((-g.x-g.y)*4.,0.,1.);",
      "  c+=m*s*s*.38;",
      "  gl_FragColor=vec4(c,1.);",
      "}",
    ].join("\n");
    function shader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    let prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (e) { off(); return; }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = name => gl.getUniformLocation(prog, name);
    const texture = unit => {
      const t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    };
    const imgTex = texture(0);
    const hTex = texture(1);
    gl.uniform1i(U("uImg"), 0);
    gl.uniform1i(U("uH"), 1);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

    // The ripple field: two height grids, the classic wave step, written into a small grey texture each frame.
    const IW = 1672, IH = 941, LINE = 0.505, POS = [0.52, 0.5];
    let GW = 0, GH = 0, cur = null, prv = null, bytes = null, map = [1, 1, 0, 0];
    function size() {
      const bw = cv.offsetWidth, bh = cv.offsetHeight;
      if (!bw || !bh) return false;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      cv.width = Math.round(bw * dpr);
      cv.height = Math.round(bh * dpr);
      gl.viewport(0, 0, cv.width, cv.height);
      const sc = Math.max(bw / IW, bh / IH), dw = IW * sc, dh = IH * sc;
      map = [bw / dw, bh / dh, -((bw - dw) * POS[0]) / dw, -((bh - dh) * POS[1]) / dh];
      gl.uniform4f(U("uMap"), map[0], map[1], map[2], map[3]);
      gl.uniform1f(U("uLine"), LINE);
      GW = 180;
      GH = Math.max(48, Math.round(GW * bh / bw));
      cur = new Float32Array(GW * GH);
      prv = new Float32Array(GW * GH);
      bytes = new Uint8Array(GW * GH).fill(128);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, hTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.LUMINANCE, GW, GH, 0, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
      gl.uniform2f(U("uCell"), 1 / GW, 1 / GH);
      return true;
    }
    function step() {
      for (let y = 1; y < GH - 1; y++) {
        const row = y * GW;
        for (let x = 1; x < GW - 1; x++) {
          const i = row + x;
          prv[i] = ((cur[i - 1] + cur[i + 1] + cur[i - GW] + cur[i + GW]) * 0.5 - prv[i]) * 0.985;
        }
      }
      const t = cur; cur = prv; prv = t;
      for (let i = 0; i < cur.length; i++) {
        const b = 128 + cur[i] * 1.6;
        bytes[i] = b < 0 ? 0 : b > 255 ? 255 : b;
      }
    }
    function drop(gx, gy, r, amount) {
      for (let y = Math.max(1, Math.floor(gy - r)); y <= Math.min(GH - 2, Math.ceil(gy + r)); y++) {
        for (let x = Math.max(1, Math.floor(gx - r)); x <= Math.min(GW - 2, Math.ceil(gx + r)); x++) {
          const d = Math.hypot(x - gx, y - gy) / r;
          if (d < 1) cur[y * GW + x] += amount * (0.5 + 0.5 * Math.cos(d * Math.PI));
        }
      }
    }
    // image coordinates (0..1 of the photo) to grid cells
    const fromImage = (u, vv) => [((u - map[2]) / map[0]) * GW, ((vv - map[3]) / map[1]) * GH];
    const inside = (gx, gy) => gx > 1 && gy > 1 && gx < GW - 2 && gy < GH - 2;

    let running = false, raf = 0, visible = true, nextAmbient = 0, lastPointer = 0, nextWake = performance.now() + 4200;
    function frame(now) {
      raf = 0;
      if (!running) return;
      if (now > nextWake) {
        // the boat leaves a wake: a run of rings from the stern back along the water
        [0.37, 0.335, 0.30, 0.265, 0.23, 0.195].forEach((u, i) => setTimeout(() => {
          if (!running) return;
          const [gx, gy] = fromImage(u, 0.545 + (i % 2 ? 0.012 : 0));
          if (inside(gx, gy)) drop(gx, gy, 3, 34 - i * 3);
        }, i * 130));
        nextWake = now + 6500 + Math.random() * 3500;
      }
      if (now > nextAmbient) {
        const [gx, gy] = fromImage(0.06 + Math.random() * 0.88, 0.58 + Math.random() * 0.36);
        if (inside(gx, gy)) drop(gx, gy, 2.5, 22 + Math.random() * 18);
        nextAmbient = now + 900 + Math.random() * 1300;
      }
      step();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, hTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, GW, GH, gl.LUMINANCE, gl.UNSIGNED_BYTE, bytes);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      raf = requestAnimationFrame(frame);
    }
    const run = on => {
      running = on;
      if (on && !raf) raf = requestAnimationFrame(frame);
    };
    const refresh = () => run(visible && !document.hidden);

    let hinted = false;
    function hideHint() {
      if (hinted || !hint) return;
      hinted = true;
      if (window.gsap) window.gsap.to(hint, { autoAlpha: 0, duration: 0.5, delay: 1.2 });
      else hint.classList.add("is-gone");
    }
    function toGrid(e) {
      const r = cv.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * GW, ((e.clientY - r.top) / r.height) * GH];
    }
    hero.addEventListener("pointermove", e => {
      if (!running) return;
      const now = performance.now();
      if (now - lastPointer < 24) return;
      lastPointer = now;
      const [gx, gy] = toGrid(e);
      if (!inside(gx, gy)) return;
      drop(gx, gy, e.pointerType === "mouse" ? 3 : 4.5, e.pointerType === "mouse" ? 20 : 32);
      hideHint();
    }, { passive: true });
    hero.addEventListener("pointerdown", e => {
      const [gx, gy] = toGrid(e);
      if (!inside(gx, gy)) return;
      drop(gx, gy, 5.5, 90);
      hideHint();
    }, { passive: true });

    function begin() {
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, imgTex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      } catch (e) { off(); return; }   // e.g. a page opened from a file, where the browser keeps the photo from WebGL
      if (!size()) { off(); return; }
      cv.classList.add("is-on");
      // the boat sets the water moving: a run of drops along the hull, then the sea keeps breathing on its own
      [0.39, 0.44, 0.49, 0.54, 0.59, 0.64].forEach((u, i) => setTimeout(() => {
        const [gx, gy] = fromImage(u, 0.525);
        if (inside(gx, gy)) drop(gx, gy, 3, 46);
      }, 500 + i * 140));
      if ("IntersectionObserver" in window) new IntersectionObserver(([e]) => { visible = e.isIntersecting; refresh(); }).observe(hero);
      document.addEventListener("visibilitychange", refresh);
      let t = 0;
      addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { size(); }, 160); });
      refresh();
      setTimeout(hideHint, 9000);
    }
    cv.addEventListener("webglcontextlost", e => { e.preventDefault(); run(false); cv.classList.remove("is-on"); off(); });
    if (img.complete && img.naturalWidth) begin();
    else img.addEventListener("load", begin, { once: true });
  }

  /* ---------- Motion (GSAP) ---------- */
  function motion() {
    const g = window.gsap;
    if (!g || !window.ScrollTrigger) { root.classList.add("anim-off"); return; }
    g.registerPlugin(window.ScrollTrigger);
    if (window.SplitText) g.registerPlugin(window.SplitText);
    if (reduce) { root.classList.add("anim-ready"); return; }

    // Whenever the page changes height (a row opens, the calendar opens, a late font), the scroll animations measure again.
    if ("ResizeObserver" in window) {
      let t = 0;
      new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => window.ScrollTrigger.refresh(), 180); }).observe(document.body);
    }

    // Hero: the photo settles, the logo turns in, the name rises out of the water line.
    // On a slow line the 2.5 s fallback may already have shown the hero; then it stays as it is.
    const late = root.classList.contains("anim-off");
    const lines = late ? [] : $$(".hn-line");
    lines.forEach(l => {
      const mask = document.createElement("span");
      mask.className = "line-mask";
      l.parentNode.insertBefore(mask, l);
      mask.appendChild(l);
    });
    if (!late) {
      g.set(["[data-in]"], { autoAlpha: 0 });
      g.set(".hero-name", { autoAlpha: 1 });
      g.set(lines, { yPercent: 115 });
    }
    root.classList.add("anim-ready");
    if (!late) g.timeline({ defaults: { ease: "power3.out" } })
      .fromTo(".hero-media", { scale: 1.12 }, { scale: 1, duration: 2.4, ease: "power2.out" }, 0)
      .to(".letterhead", { autoAlpha: 1, duration: 0.8 }, 0.25)
      .fromTo(".letterhead .mark", { rotation: -140, scale: 0.6 }, { rotation: 0, scale: 1, duration: 1.5, ease: "power4.out" }, 0.25)
      .fromTo(".lh-lines > span", { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.08 }, 0.45)
      .fromTo(".top-nav", { y: -10 }, { y: 0, autoAlpha: 1, duration: 0.7 }, 0.5)
      .to(lines, { yPercent: 0, duration: 1.2, stagger: 0.13, ease: "power4.out" }, 0.6)
      .fromTo(".hero-act", { y: 18 }, { y: 0, autoAlpha: 1, duration: 0.8 }, 1.05)
      .fromTo(".water-hint", { y: 8 }, { y: 0, autoAlpha: 1, duration: 0.6 }, 2.1);

    g.to(".hero-media", { yPercent: 14, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    g.to(".hero-foot", { y: -70, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Headings and the intro come up line by line once the fonts are in; the split is undone afterwards.
    const rise = (el, start = "top 86%") => {
      if (!window.SplitText) {
        g.from(el, { y: 30, autoAlpha: 0, duration: 0.9, scrollTrigger: { trigger: el, start, once: true } });
        return;
      }
      const split = window.SplitText.create(el, { type: "lines", mask: "lines" });
      g.from(split.lines, {
        yPercent: 105, duration: 1.05, stagger: 0.09, ease: "power4.out",
        scrollTrigger: { trigger: el, start, once: true },
        onComplete: () => split.revert(),
      });
    };
    const afterFonts = fn => (document.fonts && document.fonts.ready ? document.fonts.ready.then(fn) : fn());
    afterFonts(() => {
      $$(".intro-text, .trips-title").forEach(el => rise(el));
      ScrollTrigger.refresh();
    });

    // Trips: the photo comes forward, tonight's sunset, then each package with its rows one after another.
    g.from(".trips-photo", { scale: 0.94, autoAlpha: 0, duration: 1.1, ease: "power2.out", scrollTrigger: { trigger: ".trips", start: "top 80%", once: true } });
    g.from(".sun-badge", { y: 14, autoAlpha: 0, duration: 0.6, scrollTrigger: { trigger: ".sun-badge", start: "top 90%", once: true } });
    $$(".pack").forEach(p => g.from(p.querySelectorAll(".pack-name, .row, .pack-ask"), {
      y: 26, autoAlpha: 0, duration: 0.7, stagger: 0.07, scrollTrigger: { trigger: p, start: "top 85%", once: true },
    }));
    g.from(".trips-note", { y: 16, autoAlpha: 0, duration: 0.6, scrollTrigger: { trigger: ".trips-note", start: "top 92%", once: true } });

    // The boat: the first half of the sentence slides in as the stage arrives.
    g.from(".bt-1", { x: -60, autoAlpha: 0, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: ".boat", start: "top 70%", once: true } });

    // Booking: the dock drifts under the card, the card rises onto it.
    g.fromTo(".book-photo img", { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: "none", scrollTrigger: { trigger: ".book-photo", start: "top bottom", end: "bottom top", scrub: true } });
    g.from(".book-card", { y: 70, autoAlpha: 0, duration: 1, scrollTrigger: { trigger: ".book-card", start: "top 92%", once: true } });
    g.from(".fact", { y: 22, autoAlpha: 0, duration: 0.7, stagger: 0.08, scrollTrigger: { trigger: ".book-facts", start: "top 88%", once: true } });

    // Footer: the logo turns into place, the menu follows.
    g.from(".foot-mark img", { scale: 0.82, rotation: -10, autoAlpha: 0, duration: 1.4, ease: "power3.out", scrollTrigger: { trigger: ".foot", start: "top 75%", once: true } });
    g.from(".big-menu li", { x: -28, autoAlpha: 0, duration: 0.7, stagger: 0.07, scrollTrigger: { trigger: ".big-menu", start: "top 88%", once: true } });
    g.from(".foot-blocks > div, .legal", { y: 18, autoAlpha: 0, duration: 0.7, stagger: 0.1, scrollTrigger: { trigger: ".foot-blocks", start: "top 92%", once: true } });
  }

  // Inner pages (charters, before you go): each block comes up as it arrives; the photos settle as they pass.
  function pageMotion() {
    const g = window.gsap;
    if (!g || !window.ScrollTrigger || reduce || !$(".page-head")) return;
    g.registerPlugin(window.ScrollTrigger);
    g.from(".page-head > *", { y: 28, autoAlpha: 0, duration: 0.85, stagger: 0.1, ease: "power3.out" });
    $$(".charter-photo, .charter-text > *, .included > *, .faq > div, .policy > *, .policy-table tbody tr, .strip li").forEach(el => {
      g.from(el, { y: 26, autoAlpha: 0, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    });
    $$(".charter-photo img").forEach(im => g.fromTo(im, { scale: 1.1 }, { scale: 1, ease: "none", scrollTrigger: { trigger: im, start: "top bottom", end: "bottom top", scrub: true } }));
  }

  safe("links", paintLinks);
  safe("trips", trips);
  safe("boat", boat);
  safe("booking", booking);
  safe("sun", () => { sunTick(); setInterval(sunTick, 30000); });
  safe("float", floatBook);
  safe("water", water);
  safe("motion", motion);
  safe("pages", pageMotion);
})();
