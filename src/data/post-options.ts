import { languages, translate, type Language } from "../i18n";

export const categoryNames = [
  "ai-augmented-apexdeveloper",
  "enterprise-workflows",
  "apex-devops",
  "apex-theme-factory",
  "apex-project-template",
  "oracle-apex-bugs",
  "guides",
  "notes",
  "stories",
] as const;

export type Category = (typeof categoryNames)[number];

export const seriesCategories = [
  "ai-augmented-apexdeveloper",
  "enterprise-workflows",
  "apex-theme-factory",
  "apex-project-template",
] as const;

export type SeriesCategory = (typeof seriesCategories)[number];

export function isSeriesCategory(category: string): boolean {
  return (seriesCategories as readonly string[]).includes(category);
}

export const categoryLabels: Record<string, Record<string, string>> = {
  ar: {
    "ai-augmented-apexdeveloper": "مطور أبيكس المعزز بالذكاء الاصطناعي",
    "enterprise-workflows": "إدارة الـ Workflows الضخمة",
    "apex-devops": "نشر التطبيقات والـ DevOps",
    "apex-theme-factory": "أنظمة التصميم و APEX Theme Factory",
    "apex-project-template": "قالب مشروع أوراكل أبيكس للذكاء الاصطناعي",
    "oracle-apex-bugs": "حلول وثغرات أوراكل أبيكس",
    guides: "شروحات",
    notes: "ملاحظات",
    stories: "تجارب",
  },
  en: {
    "ai-augmented-apexdeveloper": "AI-Augmented APEX Developer",
    "enterprise-workflows": "Enterprise Workflows at Scale",
    "apex-devops": "APEX DevOps & Deployments",
    "apex-theme-factory": "APEX Theme Factory & Design Systems",
    "apex-project-template": "APEX Project Template",
    "oracle-apex-bugs": "Oracle APEX Bugs & Workarounds",
    guides: "Guides",
    notes: "Notes",
    stories: "Stories",
  },
};

export const categoryLabel = (lang: Language, category: string) => {
  return categoryLabels[lang]?.[category] || categoryLabels["ar"]?.[category] || category;
};

// Accept category IDs or a localized label in any language.
export function normalizeCategory(value: string): string {
  for (const cat of categoryNames) {
    if (value === cat || value === categoryLabels.ar[cat] || value === categoryLabels.en[cat]) {
      return cat;
    }
  }
  return value;
}
