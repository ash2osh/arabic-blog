// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import vue from "@astrojs/vue";
import tailwindcss from "@tailwindcss/vite";
import { readdirSync, readFileSync, existsSync } from "node:fs";

const siteUrl = process.env.SITE_URL || "https://ash2osh.github.io";
const base = process.env.BASE_PATH || "/arabic-blog";

// Last modification date of each post URL, read from its frontmatter
/** @type {Map<string, Date>} */
const lastModified = new Map();
for (const lang of ["ar", "en"]) {
  const dir = `./src/content/posts/${lang}`;
  if (!existsSync(dir)) continue;
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    const frontmatter = readFileSync(`${dir}/${file}`, "utf8").split("---")[1];
    if (!frontmatter || /^draft:\s*true/m.test(frontmatter)) continue;
    const date =
      /^updated:\s*(\S+)/m.exec(frontmatter)?.[1] ??
      /^date:\s*(\S+)/m.exec(frontmatter)?.[1];
    if (!date) continue;
    const prefix = lang === "ar" ? "" : `/${lang}`;
    lastModified.set(
      `${prefix}/posts/${file.replace(/\.md$/, "")}/`,
      new Date(date),
    );
  }
}

/** Newest post date for the Arabic ("") or English ("/en/") listings. */
const newest = (/** @type {string} */ prefix) =>
  [...lastModified]
    .filter(([path]) =>
      prefix ? path.startsWith(prefix) : !path.startsWith("/en/"),
    )
    .map(([, date]) => date)
    .sort((a, b) => b.valueOf() - a.valueOf())[0];

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  base: base,
  output: "static",
  trailingSlash: "always",
  compressHTML: true,
  build: { inlineStylesheets: "always" },
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  experimental: { clientPrerender: true },
  integrations: [
    vue(),
    sitemap({
      i18n: { defaultLocale: "ar", locales: { ar: "ar-EG", en: "en-US" } },
      filter: (page) =>
        !["/404/", "/404.html"].includes(new URL(page).pathname),
      serialize(item) {
        const path = new URL(item.url).pathname;
        const listing = /^\/(en\/)?(posts\/)?$/.exec(path);
        const date = listing
          ? newest(listing[1] ? "/en/" : "")
          : lastModified.get(path);
        return date ? { ...item, lastmod: date.toISOString() } : item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
