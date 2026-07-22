// ---------- Site content (Sanity CMS, with local JSON fallback) ----------
// Client edits live in Sanity Studio: Site Settings (availability toggle) +
// Projects. Published changes hit the CDN in ~60s — no redeploy needed.
// Set SANITY_PROJECT_ID after creating the project (studio/.env + here).
const SANITY_PROJECT_ID = "tpny8o4s"; // from sanity.io/manage
const SANITY_DATASET = "production";
const SANITY_API_VERSION = "2024-01-01";

const SANITY_QUERY = encodeURIComponent(`{
  "available": coalesce(*[_id == "siteSettings"][0].available, true),
  "projects": *[_type == "project"] | order(order asc) {
    name, service, year, industry, website, websiteUrl,
    "media": media.asset->url
  }
}`);

let site = { available: true, projects: [] };
let projectIndex = 0;

function renderAvailability() {
  const pill = document.getElementById("availability");
  const label = document.getElementById("availability-label");
  pill.classList.toggle("is-off", !site.available);
  label.textContent = site.available
    ? "AVAILABLE FOR PROJECTS"
    : "NOT AVAILABLE";
}

// ---------- Text scramble (decode) effect ----------
// Characters appear left to right as cycling random glyphs, each locking
// into its final letter after a short hold — mono font keeps layout stable.
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@/.-:";

function scramble(el, finalText, { step = 26, hold = 130, delay = 0 } = {}) {
  cancelAnimationFrame(el._scrambleRaf);
  clearTimeout(el._scrambleDelay);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    el.textContent = finalText;
    return;
  }
  const run = () => {
    const t0 = performance.now();
    const tick = (now) => {
      const t = now - t0;
      let out = "";
      let settled = true;
      for (let i = 0; i < finalText.length; i++) {
        const appearAt = i * step;
        if (t < appearAt) {
          settled = false;
          break; // later chars haven't appeared yet
        }
        if (finalText[i] === " " || t >= appearAt + hold) {
          out += finalText[i];
        } else {
          out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
          settled = false;
        }
      }
      el.textContent = out;
      if (!settled) {
        el._scrambleRaf = requestAnimationFrame(tick);
      } else {
        el.textContent = finalText;
      }
    };
    el._scrambleRaf = requestAnimationFrame(tick);
  };
  if (delay > 0) {
    el._scrambleDelay = setTimeout(run, delay);
  } else {
    run();
  }
}

// Reverse decode — characters dissolve into glyphs and clear right to left.
// Same rhythm as the intro scramble (step 26 / hold 130), just in reverse.
const OUT_STEP = 26;
const OUT_HOLD = 130;

function scrambleOut(el, { delay = 0 } = {}) {
  cancelAnimationFrame(el._scrambleRaf);
  clearTimeout(el._scrambleDelay);
  const finalText = el.textContent;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !finalText) {
    el.textContent = "";
    return;
  }
  const L = finalText.length;
  const run = () => {
    const t0 = performance.now();
    const tick = (now) => {
      const t = now - t0;
      let out = "";
      for (let i = 0; i < L; i++) {
        const startAt = (L - 1 - i) * OUT_STEP; // rightmost chars go first
        if (t >= startAt + OUT_HOLD) break; // this char and the rest are gone
        if (t >= startAt && finalText[i] !== " ") {
          out += SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
        } else {
          out += finalText[i];
        }
      }
      el.textContent = out;
      if (out) el._scrambleRaf = requestAnimationFrame(tick);
    };
    el._scrambleRaf = requestAnimationFrame(tick);
  };
  if (delay > 0) {
    el._scrambleDelay = setTimeout(run, delay);
  } else {
    run();
  }
}

function projectTextTargets(p) {
  return [
    [document.getElementById("p-name"), p.name || ""],
    [document.getElementById("p-service"), p.service || ""],
    [document.getElementById("p-year"), p.year || ""],
    [document.getElementById("p-industry"), p.industry || ""],
    [document.getElementById("p-website"), p.website || ""],
  ];
}

function syncWebsiteLink(p) {
  const el = document.getElementById("p-website");
  const url = p?.websiteUrl || "";
  if (url) {
    el.href = url;
    el.target = "_blank";
    el.rel = "noopener noreferrer";
    el.classList.remove("is-disabled");
  } else {
    el.removeAttribute("href");
    el.removeAttribute("target");
    el.removeAttribute("rel");
    el.classList.add("is-disabled");
  }
}

function setProjectMedia(imageBoxEl, p) {
  imageBoxEl.classList.remove("is-swapping", "is-mixing");
  imageBoxEl.innerHTML = "";
  if (!p?.media) return;
  const isVideo = /\.(mp4|webm|mov)$/i.test(p.media);
  const el = document.createElement(isVideo ? "video" : "img");
  el.src = p.media;
  if (isVideo) {
    el.autoplay = true;
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
  } else {
    el.alt = p.name;
  }
  imageBoxEl.appendChild(el);
}

function createShowreelEl() {
  const showreel = document.getElementById("showreel");
  const el = document.createElement("video");
  el.src = showreel?.currentSrc || showreel?.src || "assets/showreel.mp4";
  el.autoplay = true;
  el.muted = true;
  el.loop = true;
  el.playsInline = true;
  if (showreel && Number.isFinite(showreel.currentTime)) {
    try {
      el.currentTime = showreel.currentTime;
    } catch (_) {
      /* ignore seek before metadata */
    }
  }
  el.play().catch(() => {});
  return el;
}

const MEDIA_SWAP_MS = 600;
const MORPH_MS = 520;

function swapImageBoxMedia(imageBoxEl, applyMedia, { transition = false } = {}) {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  clearTimeout(imageBoxEl._swapTimer);
  imageBoxEl.classList.remove("is-mixing");

  if (!transition || reduceMotion) {
    imageBoxEl.classList.remove("is-swapping");
    applyMedia(imageBoxEl);
    return;
  }

  // Project swipe — blur out through white, then fade new media in
  imageBoxEl.classList.add("is-swapping");
  imageBoxEl._swapTimer = setTimeout(() => {
    applyMedia(imageBoxEl);
    requestAnimationFrame(() => {
      imageBoxEl.classList.remove("is-swapping");
    });
  }, MEDIA_SWAP_MS);
}

// Close morph — stack showreel over current media and crossfade/blur mix (no white)
function mixImageBoxToShowreel(imageBoxEl) {
  clearTimeout(imageBoxEl._swapTimer);
  imageBoxEl.classList.remove("is-swapping");

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    imageBoxEl.innerHTML = "";
    imageBoxEl.appendChild(createShowreelEl());
    return;
  }

  [...imageBoxEl.children].forEach((child) => {
    child.classList.add("media-outgoing");
  });

  const incoming = createShowreelEl();
  incoming.classList.add("media-incoming");
  imageBoxEl.appendChild(incoming);

  // Paint opacity:0 first, then mix so both medias blend mid-morph
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      imageBoxEl.classList.add("is-mixing");
    });
  });
}

function renderProject(i, { decode = false, mediaTransition = false } = {}) {
  const p = site.projects[i];
  if (!p) return;
  syncWebsiteLink(p);
  projectTextTargets(p).forEach(([el, text], idx) => {
    if (decode) {
      scramble(el, text, { delay: idx * 45 });
    } else {
      el.textContent = text;
    }
  });

  swapImageBoxMedia(
    document.getElementById("image-box"),
    (box) => setProjectMedia(box, p),
    { transition: mediaTransition },
  );
}

function applySite(data) {
  site = {
    available: data?.available !== false,
    projects: Array.isArray(data?.projects) ? data.projects : [],
  };
  projectIndex = 0;
  renderAvailability();
  renderProject(0);
}

function loadFromJson() {
  return fetch("content/site.json")
    .then((r) => r.json())
    .then(applySite);
}

function loadSite() {
  if (!SANITY_PROJECT_ID || SANITY_PROJECT_ID === "REPLACE_ME") {
    return loadFromJson().catch((err) =>
      console.warn("site.json failed to load:", err),
    );
  }

  const url =
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}` +
    `/data/query/${SANITY_DATASET}?query=${SANITY_QUERY}`;

  return fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`Sanity ${r.status}`);
      return r.json();
    })
    .then(({ result }) => applySite(result))
    .catch((err) => {
      console.warn("Sanity fetch failed, falling back to site.json:", err);
      return loadFromJson().catch((e) =>
        console.warn("site.json failed to load:", e),
      );
    });
}

loadSite();

// ---------- Live NYC clock (Luxon) ----------
const clockEl = document.getElementById("clock");

function updateClock() {
  const now = luxon.DateTime.now().setZone("America/New_York");
  clockEl.textContent = now
    .toFormat("h:mm a")
    .replace("AM", "A.M.")
    .replace("PM", "P.M.");
}

updateClock();
setInterval(updateClock, 1000);

// ---------- Project modal morph ----------
// The landing dark box glides into the modal's image box (FLIP transform),
// while the light panel is revealed by an expanding clip-path window.
const frame = document.querySelector(".frame");
const darkBox = document.getElementById("dark-box");
const modalLayer = document.getElementById("modal-layer");
const modal = document.getElementById("modal");
const imageBox = document.getElementById("image-box");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");

// Collapse the modal onto the dark box: clip the panel down to the dark box
// rect and transform the image box onto it.
function setCollapsed() {
  const dark = darkBox.getBoundingClientRect();
  const panel = modal.getBoundingClientRect();
  const img = imageBox.getBoundingClientRect();

  modal.style.clipPath = `inset(${dark.top - panel.top}px ${panel.right - dark.right}px ${panel.bottom - dark.bottom}px ${dark.left - panel.left}px round 12px)`;

  const dx = dark.left - img.left;
  const dy = dark.top - img.top;
  const sx = dark.width / img.width;
  const sy = dark.height / img.height;
  imageBox.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
}

function setExpanded() {
  modal.style.clipPath = "inset(0px 0px 0px 0px round 12px)";
  imageBox.style.transform = "none";
}

// Pending close cleanup — must be cancellable: interrupting the close
// transition fires "transitioncancel", not "transitionend", so a stale
// listener would otherwise fire at the end of the NEXT open animation.
let closeCleanup = null;
let closeCleanupTimer = null;
let closePhaseTimer = null;
let isClosing = false;

function cancelCloseCleanup() {
  if (closeCleanup) {
    modal.removeEventListener("transitionend", closeCleanup);
    closeCleanup = null;
  }
  clearTimeout(closeCleanupTimer);
  clearTimeout(closePhaseTimer);
  clearTimeout(imageBox._swapTimer);
  clearTimeout(imageBox._mixTimer);
  imageBox.classList.remove("is-swapping", "is-mixing");
}

function openModal() {
  cancelCloseCleanup();
  isClosing = false;

  // Restore project media (close may have left a mixed/showreel stack in the slot)
  const p = site.projects[projectIndex];
  if (p) {
    syncWebsiteLink(p);
    setProjectMedia(imageBox, p);
  }

  modalLayer.hidden = false;

  // Start collapsed on the dark box, without animating
  modal.classList.add("no-anim");
  imageBox.style.transform = "none"; // measure at rest
  setCollapsed();
  modal.getBoundingClientRect(); // force reflow

  // Swap the real dark box for the morphing image box, then expand
  modal.classList.remove("no-anim");
  darkBox.style.visibility = "hidden";
  document.getElementById("showreel")?.pause();
  frame.classList.add("is-open");
  setExpanded();

  // Decode the details in once the panel is revealing (labels + values)
  modalTextTargets().forEach(([el, text], i) => {
    el.textContent = "";
    scramble(el, text, { delay: 220 + i * 40 });
  });
}

// The 8 modal text lines in reading order, with their current target text
function modalTextTargets() {
  const p = site.projects[projectIndex] || {};
  return [
    [document.getElementById("p-name"), p.name || ""],
    [modal.querySelector(".row.service .row-label"), "SERVICE"],
    [document.getElementById("p-service"), p.service || ""],
    [modal.querySelector(".row.year .row-label"), "YEAR"],
    [document.getElementById("p-year"), p.year || ""],
    [modal.querySelector(".row.industry .row-label"), "INDUSTRY"],
    [document.getElementById("p-industry"), p.industry || ""],
    [document.getElementById("p-website"), p.website || ""],
  ];
}

function closeModal() {
  if (!frame.classList.contains("is-open") || isClosing) return;
  isClosing = true;

  // Phase 1 — decode the details out, bottom line first (mirror of the entry)
  const els = modalTextTargets().map(([el]) => el).reverse();
  let outTotal = 0;
  els.forEach((el, i) => {
    const delay = i * 40; // same line stagger as the intro
    outTotal = Math.max(outTotal, delay + el.textContent.length * OUT_STEP + OUT_HOLD);
    scrambleOut(el, { delay });
  });
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) outTotal = 0;

  // Phase 2 — morph back; media mix runs mid-morph (not before)
  clearTimeout(closePhaseTimer);
  closePhaseTimer = setTimeout(startCollapse, outTotal + 60);
}

function startCollapse() {
  frame.classList.remove("is-open");
  setCollapsed();

  // Mid-morph (~35% in): crossfade/blur mix project media ↔ studio showreel
  clearTimeout(imageBox._mixTimer);
  imageBox._mixTimer = setTimeout(() => {
    mixImageBoxToShowreel(imageBox);
  }, Math.round(MORPH_MS * 0.35));

  const cleanup = () => {
    cancelCloseCleanup();
    isClosing = false;
    darkBox.style.visibility = "";
    document.getElementById("showreel")?.play().catch(() => {});
    modalLayer.hidden = true;
    modal.classList.add("no-anim");
    setExpanded();
    modal.getBoundingClientRect();
    modal.classList.remove("no-anim");
  };
  closeCleanup = (e) => {
    if (e.propertyName === "clip-path") cleanup();
  };
  modal.addEventListener("transitionend", closeCleanup);
  // fallback in case transitionend is missed (e.g. hidden/throttled tab)
  closeCleanupTimer = setTimeout(cleanup, 700);
}

openBtn.addEventListener("click", openModal);
closeBtn.addEventListener("click", closeModal);

// Click outside the project panel (backdrop) to close
modalLayer.addEventListener("click", (e) => {
  if (e.target === modalLayer) closeModal();
});

// Modal NEXT — cycle through projects, decoding text + blur-fading media
document.getElementById("next-btn").addEventListener("click", () => {
  if (site.projects.length < 2) return;
  projectIndex = (projectIndex + 1) % site.projects.length;
  renderProject(projectIndex, { decode: true, mediaTransition: true });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && frame.classList.contains("is-open")) closeModal();
});

// Info email — copy + scramble confirmation
const EMAIL_ADDRESS = "OFFICE@ARCTICRESEARCH.STUDIO";
const emailEl = document.getElementById("info-email");
let emailCopyBusy = false;

emailEl.addEventListener("click", async () => {
  if (emailCopyBusy) return;
  emailCopyBusy = true;
  try {
    await navigator.clipboard.writeText(EMAIL_ADDRESS);
  } catch {
    // Fallback for older browsers / denied permission
    const ta = document.createElement("textarea");
    ta.value = EMAIL_ADDRESS;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;left:-9999px;top:0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (_) {
      /* ignore */
    }
    document.body.removeChild(ta);
  }

  scramble(emailEl, "EMAIL COPIED");
  clearTimeout(emailEl._restoreTimer);
  emailEl._restoreTimer = setTimeout(() => {
    scramble(emailEl, EMAIL_ADDRESS);
    const settleMs = EMAIL_ADDRESS.length * 26 + 130 + 80;
    setTimeout(() => {
      emailCopyBusy = false;
    }, settleMs);
  }, 1600);
});
