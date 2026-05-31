// lib/sources.ts — The Signal Scout's daily watchlist.
//
// A curated set of REAL, currently-operating AdTech + AI news sources that the
// Signal Scout (Agent 1) watches to assemble the daily intelligence pulse.
//
// Every entry has a real, live homepage `url`. Where a public RSS/Atom feed is
// known and stable, it is provided in `rss` so the Scout can pull structured,
// dedupe-friendly items cheaply. Sources WITHOUT a reliable public feed are still
// listed (url only) because the Scout can browse them directly — `rss` is simply
// omitted rather than guessed.
//
// HOW THE SCOUT SHOULD USE THIS:
//   • Pull every source with an `rss` first (cheap, structured, dedupe-friendly).
//   • Browse the `rss`-less sources (newsrooms behind JS) as a second pass.
//   • Use `weight` (1-5) to rank/throttle: 5 = must-read primary signal, 1 = ambient context.
//   • Use `category` to balance coverage so no single beat dominates the daily pulse.

export interface NewsSource {
  /** Human-readable source name. */
  name: string;
  /** Canonical homepage or section URL (always present, always browsable). */
  url: string;
  /** Public RSS/Atom feed URL. Omitted when the source has no reliable public feed. */
  rss?: string;
  /** Beat this source primarily covers. */
  category: string;
  /** Editorial signal weight, 1 (ambient) … 5 (must-read primary). */
  weight: number;
}

export const SOURCES: NewsSource[] = [
  // ───────────────────────────── AdTech trade ─────────────────────────────
  {
    name: "AdExchanger",
    url: "https://www.adexchanger.com/",
    rss: "https://www.adexchanger.com/feed/",
    category: "AdTech trade",
    weight: 5,
  },
  {
    name: "Digiday",
    url: "https://digiday.com/",
    rss: "https://digiday.com/feed/",
    category: "AdTech trade",
    weight: 5,
  },
  {
    name: "Adweek",
    url: "https://www.adweek.com/",
    rss: "https://www.adweek.com/feed/",
    category: "AdTech trade",
    weight: 4,
  },
  {
    name: "Ad Age",
    url: "https://adage.com/",
    rss: "https://adage.com/rss.xml",
    category: "AdTech trade",
    weight: 4,
  },
  {
    name: "MediaPost",
    url: "https://www.mediapost.com/",
    rss: "https://feeds.mediapost.com/online-media-daily",
    category: "AdTech trade",
    weight: 4,
  },
  {
    name: "The Drum",
    url: "https://www.thedrum.com/",
    rss: "https://www.thedrum.com/rss.xml",
    category: "AdTech trade",
    weight: 3,
  },
  {
    name: "Campaign US",
    url: "https://www.campaignlive.com/us",
    // No reliable public RSS feed — Scout browses the site directly.
    category: "AdTech trade",
    weight: 3,
  },
  {
    name: "ExchangeWire",
    url: "https://www.exchangewire.com/",
    rss: "https://www.exchangewire.com/feed/",
    category: "AdTech trade",
    weight: 4,
  },
  {
    name: "Marketing Dive",
    url: "https://www.marketingdive.com/",
    rss: "https://www.marketingdive.com/feeds/news/",
    category: "AdTech trade",
    weight: 3,
  },

  // ──────────────────────────── AI/ML news ────────────────────────────────
  {
    name: "TechCrunch — AI",
    url: "https://techcrunch.com/category/artificial-intelligence/",
    rss: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "AI/ML news",
    weight: 4,
  },
  {
    name: "VentureBeat",
    url: "https://venturebeat.com/",
    rss: "https://venturebeat.com/feed/",
    category: "AI/ML news",
    weight: 4,
  },
  {
    name: "The Verge",
    url: "https://www.theverge.com/",
    rss: "https://www.theverge.com/rss/index.xml",
    category: "AI/ML news",
    weight: 4,
  },
  {
    name: "Ars Technica",
    url: "https://arstechnica.com/",
    rss: "https://feeds.arstechnica.com/arstechnica/index",
    category: "AI/ML news",
    weight: 4,
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/",
    rss: "https://www.technologyreview.com/feed/",
    category: "AI/ML news",
    weight: 4,
  },
  {
    name: "Wired — AI",
    url: "https://www.wired.com/tag/artificial-intelligence/",
    rss: "https://www.wired.com/feed/tag/ai/latest/rss",
    category: "AI/ML news",
    weight: 3,
  },
  {
    name: "Import AI (Jack Clark)",
    url: "https://importai.substack.com/",
    rss: "https://importai.substack.com/feed",
    category: "AI/ML news",
    weight: 4,
  },
  {
    name: "Hugging Face Blog",
    url: "https://huggingface.co/blog",
    rss: "https://huggingface.co/blog/feed.xml",
    category: "AI/ML news",
    weight: 3,
  },
  {
    name: "Simon Willison's Weblog",
    url: "https://simonwillison.net/",
    rss: "https://simonwillison.net/atom/everything/",
    category: "AI/ML news",
    weight: 3,
  },
  {
    name: "TLDR AI",
    url: "https://tldr.tech/ai",
    rss: "https://tldr.tech/api/rss/ai",
    category: "AI/ML news",
    weight: 3,
  },

  // ─────────────────────────── Platform/Big Tech ──────────────────────────
  {
    name: "OpenAI — News",
    url: "https://openai.com/news/",
    rss: "https://openai.com/news/rss.xml",
    category: "Platform/Big Tech",
    weight: 5,
  },
  {
    name: "Anthropic — News",
    url: "https://www.anthropic.com/news",
    // No reliable first-party RSS feed — Scout browses the newsroom directly.
    category: "Platform/Big Tech",
    weight: 4,
  },
  {
    name: "Google — The Keyword",
    url: "https://blog.google/",
    rss: "https://blog.google/rss/",
    category: "Platform/Big Tech",
    weight: 4,
  },
  {
    name: "Google — Ads & Commerce Blog",
    url: "https://blog.google/products/ads-commerce/",
    rss: "https://blog.google/products/ads-commerce/rss/",
    category: "Platform/Big Tech",
    weight: 5,
  },
  {
    name: "Google DeepMind Blog",
    url: "https://deepmind.google/discover/blog/",
    rss: "https://deepmind.google/blog/rss.xml",
    category: "Platform/Big Tech",
    weight: 4,
  },
  {
    name: "Meta for Business — News",
    url: "https://www.facebook.com/business/news",
    // No reliable public RSS feed — Scout browses the newsroom directly.
    category: "Platform/Big Tech",
    weight: 4,
  },
  {
    name: "Amazon Ads — Blog",
    url: "https://advertising.amazon.com/blog",
    // No public RSS feed — Scout browses the blog directly.
    category: "Platform/Big Tech",
    weight: 4,
  },
  {
    name: "Microsoft — Official Blogs",
    url: "https://blogs.microsoft.com/",
    rss: "https://blogs.microsoft.com/feed/",
    category: "Platform/Big Tech",
    weight: 3,
  },
  {
    name: "TikTok — Newsroom",
    url: "https://newsroom.tiktok.com/en-us",
    // No reliable public RSS feed — Scout browses the newsroom directly.
    category: "Platform/Big Tech",
    weight: 3,
  },

  // ───────────────────────────── Programmatic ─────────────────────────────
  {
    name: "The Trade Desk — Newsroom",
    url: "https://www.thetradedesk.com/us/news",
    // No public RSS feed — Scout browses the newsroom directly.
    category: "Programmatic",
    weight: 4,
  },
  {
    name: "IAB (Interactive Advertising Bureau)",
    url: "https://www.iab.com/",
    rss: "https://www.iab.com/feed/",
    category: "Programmatic",
    weight: 3,
  },
  {
    name: "IAB Tech Lab",
    url: "https://iabtechlab.com/",
    rss: "https://iabtechlab.com/feed/",
    category: "Programmatic",
    weight: 3,
  },
  {
    name: "Search Engine Land",
    url: "https://searchengineland.com/",
    rss: "https://searchengineland.com/feed",
    category: "Programmatic",
    weight: 3,
  },

  // ────────────────────────── Agency/Marketing ────────────────────────────
  {
    name: "Marketing Brew",
    url: "https://www.marketingbrew.com/",
    // Newsletter-first; no reliable standalone RSS — Scout browses the site.
    category: "Agency/Marketing",
    weight: 4,
  },
  {
    name: "MarTech",
    url: "https://martech.org/",
    rss: "https://martech.org/feed/",
    category: "Agency/Marketing",
    weight: 3,
  },
  {
    name: "eMarketer (EMARKETER / Insider Intelligence)",
    url: "https://www.emarketer.com/",
    // Article feed is unreliable/paywalled — Scout browses the site directly.
    category: "Agency/Marketing",
    weight: 4,
  },
  {
    name: "Search Engine Journal",
    url: "https://www.searchenginejournal.com/",
    rss: "https://www.searchenginejournal.com/feed/",
    category: "Agency/Marketing",
    weight: 3,
  },

  // ────────────────────────── Creator economy ─────────────────────────────
  {
    name: "Tubefilter",
    url: "https://www.tubefilter.com/",
    rss: "https://www.tubefilter.com/feed/",
    category: "Creator economy",
    weight: 3,
  },
  {
    name: "TechCrunch — Social",
    url: "https://techcrunch.com/category/social/",
    rss: "https://techcrunch.com/category/social/feed/",
    category: "Creator economy",
    weight: 3,
  },
  {
    name: "Modern Retail",
    url: "https://www.modernretail.co/",
    rss: "https://www.modernretail.co/feed/",
    category: "Creator economy",
    weight: 3,
  },

  // ──────────────────────────── Policy/Privacy ────────────────────────────
  {
    name: "The Verge — Policy",
    url: "https://www.theverge.com/policy",
    rss: "https://www.theverge.com/rss/policy/index.xml",
    category: "Policy/Privacy",
    weight: 3,
  },
  {
    name: "EFF — Deeplinks",
    url: "https://www.eff.org/deeplinks",
    rss: "https://www.eff.org/rss/updates.xml",
    category: "Policy/Privacy",
    weight: 3,
  },
  {
    name: "FTC — Press Releases",
    url: "https://www.ftc.gov/news-events/news/press-releases",
    rss: "https://www.ftc.gov/feeds/press-release.xml",
    category: "Policy/Privacy",
    weight: 4,
  },
  {
    name: "IAPP (Privacy News)",
    url: "https://iapp.org/news/",
    rss: "https://iapp.org/news/rss/",
    category: "Policy/Privacy",
    weight: 3,
  },

  // ─────────────────────────── Business/Earnings ──────────────────────────
  {
    name: "The Information",
    url: "https://www.theinformation.com/",
    rss: "https://www.theinformation.com/feed",
    category: "Business/Earnings",
    weight: 5,
  },
  {
    name: "Stratechery (Ben Thompson)",
    url: "https://stratechery.com/",
    rss: "https://stratechery.com/feed/",
    category: "Business/Earnings",
    weight: 4,
  },
  {
    name: "Platformer (Casey Newton)",
    url: "https://www.platformer.news/",
    rss: "https://www.platformer.news/rss/",
    category: "Business/Earnings",
    weight: 4,
  },
  {
    name: "Axios",
    url: "https://www.axios.com/",
    rss: "https://www.axios.com/feeds/feed.rss",
    category: "Business/Earnings",
    weight: 3,
  },
  {
    name: "Reuters — Technology",
    url: "https://www.reuters.com/technology/",
    // No reliable open first-party RSS feed — Scout browses the section directly.
    category: "Business/Earnings",
    weight: 4,
  },
  {
    name: "CNBC — Technology",
    url: "https://www.cnbc.com/technology/",
    rss: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910",
    category: "Business/Earnings",
    weight: 3,
  },
];

export const SOURCE_COUNT = SOURCES.length;

export default SOURCES;
