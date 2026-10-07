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

  // Text notes first, then one gallery for all photos/videos
  function buildBody(items) {
    const frag = document.createDocumentFragment();
    items.filter((i) => i.type === "text").forEach((i) => frag.append(h("p", "note", i.text)));
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

    section.append(card);
    return section;
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
    inner.append(h("h2", null, CHAPTERS[relation] || ""), h("div", "ornament", "✦ ✦ ✦"));
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
    let wanted = true; // false once she mutes it
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
      audio.play().then(() => { btn.classList.remove("intro"); fade(MUSIC_VOLUME); }).catch(() => {});
    }
    function stop() {
      fade(0, () => { audio.pause(); });
    }

    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    btn.addEventListener("click", () => {
      // first tap (autoplay was blocked) means "play", not "mute"
      if (wanted && audio.paused && !videoPlaying()) return start();
      wanted = !wanted;
      wanted ? start() : stop();
      sync();
    });

    // Browsers only allow sound after a tap/click, so start on the first one
    const firstTouch = (e) => {
      if (btn.contains(e.target)) return;
      document.removeEventListener("pointerdown", firstTouch, true);
      document.removeEventListener("keydown", firstTouch, true);
      start();
    };
    document.addEventListener("pointerdown", firstTouch, true);
    document.addEventListener("keydown", firstTouch, true);

    // Videos take priority
    document.addEventListener("play", (e) => { if (e.target.tagName === "VIDEO") stop(); }, true);
    const resume = (e) => { if (e.target.tagName === "VIDEO" && !videoPlaying()) start(); };
    document.addEventListener("pause", resume, true);
    document.addEventListener("ended", resume, true);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) audio.pause(); else start();
    });

    start(); // works where the browser allows autoplay
    sync();
  }

  // ---------- render ----------
  function render(data) {
    if (data.music) setupMusic(data.music);

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
      $("#messages").append(h("p", "note",
        "Couldn't load messages. Run `python3 build.py` and open the site from the dist/ folder."));
    });
})();
