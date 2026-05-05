import { GAME_CONFIG } from "../config";

export interface NewsStory {
  title: string;
  url: string;
  author: string;
  points: number;
}

interface NewsCache {
  date: string; // YYYY-MM-DD
  fetchedAt: number;
  stories: NewsStory[];
}

const ENDPOINT =
  "https://hn.algolia.com/api/v1/search?tags=story&hitsPerPage=20&query=AI";
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

export function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getCachedStories(): NewsStory[] {
  return readCache()?.stories ?? [];
}

function readCache(): NewsCache | null {
  try {
    const raw = localStorage.getItem(GAME_CONFIG.newsCacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as NewsCache;
    if (parsed.date !== todayKey()) return null;
    if (Date.now() - parsed.fetchedAt > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(stories: NewsStory[]): void {
  const cache: NewsCache = {
    date: todayKey(),
    fetchedAt: Date.now(),
    stories,
  };
  try {
    localStorage.setItem(GAME_CONFIG.newsCacheKey, JSON.stringify(cache));
  } catch {
    // localStorage full or disabled — silent
  }
}

interface AlgoliaHit {
  title?: string;
  story_title?: string;
  url?: string | null;
  author?: string;
  points?: number;
  num_comments?: number;
}

async function fetchFresh(): Promise<NewsStory[]> {
  const res = await fetch(ENDPOINT, { method: "GET" });
  if (!res.ok) throw new Error(`HN fetch ${res.status}`);
  const data = (await res.json()) as { hits: AlgoliaHit[] };
  return data.hits
    .filter((h) => (h.title ?? h.story_title) && (h.url || h.story_title))
    .slice(0, 5)
    .map((h) => ({
      title: (h.title ?? h.story_title ?? "").trim(),
      url: h.url ?? "",
      author: h.author ?? "anon",
      points: h.points ?? 0,
    }));
}

let inflight: Promise<NewsStory[]> | null = null;

export async function getNews(): Promise<NewsStory[]> {
  const cached = readCache();
  if (cached) return cached.stories;
  if (inflight) return inflight;
  inflight = fetchFresh()
    .then((stories) => {
      writeCache(stories);
      return stories;
    })
    .catch(() => [])
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function newsHeadlineForDailySecret(stories: NewsStory[]): {
  title: string;
  body: string;
} {
  if (stories.length === 0) {
    return {
      title: "Daily Secret",
      body: "The news ticker is offline. Free credits, on the house.",
    };
  }
  const top = stories[0];
  const trimmed = top.title.length > 90 ? `${top.title.slice(0, 87)}…` : top.title;
  return {
    title: "Daily Secret — Today's Headline",
    body: `"${trimmed}"\n— filed by ${top.author} (${top.points} pts on HN)`,
  };
}
