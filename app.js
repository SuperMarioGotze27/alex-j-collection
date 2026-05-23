const state = {
  posts: [],
  filtered: [],
  filter: "All",
  query: "",
  sort: "newest",
  activePost: null,
  activeImage: 0,
};

let backgroundAudio = null;

const els = {
  statPosts: document.querySelector("#statPosts"),
  statImages: document.querySelector("#statImages"),
  statSigned: document.querySelector("#statSigned"),
  statClubs: document.querySelector("#statClubs"),
  marqueeTrack: document.querySelector("#marqueeTrack"),
  featuredGrid: document.querySelector("#featuredGrid"),
  accordionPanels: document.querySelector("#accordionPanels"),
  filterRail: document.querySelector("#filterRail"),
  cardsGrid: document.querySelector("#cardsGrid"),
  resultCount: document.querySelector("#resultCount"),
  searchInput: document.querySelector("#searchInput"),
  sortButtons: document.querySelectorAll(".sort-button"),
  dialog: document.querySelector("#detailDialog"),
  dialogImage: document.querySelector("#dialogImage"),
  dialogDate: document.querySelector("#dialogDate"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogMeta: document.querySelector("#dialogMeta"),
  dialogCaption: document.querySelector("#dialogCaption"),
  dialogTags: document.querySelector("#dialogTags"),
  dialogLink: document.querySelector("#dialogLink"),
  thumbRail: document.querySelector("#thumbRail"),
  closeDialog: document.querySelector(".dialog-close"),
  nextImage: document.querySelector(".gallery-button.next"),
  previousImage: document.querySelector(".gallery-button.previous"),
  siteHeader: document.querySelector(".site-header"),
  musicToggle: document.querySelector("#musicToggle"),
};

const curatedFilters = [
  "All",
  "Signed",
  "Match worn",
  "Squad signed",
  "AC Milan",
  "Manchester United",
  "Chelsea",
  "Borussia Dortmund",
  "Barcelona",
  "Liverpool",
  "Argentina",
  "Hong Kong",
  "London",
  "2025",
];

const metadataFixes = new Map([
  ["DLVu84XSWyF", { player: "Alex Scott", teams: ["Bristol City"], dropTags: ["England"] }],
  ["DGNKPgGOX6g", { player: "Zlatan Ibrahimovic", location: "NYC", teams: ["AC Milan"] }],
  ["DRhikp9EXXX", { player: "Olivier Giroud", location: "LA", teams: ["AC Milan"] }],
  ["DRgZxE-jLzd", { player: "Nico Paz", teams: ["Como"] }],
  ["DOebLzKAZrI", { player: "Michael Owen", location: "Hong Kong", teams: ["Manchester United"] }],
  ["DOebE05AcI4", { player: "Manu Kone", teams: ["Borussia Monchengladbach"], dropTags: ["Manchester United", "FC Augsburg"] }],
  ["DOeauRiAWUU", { player: "Joao Palhinha", teams: ["Fulham"] }],
  ["DOeaZZHgZO-", { player: "Rivaldo", teams: ["AC Milan"] }],
  ["DOeaSTnAXRW", { player: "Cafu", teams: ["AC Milan"] }],
  ["DOeaIGegYEs", { player: "Nemanja Vidic", teams: ["Manchester United"] }],
  ["DOeaAxVAWFn", { player: "Diego Forlan", teams: ["Manchester United"] }],
  ["DOeZs-LgfSA", { player: "Sandro Tonali", teams: ["AC Milan"] }],
  ["DK8nT_cRuTP", { player: "Darwin Nunez", teams: ["Benfica"], dropTags: ["Liverpool"] }],
  ["DK8nInPxC20", { player: "Raul Jimenez", teams: ["Mexico"], dropTags: ["Fulham"] }],
  ["DK8m0H7xCyB", { player: "Giorgio Chiellini" }],
  ["DKye5lCuXal", { player: "N'Golo Kante", teams: ["Chelsea"] }],
  ["DKyehMGuHqS", { player: "Jude Bellingham", teams: ["Borussia Dortmund"] }],
  ["DKVQEKmSl70", { player: "Desire Doue", teams: ["Stade Rennais"] }],
  ["DHSnWAquK62", { player: "Rafael Varane", teams: ["Manchester United"] }],
  ["DHSnIuGOZ1x", { player: "Kobbie Mainoo", teams: ["Manchester United"] }],
  ["DHSm-McOGNW", { player: "Khvicha Kvaratskhelia", teams: ["Napoli"], dropTags: ["Stade Brestois"] }],
  ["DHSmtIAObiK", { player: "Rafael Leao", teams: ["AC Milan"] }],
  ["DHSmh3cu0qO", { player: "Marco Reus", teams: ["Borussia Dortmund"] }],
  ["DHSmYv-uhEb", { player: "Michael Carrick", teams: ["Manchester United"], dropTags: ["Bristol City"] }],
  ["DHSmTXAu9rh", { player: "Thiago Silva", teams: ["Chelsea"] }],
  ["DHSmL-bu1vL", { player: "Ryan Giggs", teams: ["Manchester United"] }],
  ["DHSmCyaOWj7", { player: "Pedri", teams: ["Barcelona"] }],
  ["DHSj6wAu7eC", { player: "Erling Haaland", teams: ["Manchester City"] }],
  ["DHM1K7Gxsbo", { player: "Antoine Griezmann", teams: ["Atletico Madrid"] }],
  ["DHM0y3ExaFJ", { player: "Alexis Mac Allister", teams: ["Argentina"] }],
  ["DHM0LMLRz21", { player: "Harry Kane", teams: ["Tottenham Hotspur"] }],
  ["DHMwpwDSmvP", { player: "Virgil Van Dijk", teams: ["Liverpool"] }],
  ["DGRzXUCRraH", { player: "Andriy Shevchenko", teams: ["AC Milan"] }],
]);

init();

async function init() {
  try {
    const response = await fetch("data/collection.json");
    const collection = await response.json();
    state.posts = collection.posts.map(enhancePost);
    applyInitialViewParams();
    state.filtered = [...state.posts];
    renderStats(collection.source);
    renderMarquee();
    renderFilters();
    renderFeatured();
    renderAccordions();
    renderCards();
    bindEvents();
    updateHeader();
    setupMotion();
    setupMusic();
    refreshIcons();
  } catch (error) {
    if (els.cardsGrid) {
      els.cardsGrid.innerHTML = `<div class="empty-state">Collection data could not be loaded.</div>`;
    }
    console.error(error);
  }
}

function enhancePost(post) {
  const fix = metadataFixes.get(post.code) || {};
  const player = fix.player || post.player;
  const cleanPostLocation = fix.location || cleanLocation(post.location);
  const dropTags = new Set((fix.dropTags || []).map((tag) => tag.toLowerCase()));
  const originalTags = (post.tags || []).filter((tag) => !dropTags.has(tag.toLowerCase()));
  const fixedTags = unique([...(fix.teams || []), ...originalTags]);
  const searchable = [
    post.title,
    player,
    post.caption,
    cleanPostLocation,
    post.year,
    ...fixedTags,
  ].join(" ").toLowerCase();

  return {
    ...post,
    player,
    tags: fixedTags,
    primaryTeam: fix.teams?.[0] || "",
    cleanLocation: cleanPostLocation,
    displayTags: buildDisplayTags({ ...post, tags: fixedTags }),
    searchable,
  };
}

function renderStats(source) {
  if (!els.statPosts || !els.statImages || !els.statSigned || !els.statClubs) return;
  const mediaTotal = state.posts.reduce((sum, post) => sum + post.media.length, 0);
  const signedTotal = state.posts.filter((post) => hasTag(post, "Signed")).length;
  const teams = new Set(state.posts.flatMap((post) => (post.tags || []).filter(isTeamTag)));

  els.statPosts.textContent = source?.postCount || state.posts.length;
  els.statImages.textContent = mediaTotal;
  els.statSigned.textContent = signedTotal;
  els.statClubs.textContent = teams.size;
}

function renderMarquee() {
  if (!els.marqueeTrack) return;
  const selected = state.posts
    .filter((post) => post.media[0]?.src)
    .slice(0, 16);
  const items = [...selected, ...selected].map((post) => `
    <span class="marquee-item">
      <img src="${escapeHtml(post.media[0].src)}" alt="">
      ${escapeHtml(post.player)}
    </span>
  `);
  els.marqueeTrack.innerHTML = items.join("");
}

function renderFilters() {
  if (!els.filterRail) return;
  const available = new Set(["All"]);
  for (const post of state.posts) {
    for (const tag of post.tags || []) available.add(tag);
    if (post.cleanLocation) available.add(post.cleanLocation);
    available.add(String(post.year));
  }

  const filters = curatedFilters.filter((filter) => available.has(filter));
  if (!filters.includes(state.filter) && available.has(state.filter)) {
    filters.push(state.filter);
  }
  els.filterRail.innerHTML = filters.map((filter) => {
    const active = state.filter === filter ? " active" : "";
    return `<button class="filter-chip${active}" type="button" data-filter="${escapeHtml(filter)}">${escapeHtml(filter)}</button>`;
  }).join("");
}

function renderFeatured() {
  if (!els.featuredGrid) return;
  const wanted = ["DGNKPgGOX6g", "DLVu84XSWyF", "DKye5lCuXal", "DKyehMGuHqS", "DGRzXUCRraH", "DHSj6wAu7eC"];
  const featured = wanted
    .map((code) => state.posts.find((post) => post.code === code))
    .filter(Boolean);

  els.featuredGrid.innerHTML = featured.map((post) => `
    <button class="featured-card motion-image" type="button" data-code="${escapeHtml(post.code)}">
      <img src="${escapeHtml(post.media[0]?.src || "")}" alt="${escapeHtml(post.player)} shirt">
      <span class="featured-overlay">
        <span class="quiet-label">${escapeHtml(post.displayTags[0] || "Collection")}</span>
        <h3>${escapeHtml(post.player)}</h3>
        <p>${escapeHtml(cardMeta(post))}</p>
      </span>
    </button>
  `).join("");
}

function renderAccordions() {
  if (!els.accordionPanels) return;
  const groups = [
    {
      title: "Signed shirts",
      filter: "Signed",
      code: "DGNKPgGOX6g",
      copy: "Autographs, dedication notes, and player moments kept with their original photos.",
    },
    {
      title: "Match worn",
      filter: "Match worn",
      code: "DLVu84XSWyF",
      copy: "Pieces tied to a fixture, a pitch, and a real match context.",
    },
    {
      title: "AC Milan",
      filter: "AC Milan",
      code: "DGRzXUCRraH",
      copy: "A red-and-black shelf for Zlatan, Giroud, Rivaldo, Cafu, Tonali, and Shevchenko.",
    },
    {
      title: "Manchester United",
      filter: "Manchester United",
      code: "DOebLzKAZrI",
      copy: "United shirts and signatures gathered across the archive.",
    },
  ];

  els.accordionPanels.innerHTML = groups.map((group) => {
    const post = state.posts.find((item) => item.code === group.code) || state.posts[0];
    return `
      <button class="accordion-card motion-image" type="button" data-filter-jump="${escapeHtml(group.filter)}">
        <img src="${escapeHtml(post.media[0]?.src || "")}" alt="${escapeHtml(group.title)}">
        <span class="accordion-copy">
          <h3>${escapeHtml(group.title)}</h3>
          <p>${escapeHtml(group.copy)}</p>
        </span>
      </button>
    `;
  }).join("");
}

function renderCards() {
  if (!els.cardsGrid) return;
  const query = state.query.trim().toLowerCase();
  state.filtered = state.posts
    .filter((post) => matchesFilter(post, state.filter))
    .filter((post) => !query || post.searchable.includes(query))
    .sort(sortPosts);

  if (els.resultCount) {
    els.resultCount.textContent = `${state.filtered.length} shirts`;
  }

  if (!state.filtered.length) {
    els.cardsGrid.innerHTML = `<div class="empty-state">No shirts match this view.</div>`;
    return;
  }

  els.cardsGrid.innerHTML = state.filtered.map((post) => `
    <button class="shirt-card motion-image" type="button" data-code="${escapeHtml(post.code)}">
      <span class="card-image">
        <img src="${escapeHtml(post.media[0]?.src || "")}" alt="${escapeHtml(post.player)} shirt" loading="lazy">
      </span>
      <span class="card-copy">
        <span class="card-kicker">
          <span>${escapeHtml(formatDate(post.date))}</span>
          <span>${post.media.length} photos</span>
        </span>
        <h3>${escapeHtml(post.player)}</h3>
        <p class="card-meta">${escapeHtml(cardMeta(post))}</p>
        <span class="tag-list">${post.displayTags.slice(0, 3).map(tagMarkup).join("")}</span>
      </span>
    </button>
  `).join("");

  attachCardListeners();
  setupMotion();
  refreshIcons();
}

function bindEvents() {
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (els.searchInput) {
    els.searchInput.value = state.query;
    els.searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderCards();
      syncCollectionUrl();
    });
  }

  if (els.filterRail) {
    els.filterRail.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-filter]");
      if (!chip) return;
      state.filter = chip.dataset.filter;
      renderFilters();
      renderCards();
      syncCollectionUrl();
    });
  }

  if (els.accordionPanels) {
    els.accordionPanels.addEventListener("click", (event) => {
      const card = event.target.closest("[data-filter-jump]");
      if (!card) return;
      jumpToFilter(card.dataset.filterJump);
    });
  }

  els.sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.sort = button.dataset.sort;
      els.sortButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderCards();
    });
  });

  if (els.featuredGrid) {
    els.featuredGrid.addEventListener("click", (event) => {
      const card = event.target.closest("[data-code]");
      if (card) openPost(card.dataset.code);
    });
  }

  if (els.dialog) {
    els.closeDialog?.addEventListener("click", closeDialog);
    els.nextImage?.addEventListener("click", () => moveImage(1));
    els.previousImage?.addEventListener("click", () => moveImage(-1));
    els.dialog.addEventListener("click", (event) => {
      if (event.target === els.dialog) closeDialog();
    });
    els.dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!state.activePost || !els.dialog?.open) return;
    if (event.key === "ArrowRight") moveImage(1);
    if (event.key === "ArrowLeft") moveImage(-1);
  });
}

function attachCardListeners() {
  if (!els.cardsGrid) return;
  els.cardsGrid.querySelectorAll("[data-code]").forEach((card) => {
    card.addEventListener("click", () => openPost(card.dataset.code));
  });
}

function openPost(code) {
  if (!els.dialog) return;
  const post = state.posts.find((item) => item.code === code);
  if (!post) return;

  state.activePost = post;
  state.activeImage = 0;
  renderDialog();
  els.dialog.showModal();
  document.body.classList.add("dialog-open");
  refreshIcons();
}

function closeDialog() {
  els.dialog?.close();
}

function renderDialog() {
  const post = state.activePost;
  const image = post.media[state.activeImage] || post.media[0];

  els.dialogImage.src = image.src;
  els.dialogImage.alt = `${post.player} shirt image ${state.activeImage + 1}`;
  els.dialogDate.textContent = `${formatDate(post.date)} | ${post.media.length} photos`;
  els.dialogTitle.textContent = post.player;
  els.dialogMeta.textContent = cardMeta(post);
  els.dialogCaption.textContent = post.caption;
  els.dialogTags.innerHTML = post.displayTags.map(tagMarkup).join("");
  els.dialogLink.href = post.instagramUrl;
  els.thumbRail.innerHTML = post.media.map((media, index) => `
    <button type="button" class="${index === state.activeImage ? "active" : ""}" data-image="${index}" aria-label="Show image ${index + 1}">
      <img src="${escapeHtml(media.src)}" alt="">
    </button>
  `).join("");

  els.thumbRail.querySelectorAll("[data-image]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeImage = Number(button.dataset.image);
      renderDialog();
      refreshIcons();
    });
  });

  const singleImage = post.media.length <= 1;
  els.nextImage.hidden = singleImage;
  els.previousImage.hidden = singleImage;
}

function moveImage(direction) {
  const post = state.activePost;
  if (!post?.media.length) return;
  state.activeImage = (state.activeImage + direction + post.media.length) % post.media.length;
  renderDialog();
  refreshIcons();
}

function updateHeader() {
  const forceSolidHeader = Boolean(document.querySelector(".collection-page"));
  els.siteHeader?.classList.toggle("is-scrolled", forceSolidHeader || window.scrollY > 80);
}

function applyInitialViewParams() {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get("filter");
  const query = params.get("q");
  if (filter) state.filter = filter;
  if (query) state.query = query;
}

function syncCollectionUrl() {
  if (!els.cardsGrid || !window.history?.replaceState) return;
  const params = new URLSearchParams();
  if (state.filter !== "All") params.set("filter", state.filter);
  if (state.query.trim()) params.set("q", state.query.trim());
  const nextUrl = params.toString() ? `collection.html?${params}` : "collection.html";
  window.history.replaceState({}, "", nextUrl);
}

function jumpToFilter(filter) {
  if (!els.cardsGrid) {
    window.location.href = `collection.html?filter=${encodeURIComponent(filter)}`;
    return;
  }

  state.filter = filter;
  state.query = "";
  if (els.searchInput) els.searchInput.value = "";
  renderFilters();
  renderCards();
  syncCollectionUrl();
  document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" });
}

function setupMusic() {
  const button = els.musicToggle;
  if (!button || backgroundAudio) return;

  const src = button.dataset.audioSrc;
  const label = button.querySelector("span");
  if (!src) return;

  backgroundAudio = new Audio(src);
  backgroundAudio.loop = true;
  backgroundAudio.preload = "auto";
  backgroundAudio.volume = 0.42;
  let firstInteractionArmed = false;

  const setMissing = () => {
    button.classList.add("is-missing");
    button.setAttribute("aria-label", "Background music file has not been added");
    button.title = "Background music file could not be loaded";
    if (label) label.textContent = "Add BGM";
  };

  const setPlaying = () => {
    button.classList.remove("is-blocked");
    button.classList.add("is-playing");
    button.setAttribute("aria-label", "Pause background music");
    button.title = "Pause background music";
    if (label) label.textContent = "Playing";
    removeFirstInteractionStart();
  };

  const setPaused = () => {
    button.classList.remove("is-playing");
    button.setAttribute("aria-label", "Play background music");
    button.title = "Play background music";
    if (label) label.textContent = "BGM";
  };

  const setBlocked = () => {
    button.classList.add("is-blocked");
    button.setAttribute("aria-label", "Start background music");
    button.title = "Browser blocked autoplay. Click once to start music.";
    if (label) label.textContent = "Play BGM";
    addFirstInteractionStart();
  };

  async function startPlayback({ quiet = false } = {}) {
    if (button.classList.contains("is-missing")) return;
    try {
      await backgroundAudio.play();
      setPlaying();
    } catch (error) {
      setBlocked();
      if (!quiet) console.error(error);
    }
  }

  function onFirstInteraction(event) {
    if (button.contains(event.target)) return;
    startPlayback({ quiet: true });
  }

  function addFirstInteractionStart() {
    if (firstInteractionArmed) return;
    firstInteractionArmed = true;
    document.addEventListener("pointerdown", onFirstInteraction, true);
    document.addEventListener("keydown", onFirstInteraction, true);
    document.addEventListener("touchstart", onFirstInteraction, true);
  }

  function removeFirstInteractionStart() {
    if (!firstInteractionArmed) return;
    firstInteractionArmed = false;
    document.removeEventListener("pointerdown", onFirstInteraction, true);
    document.removeEventListener("keydown", onFirstInteraction, true);
    document.removeEventListener("touchstart", onFirstInteraction, true);
  }

  fetch(src, { method: "HEAD", cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        setMissing();
        return;
      }
      setPaused();
      if (button.dataset.autoplay === "true") {
        startPlayback({ quiet: true });
      }
    })
    .catch(setMissing);

  button.addEventListener("click", async () => {
    if (button.classList.contains("is-missing")) return;

    if (backgroundAudio.paused) {
      startPlayback();
    } else {
      backgroundAudio.pause();
      setPaused();
    }
  });
}

function setupMotion() {
  if (!window.gsap || !window.ScrollTrigger) return;
  window.gsap.registerPlugin(window.ScrollTrigger);

  window.gsap.utils.toArray(".motion-image").forEach((item) => {
    if (item.dataset.motionReady) return;
    item.dataset.motionReady = "true";
    window.gsap.fromTo(item, {
      opacity: 0.72,
      scale: 0.94,
    }, {
      opacity: 1,
      scale: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: item,
        start: "top 88%",
        end: "bottom 24%",
        scrub: true,
      },
    });
  });

}

function sortPosts(a, b) {
  if (state.sort === "player") return a.player.localeCompare(b.player);
  if (state.sort === "photos") return b.media.length - a.media.length;
  return new Date(b.date) - new Date(a.date);
}

function matchesFilter(post, filter) {
  if (filter === "All") return true;
  return hasTag(post, filter) || post.cleanLocation === filter || String(post.year) === filter;
}

function cardMeta(post) {
  const parts = [];
  const team = post.primaryTeam || post.displayTags.find((tag) => isTeamTag(tag));
  if (team) parts.push(team);
  if (post.cleanLocation && !isLocationDuplicate(post.cleanLocation, team)) {
    parts.push(post.cleanLocation);
  }
  const type = post.displayTags.find((tag) => ["Signed", "Match worn", "Squad signed", "Player issue", "Special", "Original"].includes(tag));
  if (type) parts.push(type);
  return parts.join(" | ") || post.title;
}

function isLocationDuplicate(location, team) {
  if (!location || !team) return false;
  const cleanLocationValue = normalizeLabel(location);
  const cleanTeamValue = normalizeLabel(team);
  return cleanLocationValue === cleanTeamValue || cleanTeamValue.includes(cleanLocationValue);
}

function buildDisplayTags(post) {
  const tags = unique([
    ...(post.tags || []).filter((tag) => !/football|autograohcollector|signedjersey/i.test(tag)),
  ]);
  return tags.slice(0, 7);
}

function hasTag(post, tag) {
  return (post.tags || []).some((item) => item.toLowerCase() === tag.toLowerCase());
}

function isTeamTag(tag) {
  return [
    "AC Milan",
    "Manchester United",
    "Borussia Dortmund",
    "Chelsea",
    "Liverpool",
    "Manchester City",
    "Tottenham Hotspur",
    "Atletico Madrid",
    "Barcelona",
    "Napoli",
    "Stade Rennais",
    "Benfica",
    "Fulham",
    "Como",
    "Bristol City",
    "Borussia Monchengladbach",
    "FC Augsburg",
    "Stade Brestois",
    "Lyon",
    "Mexico",
    "Argentina",
    "England",
    "LAFC",
  ].includes(tag);
}

function tagMarkup(tag) {
  const className = [
    "tag",
    tag === "Signed" || tag === "Squad signed" ? "signed" : "",
    tag === "Match worn" ? "match" : "",
  ].filter(Boolean).join(" ");

  return `<span class="${className}">${escapeHtml(tag)}</span>`;
}

function cleanLocation(location) {
  if (!location) return "";
  return location
    .replace(/\..*$/, "")
    .replace(/\s+and\s+.*$/i, "")
    .trim();
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeLabel(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
