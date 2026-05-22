const state = {
  posts: [],
  filtered: [],
  filter: "All",
  query: "",
  sort: "newest",
  activePost: null,
  activeImage: 0,
};

const els = {
  statPosts: document.querySelector("#statPosts"),
  statImages: document.querySelector("#statImages"),
  statSigned: document.querySelector("#statSigned"),
  statClubs: document.querySelector("#statClubs"),
  featuredGrid: document.querySelector("#featuredGrid"),
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

const playerDisplayFixes = new Map([
  ["DOebLzKAZrI", "Michael Owen"],
  ["DOebE05AcI4", "Manu Kone"],
  ["DOeauRiAWUU", "Joao Palhinha"],
  ["DOeaIGegYEs", "Nemanja Vidic"],
  ["DOeaAxVAWFn", "Diego Forlan"],
  ["DK8nT_cRuTP", "Darwin Nunez"],
  ["DKVQEKmSl70", "Desire Doue"],
  ["DHSmtIAObiK", "Rafael Leao"],
  ["DHSmL-bu1vL", "Ryan Giggs"],
  ["DHM1K7Gxsbo", "Antoine Griezmann"],
  ["DHM0y3ExaFJ", "Alexis Mac Allister"],
  ["DGRzXUCRraH", "Andriy Shevchenko"],
]);

const locationDisplayFixes = new Map([
  ["DGNKPgGOX6g", "NYC"],
  ["DRhikp9EXXX", "LA"],
  ["DOebLzKAZrI", "Hong Kong"],
]);

init();

async function init() {
  try {
    const response = await fetch("data/collection.json");
    const collection = await response.json();
    state.posts = collection.posts.map(enhancePost);
    state.filtered = [...state.posts];
    renderStats(collection.source);
    renderFilters();
    renderFeatured();
    renderCards();
    bindEvents();
    updateHeader();
    refreshIcons();
  } catch (error) {
    els.cardsGrid.innerHTML = `<div class="empty-state">Collection data could not be loaded.</div>`;
    console.error(error);
  }
}

function enhancePost(post) {
  const player = playerDisplayFixes.get(post.code) || post.player;
  const cleanPostLocation = locationDisplayFixes.get(post.code) || cleanLocation(post.location);
  const searchable = [
    post.title,
    player,
    post.caption,
    cleanPostLocation,
    post.year,
    ...(post.tags || []),
  ].join(" ").toLowerCase();

  return {
    ...post,
    player,
    cleanLocation: cleanPostLocation,
    displayTags: buildDisplayTags(post),
    searchable,
  };
}

function renderStats(source) {
  const mediaTotal = state.posts.reduce((sum, post) => sum + post.media.length, 0);
  const signedTotal = state.posts.filter((post) => hasTag(post, "Signed")).length;
  const teams = new Set(state.posts.flatMap((post) => (post.tags || []).filter(isTeamTag)));

  els.statPosts.textContent = source.postCount || state.posts.length;
  els.statImages.textContent = mediaTotal;
  els.statSigned.textContent = signedTotal;
  els.statClubs.textContent = teams.size;
}

function renderFilters() {
  const available = new Set(["All"]);
  for (const post of state.posts) {
    for (const tag of post.tags || []) available.add(tag);
    if (post.cleanLocation) available.add(post.cleanLocation);
    available.add(String(post.year));
  }

  const filters = curatedFilters.filter((filter) => available.has(filter));
  els.filterRail.innerHTML = filters.map((filter) => {
    const active = state.filter === filter ? " active" : "";
    return `<button class="filter-chip${active}" type="button" data-filter="${escapeHtml(filter)}">${escapeHtml(filter)}</button>`;
  }).join("");
}

function renderFeatured() {
  const wanted = ["DGNKPgGOX6g", "DLVu84XSWyF", "DKye5lCuXal"];
  const featured = wanted
    .map((code) => state.posts.find((post) => post.code === code))
    .filter(Boolean);

  const fallback = state.posts.filter((post) => !featured.includes(post)).slice(0, 3 - featured.length);
  const items = [...featured, ...fallback].slice(0, 3);

  els.featuredGrid.innerHTML = items.map((post) => `
    <button class="featured-card" type="button" data-code="${escapeHtml(post.code)}">
      <img src="${escapeHtml(post.media[0]?.src || "")}" alt="${escapeHtml(post.player)} shirt">
      <span class="featured-overlay">
        <span class="eyebrow">${escapeHtml(post.displayTags[0] || "Collection")}</span>
        <h3>${escapeHtml(post.player)}</h3>
        <p>${escapeHtml(cardMeta(post))}</p>
      </span>
    </button>
  `).join("");
}

function renderCards() {
  const query = state.query.trim().toLowerCase();
  state.filtered = state.posts
    .filter((post) => matchesFilter(post, state.filter))
    .filter((post) => !query || post.searchable.includes(query))
    .sort(sortPosts);

  els.resultCount.textContent = `${state.filtered.length} shirts`;

  if (!state.filtered.length) {
    els.cardsGrid.innerHTML = `<div class="empty-state">No shirts match this view.</div>`;
    return;
  }

  els.cardsGrid.innerHTML = state.filtered.map((post) => `
    <button class="shirt-card" type="button" data-code="${escapeHtml(post.code)}">
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
  refreshIcons();
}

function bindEvents() {
  window.addEventListener("scroll", updateHeader, { passive: true });

  els.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderCards();
  });

  els.filterRail.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-filter]");
    if (!chip) return;
    state.filter = chip.dataset.filter;
    renderFilters();
    renderCards();
  });

  els.sortButtons.forEach((button) => {
    button.addEventListener("click", () => {
      state.sort = button.dataset.sort;
      els.sortButtons.forEach((item) => item.classList.toggle("active", item === button));
      renderCards();
    });
  });

  els.featuredGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-code]");
    if (card) openPost(card.dataset.code);
  });

  els.closeDialog.addEventListener("click", closeDialog);
  els.nextImage.addEventListener("click", () => moveImage(1));
  els.previousImage.addEventListener("click", () => moveImage(-1));
  els.dialog.addEventListener("click", (event) => {
    if (event.target === els.dialog) closeDialog();
  });
  els.dialog.addEventListener("close", () => {
    document.body.classList.remove("dialog-open");
  });

  document.addEventListener("keydown", (event) => {
    if (!state.activePost || !els.dialog.open) return;
    if (event.key === "ArrowRight") moveImage(1);
    if (event.key === "ArrowLeft") moveImage(-1);
  });
}

function updateHeader() {
  els.siteHeader.classList.toggle("is-scrolled", window.scrollY > 120);
}

function attachCardListeners() {
  els.cardsGrid.querySelectorAll("[data-code]").forEach((card) => {
    card.addEventListener("click", () => openPost(card.dataset.code));
  });
}

function openPost(code) {
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
  els.dialog.close();
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
  const team = post.displayTags.find((tag) => isTeamTag(tag));
  if (team) parts.push(team);
  if (post.cleanLocation) parts.push(post.cleanLocation);
  const type = post.displayTags.find((tag) => ["Signed", "Match worn", "Squad signed", "Player issue", "Special", "Original"].includes(tag));
  if (type) parts.push(type);
  return parts.join(" | ") || post.title;
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
