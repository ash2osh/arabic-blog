import settings from "../site.config.json" with { type: "json" };
import ar from "./ar.json" with { type: "json" };
import en from "./en.json" with { type: "json" };

export const languages = ["ar", "en"] as const;
export type Language = (typeof languages)[number];
export type TranslationKey = keyof typeof ar;
type Dictionary = Record<TranslationKey, string>;
export const dictionaries = { ar, en } satisfies Record<Language, Dictionary>;

// The default language is served at the root; others live under /<lang>/.
export const defaultLanguage: Language = "ar";
export const locales = { ar: "ar-EG", en: "en-US" } as const;
export const ogLocales = { ar: "ar_EG", en: "en_US" } as const;

const BASE = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");

export const isLanguage = (value: unknown): value is Language =>
  languages.some((language) => language === value);

export function getLanguage(value?: string): Language {
  return isLanguage(value) ? value : defaultLanguage;
}
export function getLanguageFromPath(pathname: string): Language {
  const withoutBase = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  return getLanguage(withoutBase.split("/")[1]);
}
// "/en/posts/" -> "/posts/"
export function stripLanguage(pathname: string): string {
  const withoutBase = pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname;
  const [, first, ...rest] = withoutBase.split("/");
  return isLanguage(first) && first !== defaultLanguage
    ? `/${rest.join("/")}`
    : withoutBase;
}
// "/posts/" -> "/arabic-blog/posts/" for default language, or with language prefix
export function localizePath(lang: Language, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const localized = lang === defaultLanguage ? normalized : `/${lang}${normalized}`;
  return `${BASE}${localized}`;
}

export function translate(
  lang: Language,
  key: TranslationKey,
  values: Record<string, string | number> = {},
): string {
  const dictionary: Dictionary = dictionaries[lang] || dictionaries[defaultLanguage];
  const overrides = (settings.text as any)[lang] as Partial<Dictionary> | undefined;
  const singularKey = `${key}.one` as TranslationKey;
  const selectedKey =
    typeof values.count === "number" &&
    new Intl.PluralRules(locales[lang]).select(values.count) === "one" &&
    singularKey in dictionary
      ? singularKey
      : key;
  const template = overrides?.[selectedKey] ?? dictionary[selectedKey] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(values[k] ?? `{${k}}`));
}

export const useTranslations =
  (lang: Language) =>
  (key: TranslationKey, values?: Record<string, string | number>) =>
    translate(lang, key, values);

export function formatDate(
  lang: Language,
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(locales[lang] || "ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }).format(d);
}

export function languagePaths() {
  return [
    { params: { lang: undefined } },
    ...languages
      .filter((language) => language !== defaultLanguage)
      .map((lang) => ({ params: { lang } })),
  ];
}
