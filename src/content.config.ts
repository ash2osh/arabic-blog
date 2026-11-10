import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { categoryNames, normalizeCategory } from "./data/post-options";
import { defaultLanguage, languages } from "./i18n";

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    date: z.coerce.date(),
    // Optional: set when you revise a post so search engines see the update.
    updated: z.coerce.date().optional(),
    lang: z.enum(languages).default(defaultLanguage),
    category: z.preprocess(
      (value) => (typeof value === "string" ? normalizeCategory(value) : value),
      z.enum(categoryNames),
    ),
    tags: z.array(z.string().trim().min(1)),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    image: z.string().optional(),
    heroImage: z.string().optional(),
    cover_image: z.string().optional(),
    hashnode_draft_id: z.string().nullable().optional(),
    original_english_url: z.string().optional(),
    series: z.string().optional(),
    series_slug: z.string().optional(),
    series_part: z.number().optional(),
  }),
});
export const collections = { posts };
