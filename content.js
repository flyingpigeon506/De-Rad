// content.js — hides political content and replaces with clean content

const KEYWORDS = [
   "trump", "biden", "j.d. vance", "harris", "republican", "democrat",
  "election", "congress", "senate", "campaign", "ballot",
  "liberal", "conservative", "maga", "woke", "partisan",
  "gop", "pelosi", "mcconnell", "white house", "oval office",
  "far-right", "far-left", "right-wing", "left-wing", "political", 
  "politician", "policy","supreme court", "governor", "dhs", "immigration",
  "pentagon"< "secret service"
];

const CARD_TAGS = [
  "article", "li",
  "ytd-rich-item-renderer", "ytd-video-renderer",
  "ytd-compact-video-renderer", "ytd-grid-video-renderer",
  "ytd-reel-item-renderer", "ytd-shelf-renderer",
  "shreddit-post", "reddit-feed-item"
];

const ARTICLE_PATTERNS = [
  /\/article/, /\/story/, /\/news/,
  /\/\d{4}\/\d{2}\/\d{2}\//,
  /[?&]v=/, /\/watch/, /\/post/, /\/comments/,
];

function isArticlePage() {
  return ARTICLE_PATTERNS.some(p => p.test(window.location.href));
}

function isPolitical(text) {
  const lower = text.toLowerCase();
  return KEYWORDS.some(word => lower.includes(word));
}

// Find all cards on the page — try multiple selectors
function getAllCards() {
  const selectors = CARD_TAGS.join(", ");
  let cards = Array.from(document.querySelectorAll(selectors));

  //looks for clickable image and link if not identified as "card"
  if (cards.length === 0) {
    const divs = Array.from(document.querySelectorAll("div"));
    cards = divs.filter(el => {
      return el.querySelector("img") && el.querySelector("a") && el.offsetHeight > 50;
    });
  }

  return cards;
}

function getContainer(el) {
  let current = el.parentElement;
  let best = el;
  while (current && current !== document.body) {
    const tag = current.tagName.toLowerCase();
    if (CARD_TAGS.includes(tag)) return current;
    if (current.querySelector("img, [style*='background-image']")) {
      best = current;
      break;
    }
    current = current.parentElement;
  }
  return best;
}


function hideElement(el) {
  if (el.dataset.derad) return;
  const container = getContainer(el);
  if (container.dataset.derad) return;
  container.dataset.derad = "true";
  replaceWithCleanCard(container);
}

function scanPage() {
  if (isArticlePage()) return;

  document.querySelectorAll([
    "p", "h1", "h2", "h3", "h4", "a", "span",
    "#video-title", "#video-title-link",
    "yt-formatted-string", ".ytd-rich-grid-media"
  ].join(", ")).forEach(el => {
    const text = el.textContent || "";
    if (text.length > 20 && isPolitical(text)) {
      hideElement(el);
    }
  });
}

chrome.storage.sync.get("enabled", ({ enabled }) => {
  if (enabled === false) return;
  if (isArticlePage()) return;

  // Wait for page to load then scan
  setTimeout(scanPage, 1500);

  new MutationObserver(scanPage).observe(document.body, {
    childList: true, subtree: true, characterData: true
  });
});
