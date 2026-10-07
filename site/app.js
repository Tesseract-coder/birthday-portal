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
    from.append(h("small", null, "with love,"), h("div", "name", msg.name));
    card.append(from);

    section.append(card);
    return section;
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

  // ---------- render ----------
  function render(data) {
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
