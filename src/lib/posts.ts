import { getCollection, type CollectionEntry } from "astro:content";
import { categoryNames, isSeriesCategory } from "../data/post-options";
import type { Language } from "../i18n";

export type PostSummary = {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  tags: string[];
  featured: boolean;
  minutes: number;
  // The post's first image, shown on the list card. Empty when it has none.
  cover: string;
  series?: string;
  series_slug?: string;
  series_part?: number;
};
export const categories = categoryNames;

export async function getPosts(lang: Language) {
  return (
    await getCollection(
      "posts",
      ({ data }) => !data.draft && data.lang === lang,
    )
  ).sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function calculateSeriesPart(post: CollectionEntry<"posts">): number | undefined {
  if (post.data.series_part !== undefined) {
    return post.data.series_part;
  }

  const category = post.data.category;
  if (!isSeriesCategory(category) && !post.data.series) {
    return undefined;
  }

  const id = getPostId(post);
  const match = id.match(/^(\d{3})/);
  if (match) {
    const num = parseInt(match[1], 10);
    // apex-project-template: 001 - 006 -> Parts 1 - 6
    if (category === "apex-project-template" && num >= 1 && num <= 6) return num;
    // ai-augmented-apexdeveloper: 007 - 013 -> Parts 1 - 7
    if (category === "ai-augmented-apexdeveloper" && num >= 7 && num <= 13) return num - 6;
    // enterprise-workflows: 015 - 021 -> Parts 1 - 7
    if (category === "enterprise-workflows" && num >= 15 && num <= 21) return num - 14;
    // apex-theme-factory: 023 - 028 -> Parts 1 - 6
    if (category === "apex-theme-factory" && num >= 23 && num <= 28) return num - 22;
  }

  return undefined;
}

export function summarize(post: CollectionEntry<"posts">): PostSummary {
  const id = getPostId(post);
  return {
    id,
    ...post.data,
    series_part: calculateSeriesPart(post),
    date: post.data.date.toISOString().slice(0, 10),
    minutes: readingMinutes(post.body ?? "", post.data.lang),
    cover:
      ((post.data as any).image ||
        (post.data as any).heroImage ||
        (post.data as any).cover_image ||
        firstImage(post.body ?? "")) ??
      "",
  };
}
// First Markdown image in the body: ![alt](url).
function firstImage(body: string): string | undefined {
  return body.match(/!\[[^\]]*\]\(\s*(\S+?)\s*\)/)?.[1];
}
export function countWords(body: string): number {
  return body.trim().split(/\s+/).filter(Boolean).length;
}
function readingMinutes(body: string, lang: string): number {
  const rate = lang === "es" ? 180 : 200;
  return Math.max(1, Math.ceil(countWords(body) / rate));
}
export function getPostId(post: CollectionEntry<"posts">): string {
  const prefix = `${post.data.lang.toLowerCase()}/`;
  return post.id.startsWith(prefix) ? post.id.slice(prefix.length) : post.id;
}
export function getTags(posts: PostSummary[]) {
  return [...new Set(posts.flatMap((post) => post.tags))];
}
