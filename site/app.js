(() => {
  "use strict";

  // Chapter titles shown before each group. Edit freely.
  const CHAPTERS = {
    "friend":        "From the friends who fill your days with laughter",
    "close-friend":  "From the friends who feel like home",
    "school-friend": "From the ones who've known you since the school bell rang",
    "college-friend": "From the campus days that never really ended",
    "relative":      "From the family that grew around you",
    "in-laws":       "From your second family",
    "family":        "From where it all began",
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const h = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  };

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canTilt = !reduceMotion && matchMedia("(hover: hover) and (pointer: fine)").matches;
  const COLORS = ["#c9787f", "#a4505c", "#c8a26b", "#f4d9d6", "#e9cde3", "#ffffff"];
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- confetti ----------
  const fx = (() => {
    const canvas = $("#fx");
    const ctx = canvas.getContext("2d");
    let parts = [], running = false, dpr = 1;
    const resize = () => {
      dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = innerWidth * dpr;
      canvas.height = innerHeight * dpr;
    };
    addEventListener("resize", resize);
    resize();

    function tick() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
      for (const p of parts) {
        p.vx *= 0.99;
        p.vy = p.vy * 0.99 + p.g;
        p.x += p.vx + Math.sin(p.life / 12) * p.wob;
        p.y += p.vy;
        p.rot += p.vr;
        p.life--;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.min(1, p.life / 40);
        ctx.fillStyle = p.color;
        if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.s / 3, 0, Math.PI * 2); ctx.fill(); }
        else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      }
      if (parts.length) requestAnimationFrame(tick);
      else running = false;
    }
    function add(p) {
      parts.push(Object.assign({
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, s: 6 + Math.random() * 7,
        color: pick(COLORS), round: Math.random() < 0.35, wob: 0,
      }, p));
      if (!running) { running = true; requestAnimationFrame(tick); }
    }
    return {
      burst(x, y, n = 100) {
        if (reduceMotion) return;
        for (let i = 0; i < n; i++) {
          const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 8;
          add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 5, g: 0.2, life: 150 + Math.random() * 60 });
        }
      },
      rain(n = 140) {
        if (reduceMotion) return;
        for (let i = 0; i < n; i++) {
          add({
            x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.8,
            vx: (Math.random() - 0.5) * 1.2, vy: 1.5 + Math.random() * 2, g: 0.02,
            wob: 0.6, life: 420,
          });
        }
      },
    };
  })();

  // ---------- little synthesized sounds (no files) ----------
  let soundOn = false; // follows her music choice
  let actx = null;
  function unlockAudio() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
    } catch (_) { actx = null; }
  }
  function blip(freq, dur = 0.12, type = "triangle", vol = 0.16, delay = 0) {
    if (!soundOn || !actx) return;
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + delay;
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    o.frequency.exponentialRampToValueAtTime(freq * 0.45, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(actx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }
  const chime = () => [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.5, "sine", 0.12, i * 0.09));

  // ---------- birthday journey: music → balloons → candles → cake → gift ----------
  // No skip button on purpose: she gets the whole moment.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const journey = $("#journey");
  const scene = (name) => $(`[data-scene="${name}"]`, journey);
  let music = null; // set once the manifest loads

  function show(name, step) {
    journey.querySelectorAll(".scene").forEach((s) => s.classList.toggle("active", s.dataset.scene === name));
    if (step) setStep(step);
  }
  function setStep(n) {
    $(".j-head", journey).hidden = false;
    [...$(".j-progress", journey).children].forEach((bar, i) => bar.classList.toggle("on", i < n));
    $("#j-step").textContent = `Step ${n} of 4`;
  }

  // Step 0: music choice
  const jMusic = $("#j-music"), jQuiet = $("#j-quiet");
  function journeyReady(hasMusic) {
    jMusic.disabled = jQuiet.disabled = false;
    if (!hasMusic) {
      jMusic.textContent = "Let's begin ♡";
      jQuiet.hidden = true;
      $("#j-sound-hint").hidden = true;
    }
    jMusic.focus();
  }
  function begin(withSound) {
    soundOn = withSound;
    if (withSound) {
      unlockAudio();
      if (music) music.play();
    }
    show("balloons", 1);
    startBalloons();
  }
  jMusic.addEventListener("click", () => begin(true));
  jQuiet.addEventListener("click", () => begin(false));

  // Step 1: pop 31 balloons
  const GOAL = 31;
  const MILESTONES = {
    5: "that's the spirit!",
    10: "ten down, so much fun ahead 🎈",
    16: "sweet sixteen… again 😄",
    18: "officially a grown-up now",
    21: "twenty-one and fabulous ✨",
    25: "quarter-century queen 👑",
    28: "almost there…",
    30: "one more. the best one ♡",
  };
  const BALLOON_COLORS = ["#e8939c", "#c9787f", "#f2c4a8", "#d9b3e0", "#e7c27d", "#f4a6b8", "#b9d4e8"];
  const sky = $("#j-sky");
  let popped = 0, spawner = null;

  function spawnBalloon() {
    if (popped >= GOAL || sky.querySelectorAll(".balloon:not(.popped)").length >= 9) return;
    const b = h("button", "balloon");
    b.setAttribute("aria-label", "Pop balloon");
    b.style.setProperty("--c", pick(BALLOON_COLORS));
    b.style.setProperty("--dur", 6 + Math.random() * 3.5 + "s");
    b.style.setProperty("--sway", (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 20) + "px");
    b.style.left = 4 + Math.random() * 74 + "%";
    if (reduceMotion) { b.style.top = 5 + Math.random() * 60 + "%"; b.style.bottom = "auto"; }
    b.append(h("span", "bl"));
    b.addEventListener("pointerdown", (e) => { e.preventDefault(); popBalloon(b); });
    b.addEventListener("click", () => popBalloon(b)); // keyboard
    b.addEventListener("animationend", (e) => { if (e.animationName === "rise") b.remove(); });
    sky.append(b);
  }
  function startBalloons() {
    for (let i = 0; i < 4; i++) setTimeout(spawnBalloon, i * 250);
    spawner = setInterval(spawnBalloon, 650);
  }
  function popBalloon(b) {
    if (b.classList.contains("popped") || popped >= GOAL) return;
    b.classList.add("popped");
    popped++;
    const r = b.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.4;
    fx.burst(x, y, 16);
    floatText(x, y, String(popped));
    blip(480 + popped * 14, 0.09, "square", 0.08);
    setTimeout(() => b.remove(), 260);

    const count = $("#j-count");
    count.textContent = popped;
    count.classList.remove("bump");
    void count.offsetWidth; // restart the bump animation
    count.classList.add("bump");
    if (MILESTONES[popped]) $("#j-balloon-msg").textContent = MILESTONES[popped];
    if (popped === GOAL) finishBalloons();
  }
  function floatText(x, y, text) {
    const el = h("span", "float-num", text);
    el.style.left = x + "px";
    el.style.top = y + "px";
    el.addEventListener("animationend", () => el.remove());
    document.body.append(el);
  }
  function finishBalloons() {
    clearInterval(spawner);
    sky.querySelectorAll(".balloon").forEach((b) => b.classList.add("flyaway"));
    $("#j-balloon-msg").textContent = "31 years of you, and every one a gift 🎈";
    scene("balloons").classList.add("won");
    fx.rain(120);
    chime();
    const next = $("#j-to-cake");
    setTimeout(() => { next.hidden = false; next.focus(); }, 700);
  }
  $("#j-to-cake").addEventListener("click", () => show("cake", 2));

  // Step 2: blow out the candles
  const stage = $("#j-stage");
  const candles = [...stage.querySelectorAll(".j-candle")];
  let candlesOut = 0;
  candles.forEach((c) => c.addEventListener("click", () => {
    if (c.classList.contains("out")) return;
    c.classList.add("out");
    blip(220, 0.4, "sine", 0.1);
    if (++candlesOut < candles.length) return;
    $("#j-cake-sub").textContent = "your wish is on its way… ✨";
    const r = stage.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height * 0.2, 40);
    setTimeout(readyToCut, reduceMotion ? 600 : 1800);
  }));

  // Step 3: swipe to cut the cake
  const trail = $(".cut-trail polyline", stage);
  const knife = $(".knife", stage);
  let path = null, isCut = false;
  function readyToCut() {
    setStep(3);
    $("#j-cake-eyebrow").textContent = "the best part";
    $("#j-cake-title").textContent = "Now cut the cake!";
    $("#j-cake-sub").textContent = "swipe down through the cake 🔪";
    stage.classList.add("cutting");
    stage.tabIndex = 0;
    stage.setAttribute("aria-label", "Cake. Swipe through it, or press Enter, to cut it");
  }
  const local = (e) => {
    const r = stage.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  stage.addEventListener("pointerdown", (e) => {
    if (!stage.classList.contains("cutting") || isCut) return;
    try { stage.setPointerCapture(e.pointerId); } catch (_) {}
    path = [local(e)];
    stage.classList.add("dragging");
    moveKnife(path[0]);
  });
  stage.addEventListener("pointermove", (e) => {
    if (!path) return;
    const p = local(e);
    path.push(p);
    moveKnife(p);
    trail.setAttribute("points", path.map((q) => q.join(",")).join(" "));
  });
  function moveKnife([x, y]) {
    knife.style.left = x + "px";
    knife.style.top = y + "px";
  }
  function endCut() {
    if (!path) return;
    const cake = $(".j-cake", stage).getBoundingClientRect();
    const xs = path.map((p) => p[0]), ys = path.map((p) => p[1]);
    const spanX = Math.max(...xs) - Math.min(...xs), spanY = Math.max(...ys) - Math.min(...ys);
    path = null;
    stage.classList.remove("dragging");
    trail.setAttribute("points", "");
    // generous: a long-enough swipe in either direction counts
    if (spanY > cake.height * 0.6 || spanX > cake.width * 0.45) cutCake();
    else $("#j-cake-sub").textContent = "almost! swipe all the way through 🔪";
  }
  stage.addEventListener("pointerup", endCut);
  stage.addEventListener("pointercancel", endCut);
  stage.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && stage.classList.contains("cutting")) { e.preventDefault(); cutCake(); }
  });
  function cutCake() {
    if (isCut) return;
    isCut = true;
    stage.classList.remove("cutting");
    stage.classList.add("cut");
    stage.removeAttribute("tabindex");
    blip(900, 0.15, "sawtooth", 0.05);
    chime();
    $("#j-cake-eyebrow").textContent = "🎉 🎂 🎉";
    $("#j-cake-title").textContent = "Happy 31st Birthday, Gayatri!";
    $("#j-cake-sub").textContent = "the first slice is all yours ♡";
    scene("cake").classList.add("won");
    const r = stage.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height / 2, 170);
    fx.rain(170);
    popHearts(r.left + r.width / 2, r.top + r.height / 2);
    const next = $("#j-to-gift");
    setTimeout(() => { next.hidden = false; next.focus(); }, 1400);
  }
  $("#j-to-gift").addEventListener("click", () => show("gift", 4));

  // Step 4: Kunal's gift → envelope → the letters
  const gift = $("#j-gift"), env = $("#j-envelope");
  gift.addEventListener("click", () => {
    if (gift.classList.contains("open")) return;
    gift.classList.add("open");
    chime();
    const r = gift.getBoundingClientRect();
    fx.burst(r.left + r.width / 2, r.top + r.height * 0.3, 120);
    popHearts(r.left + r.width / 2, r.top + r.height * 0.3);
    setTimeout(() => {
      gift.hidden = true;
      env.hidden = false;
      $("#j-gift-eyebrow").textContent = "inside, a letter";
      $("#j-gift-title").textContent = "Written in many hands";
      $("#j-gift-sub").textContent =
        "Kunal quietly gathered love from the people who adore you, and turned it into this.";
      $("#j-gift-hint").textContent = "tap to open";
      env.focus();
    }, reduceMotion ? 0 : 1100);
  });
  env.addEventListener("click", () => {
    if (env.classList.contains("open")) return;
    env.classList.add("open");
    $("#j-gift-hint").textContent = "";
    setTimeout(() => {
      journey.classList.add("gone");
      document.body.classList.add("opened");
      fx.burst(innerWidth / 2, innerHeight * 0.45, 150);
    }, reduceMotion ? 0 : 1600);
    setTimeout(() => journey.remove(), reduceMotion ? 0 : 2600);
  });

  // ---------- falling petals ----------
  if (!reduceMotion) {
    const bg = $(".bg");
    const n = innerWidth < 600 ? 10 : 16;
    for (let i = 0; i < n; i++) {
      const p = h("span", "petal");
      const leaf = h("i");
      p.style.left = Math.random() * 100 + "vw";
      p.style.animationDuration = 14 + Math.random() * 14 + "s";
      p.style.animationDelay = -Math.random() * 28 + "s";
      leaf.style.setProperty("--size", 8 + Math.random() * 10 + "px");
      leaf.style.animationDuration = 3 + Math.random() * 4 + "s";
      p.append(leaf);
      bg.append(p);
    }
  }

  // ---------- hearts wherever she taps ----------
  function popHearts(x, y) {
    const n = reduceMotion ? 1 : 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const el = h("span", "pop-heart", "♥");
      el.style.left = x + "px";
      el.style.top = y + "px";
      el.style.color = pick(COLORS.slice(0, 3));
      el.style.setProperty("--dx", (Math.random() - 0.5) * 140 + "px");
      el.style.setProperty("--r", (Math.random() - 0.5) * 60 + "deg");
      el.style.setProperty("--s", 0.6 + Math.random() * 0.9);
      el.style.animationDelay = i * 70 + "ms";
      el.addEventListener("animationend", () => el.remove());
      document.body.append(el);
    }
  }
  let down = null;
  document.addEventListener("pointerdown", (e) => {
    down = { x: e.clientX, y: e.clientY, t: Date.now() };
  }, { passive: true });
  document.addEventListener("pointerup", (e) => {
    // a tap, not a scroll or swipe, and not on something that does its own thing
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10 || Date.now() - down.t > 500) return;
    if (e.target.closest("button, a, video, img, canvas, .gallery, .journey, .lightbox")) return;
    popHearts(e.clientX, e.clientY);
  });

  // ---------- scroll progress thread ----------
  const bar = $("#progress");
  let barQueued = false;
  addEventListener("scroll", () => {
    if (barQueued) return;
    barQueued = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      barQueued = false;
    });
  }, { passive: true });

  // ---------- scratch-to-reveal secret at the end ----------
  (() => {
    const box = $("#scratch");
    const canvas = $("canvas", box);
    const ctx = canvas.getContext("2d");
    let done = false, drawing = false, moves = 0, paintedWidth = 0;

    function paint() {
      const r = box.getBoundingClientRect();
      if (done || !r.width || r.width === paintedWidth) return; // ignore mobile URL-bar resizes
      paintedWidth = r.width;
      const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = r.width * dpr;
      canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      const g = ctx.createLinearGradient(0, 0, r.width, r.height);
      g.addColorStop(0, "#e8c48d");
      g.addColorStop(0.5, "#dba8a4");
      g.addColorStop(1, "#c9787f");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, r.width, r.height);
      ctx.fillStyle = "rgba(255,255,255,.4)";
      for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * r.width, Math.random() * r.height, 0.4 + Math.random() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#fff";
      ctx.font = "italic 500 24px 'Cormorant Garamond', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("scratch here ✨", r.width / 2, r.height / 2);
    }
    function scratch(e) {
      const r = canvas.getBoundingClientRect();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(e.clientX - r.left, e.clientY - r.top, 24, 0, Math.PI * 2);
      ctx.fill();
      if (++moves % 8 === 0) check();
    }
    function check() {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 64) { total++; if (data[i] === 0) clear++; }
      if (total && clear / total > 0.45) reveal();
    }
    function reveal() {
      if (done) return;
      done = true;
      box.classList.add("revealed");
      $(".closing").classList.add("scratched");
      const r = box.getBoundingClientRect();
      fx.burst(r.left + r.width / 2, r.top + r.height / 2, 160);
      fx.rain(160);
      chime();
    }
    canvas.tabIndex = 0;
    canvas.addEventListener("pointerdown", (e) => {
      if (done) return;
      drawing = true;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
      scratch(e);
    });
    canvas.addEventListener("pointermove", (e) => { if (drawing && !done) scratch(e); });
    canvas.addEventListener("pointerup", () => { drawing = false; if (!done) check(); });
    canvas.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reveal(); } });
    addEventListener("resize", paint);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(paint);
  })();

  // ---------- reveal on scroll ----------
  const revealObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealObserver.unobserve(e.target);
      }
    }
  }, { threshold: 0.25 });

  // ---------- lazy media: load a whole gallery once it nears the viewport ----------
  function hydrate(el) {
    if (el.tagName === "IMG") {
      el.addEventListener("load", () => el.classList.add("loaded"), { once: true });
      el.src = el.dataset.src;
    } else {
      // #t=0.1 makes iOS Safari show the first frame instead of a black box
      el.preload = "metadata";
      el.src = el.dataset.src + "#t=0.1";
    }
  }
  const lazyObserver = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.querySelectorAll("[data-src]").forEach(hydrate);
      lazyObserver.unobserve(e.target);
    }
  }, { rootMargin: "120% 0px 120% 0px" });

  // Pause any video once it scrolls out of view
  const videoObserver = new IntersectionObserver((entries) => {
    for (const e of entries) if (!e.isIntersecting && !e.target.paused) e.target.pause();
  }, { threshold: 0.2 });

  // Only one video plays at a time
  document.addEventListener("play", (ev) => {
    document.querySelectorAll("video").forEach((v) => { if (v !== ev.target) v.pause(); });
  }, true);

  // ---------- builders ----------
  function buildMedia(item) {
    const slide = h("div", "slide");
    if (item.type === "image") {
      const img = h("img");
      img.alt = "";
      img.decoding = "async";
      img.dataset.src = item.src;
      img.addEventListener("click", () => openLightbox(item.src));
      slide.append(img);
    } else {
      const v = h("video");
      v.controls = true;
      v.playsInline = true;
      v.preload = "none";
      v.dataset.src = item.src;
      videoObserver.observe(v);
      slide.append(v);
    }
    return slide;
  }

  function buildGallery(media) {
    const gallery = h("div", "gallery");
    const track = h("div", "track");
    media.forEach((m) => track.append(buildMedia(m)));
    gallery.append(track);
    lazyObserver.observe(gallery);
    if (media.length < 2) return gallery;

    gallery.classList.add("multi");
    const dots = h("div", "dots");
    const go = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: "smooth" });
    media.forEach((_, i) => {
      const b = h("button");
      b.setAttribute("aria-label", `Show ${i + 1}`);
      b.addEventListener("click", () => go(i));
      dots.append(b);
    });
    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    const sync = () => {
      const i = current();
      [...dots.children].forEach((d, j) => d.classList.toggle("active", i === j));
    };
    track.addEventListener("scroll", () => requestAnimationFrame(sync), { passive: true });
    sync();

    const prev = h("button", "nav prev", "‹");
    const next = h("button", "nav next", "›");
    prev.setAttribute("aria-label", "Previous");
    next.setAttribute("aria-label", "Next");
    prev.addEventListener("click", () => go(Math.max(0, current() - 1)));
    next.addEventListener("click", () => go(Math.min(media.length - 1, current() + 1)));
    gallery.append(prev, next, dots);
    return gallery;
  }

  // A note with **bold** and *italic* rendered (built from text nodes, never HTML)
  function buildNote(text) {
    const p = h("p", "note");
    for (const part of text.split(/(\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*)/)) {
      if (/^\*\*.+\*\*$/.test(part)) p.append(h("strong", null, part.slice(2, -2)));
      else if (/^\*.+\*$/.test(part)) p.append(h("em", null, part.slice(1, -1)));
      else if (part) p.append(part);
    }
    return p;
  }

  // Text notes first, then one gallery for all photos/videos
  function buildBody(items) {
    const frag = document.createDocumentFragment();
    items.filter((i) => i.type === "text").forEach((i) => frag.append(buildNote(i.text)));
    const media = items.filter((i) => i.type !== "text");
    if (media.length) frag.append(buildGallery(media));
    return { frag, hasMedia: media.length > 0 };
  }

  function buildMessage(msg) {
    const section = h("section", "message reveal");
    const card = h("article", "card");
    const { frag, hasMedia } = buildBody(msg.items);
    if (hasMedia) section.classList.add("has-media");
    card.append(frag);

    const from = h("div", "from");
    const sign = h("div", "sign");
    sign.append(h("small", null, "with love,"), h("div", "name", msg.name));
    from.append(sign, buildAvatar(msg));
    card.append(from);

    if (!hasMedia) addTilt(card); // tilting under a playing video would be annoying
    section.append(card);
    return section;
  }

  // Gentle 3D tilt toward the mouse (desktop only)
  function addTilt(card) {
    if (!canTilt) return;
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--ry", ((e.clientX - r.left) / r.width - 0.5) * 6 + "deg");
      card.style.setProperty("--rx", (0.5 - (e.clientY - r.top) / r.height) * 6 + "deg");
      card.classList.add("tilting");
    });
    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
      card.classList.remove("tilting");
    });
  }

  // Profile picture, or their initial when there isn't one
  function buildAvatar(msg) {
    const av = h("div", "avatar");
    if (msg.avatar) {
      const img = h("img");
      img.alt = "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = msg.avatar;
      img.addEventListener("click", () => openLightbox(msg.avatar));
      av.append(img);
    } else {
      av.classList.add("initial");
      av.textContent = msg.name.trim().charAt(0).toUpperCase();
    }
    return av;
  }

  function buildChapter(relation) {
    const section = h("section", "chapter reveal");
    const inner = h("div");
    // one span per word so they can drift in one after another
    const title = h("h2");
    (CHAPTERS[relation] || "").split(" ").forEach((word, i) => {
      const w = h("span", "w", word);
      w.style.setProperty("--i", i);
      title.append(w, " ");
    });
    inner.append(title, h("div", "ornament", "✦ ✦ ✦"));
    section.append(inner);
    return section;
  }

  // ---------- lightbox ----------
  const lb = $("#lightbox");
  function openLightbox(src) {
    $("img", lb).src = src;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lb.hidden = true;
    $("img", lb).removeAttribute("src");
    document.body.style.overflow = "";
  }
  lb.addEventListener("click", closeLightbox);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lb.hidden) closeLightbox(); });

  // ---------- background music ----------
  // Loops content/music.*; fades out while any video plays, back in after.
  const MUSIC_VOLUME = 0.5;
  function setupMusic(src) {
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    const btn = $("#music");
    btn.hidden = false;
    let wanted = false; // set by her choice at the start, then by the ♪ button
    let fadeTimer;

    const videoPlaying = () =>
      [...document.querySelectorAll("video")].some((v) => !v.paused && !v.ended);
    const sync = () => {
      btn.classList.toggle("on", !audio.paused);
      btn.setAttribute("aria-pressed", String(wanted));
    };

    // Fixed number of steps: iOS ignores volume changes, so never wait on it
    function fade(to, done) {
      clearInterval(fadeTimer);
      const from = audio.volume, steps = 20;
      let i = 0;
      fadeTimer = setInterval(() => {
        i++;
        audio.volume = i >= steps ? to : Math.min(1, Math.max(0, from + (to - from) * (i / steps)));
        if (i >= steps) { clearInterval(fadeTimer); if (done) done(); }
      }, 40);
    }
    function start() {
      if (!wanted || videoPlaying() || document.hidden) return;
      if (audio.paused) audio.volume = 0;
      audio.play().then(() => fade(MUSIC_VOLUME)).catch(() => {});
    }
    function stop() {
      fade(0, () => { audio.pause(); });
    }

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    btn.addEventListener("click", () => {
      wanted = !wanted;
      soundOn = wanted; // game sounds follow too
      if (wanted) unlockAudio();
      wanted ? start() : stop();
      sync();
    });

    // Videos take priority
    document.addEventListener("play", (e) => { if (e.target.tagName === "VIDEO") stop(); }, true);
    const resume = (e) => { if (e.target.tagName === "VIDEO" && !videoPlaying()) start(); };
    document.addEventListener("pause", resume, true);
    document.addEventListener("ended", resume, true);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) audio.pause(); else start();
    });

    sync();
    // called from her "Start with music" tap, which lets the browser play sound
    return { play() { wanted = true; start(); sync(); } };
  }

  // ---------- render ----------
  function render(data) {
    if (data.music) music = setupMusic(data.music);
    journeyReady(!!music);

    const root = $("#messages");
    for (const group of data.groups) {
      root.append(buildChapter(group.relation));
      for (const msg of group.messages) root.append(buildMessage(msg));
    }

    const closingBody = $("#closing-body");
    if (data.closing && data.closing.length) {
      closingBody.append(buildBody(data.closing).frag);
    } else {
      closingBody.append(h("p", "note",
        "Add your note as content/kunal_msg.txt and it will appear here."));
    }

    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  }

  fetch("manifest.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(render)
    .catch((err) => {
      console.error(err);
      journeyReady(!!music); // never leave her stuck at the start
      $("#messages").append(h("p", "note",
        "Couldn't load messages. Run `python3 build.py` and open the site from the dist/ folder."));
    });
})();
