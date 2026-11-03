---
category: apex-theme-factory
date: '2026-11-04'
description: الجزء الثاني من سلسلة APEX Theme Factory. إزاي نبني قلعة عزل محكمة باستخدام كلاسات html.app-theme-* ونتحكم في المتغيرات بدون !important ونتجنب فخ مسح أيقونات Font APEX.
draft: false
featured: false
hashnode_draft_id: ""
image: /arabic-blog/covers/024_the-scoping-fortress-eliminating-apex-css-collisions.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/024_the-scoping-fortress-eliminating-apex-css-collisions
tags:
- oracle-apex
- css
- webdev
- design-system
- arabic
title: "قلعة العزل الحصينة: إزاي html.app-theme-* بيقضي على فوضى الـ CSS في Oracle APEX 🏰🛡️"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/024_the-scoping-fortress-eliminating-apex-css-collisions).

# قلعة العزل الحصينة: إزاي html.app-theme-* بيقضي على فوضى الـ CSS في Oracle APEX 🏰🛡️

*الجزء الثاني من السلسلة التقنية الشاملة: هندسة متغيرات الـ CSS وعزل النطاق في Oracle APEX.*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> تخيل عمارة سكنية فخمة فيها 100 شقة، والمهندس العبقري اللي بناها قرر يوفر تكاليف الأسلاك، فعمل مفتاح كهرباء عمومي واحد كبير في مدخل العمارة تحت! جه الساكن اللي في شقة 4B حب يقرا كتاب الساعة 2 بعد منتصف الليل، فنزل داس على المفتاح العمومي.. وفجأة: أنوار الديسكو ولعت، وخلاطات المطابخ اشتغلت، ورشاشات الحريق رشت مياه على كل السكان في الـ 100 شقة في نفس اللحظة!
>
> دي بالضبط المأساة اللي بتحصل لما تكتب أكواد CSS عامة أو تعدل متغيرات الـ `:root` في **Oracle APEX**. بتكون فاكر إنك بتعدل حواف جدول تقارير تفاعلي في صفحة رقم 12، فتتفاجئ إنك بوظت ألوان النوافذ المنبثقة (Modal Dialogs) وقوائم التنقل في صفحة رقم 1!
>
> في الجزء التاني من سلسلتنا **APEX Theme Factory**، هنبني **قلعة العزل الحصينة**. هنتعلم إزاي نبني هيكل متغيرات CSS ثلاثي الطبقات معزول تماماً تحت كلاس `html.app-theme-<name>`، ونتحكم في أسبقية التنسيق (Specificity) من غير ولا علامة `!important` واحدة، ونحمي تجربة الاستخدام بحاجز تقليل الحركة، ونتفادى الفخ القاتل اللي بيمسح أيقونات Font APEX ويحولها لمربعات مكسورة. 🚀

* * *

## 🏢 كارت الشقة الذكي: ليه الـ CSS العام بيخرب أنظمة الشركات؟

في بيئات عمل أوراكل أبيكس، المطورين كتير بيقعوا في فخ كتابة أكواد زي دي:

```css
/* ❌ مفتاح المدخل العمومي: الكود اللي بيدمر نظامك بالبطيء */
:root {
  --ut-body-background-color: #12151c; /* بيبوظ النوافذ المنبثقة */
}

* {
  font-family: 'Inter', sans-serif !important; /* بيمسح أيقونات Font APEX تماماً */
}

.t-Button {
  border-radius: 9999px !important; /* بيكسر الأزرار الصغيرة ومجموعات الأزرار */
}
```

أول ما الكود ده يوصل لسيرفر الإنتاج (Production)، بتحصل كوارث فورية:
1. **النوافذ المنبثقة بتبقى غير مقروءة**: النافذة بتاخد خلفية داكنة من الـ `:root`، بس النصوص والأزرار بتفضل بلونها الافتراضي، فتلاقي خطوط بيضاء أو رصاصي فاتح على أسطح رمادية وتختفي القراءة تماماً.
2. **أيقونات Font APEX بتتبخر**: لأن النجمة `*` بتستهدف كل عنصر في الصفحة مع `!important`، خط الأيقونات بيتغير لخط الكتابة العادي، وتتحول كل أيقونات البحث والحذف لمربعات Unicode فارغة ومكسورة!
3. **كوابيس الترقية**: لما أوراكل تنزل إصدار جديد، أكواد `!important` بتاعتك بتصطدم مع الهيكل الجديد، وتضيع أيام طويلة في ترقيع الشاشات.

تعالوا نشوف إزاي بنهندس قلعة العزل الذكية بدون أي تضارب.

* * *

## 🪜 معمارية التوكنز ثلاثية الطبقات

في Theme Factory بنقسم متغيرات الـ CSS لـ 3 طبقات أساسية ومستقلة:

```text
┌────────────────────────────────────────────────────────┐
│  الطبقة 1: الذرات الأصلية لنمط Iris (--ut-*, --a-*)    │
│  (الأساس المتين والقابل للقراءة من Universal Theme 42) │
└───────────────────────────┬────────────────────────────┘
                            │ يتم تغليفه بواسطة
                            ▼
┌────────────────────────────────────────────────────────┐
│  الطبقة 2: متغيرات التطبيق الدلالية (--app-*)          │
│  (أدوار مجردة: أسطح، نصوص، حواف، إطارات التركيز)      │
└───────────────────────────┬────────────────────────────┘
                            │ يتم استهلاكه بواسطة
                            ▼
┌────────────────────────────────────────────────────────┐
│  الطبقة 3: حزم الثيمات المعزولة (html.app-theme-<name>)│
│  (ألوان محددة: Carbon Volt، Citrus Pop، Linen)         │
└────────────────────────────────────────────────────────┘
```

### 1. المتغيرات الأساسية (`foundation/tokens.css`)
في ملف الأساس، بنعلن عن كل أدوار الـ `--app-*` على مستوى الـ `:root` عبر ربطها بمتغيرات Iris الأصلية:

```css
/* ملف الأساس: الربط مع قيم Iris الافتراضية */
:root {
  --app-color-primary:     var(--ut-palette-primary);
  --app-surface-page:      var(--ut-body-background-color);
  --app-surface-card:      var(--ut-component-background-color);
  --app-surface-chrome:    var(--ut-header-background-color);
  --app-text-primary:      var(--ut-body-text-color);
  --app-text-secondary:    var(--ut-component-text-muted-color);
  --app-border-color:      var(--ut-component-border-color);
  --app-radius-md:         var(--ut-border-radius-md);
  --app-control-h:         2rem;
  --app-motion-duration:   150ms;
  --app-hover-transform:   translateY(-1px);
}
```

### 2. فروقات حزمة الثيم (`sample-themes/carbon-volt/css/tokens.css`)
لما ثيم زي **Carbon Volt** يشتغل، هو بيغير بس قيم `--app-*` تحت الكلاس الخاص بيه فقط:

```css
/* حزمة الثيم المعزولة: ثيم Carbon Volt */
html.app-theme-carbon-volt {
  color-scheme: dark;

  /* مساحات وأسطح الشاشات */
  --app-surface-page:      #12151c;
  --app-surface-card:      #1a1e28;
  --app-surface-chrome:    #0d0f14;
  --app-surface-input:     #141720;
  --app-surface-hover:     #222735;
  --app-surface-selected:  #2a3142;

  /* النصوص وألوان التمييز */
  --app-text-primary:      #f0f2f5;
  --app-text-secondary:    #8e96a4;
  --app-color-primary:     #c4f042; /* أخضر ليموني كهربائي */
  --app-color-info:        #00d4ff; /* أزرق سماوي للبيانات */

  /* الحواف والإطارات */
  --app-border-color:      rgba(255, 255, 255, 0.08);
  --app-border-strong:     rgba(255, 255, 255, 0.22);
  --app-radius-sm:         2px;
  --app-radius-md:         4px;
}
```

لاحظ وجود السطر `color-scheme: dark;`. السطر ده سحري لأنه بيدي إشارة لمحرك المتصفح إنه يقلب أشرطة التمرير (Scrollbars)، وتحديدات حقول الإدخال، وتقويمات التواريخ للوضع المظلم تلقائياً بدون أي أكواد إضافية.

* * *

## 🎯 إعادة تعيين ذرات Iris الأصلية بدون `!important`

إزاي نخلي مكونات أبيكس القياسية (زي البطاقات والجداول والحاويات) تاخد المتغيرات دي بنعومة ومن غير خناقات الـ `!important`؟

الثيم الموحد Universal Theme 42 بيعتمد على المتغيرات. لما بنعيد ربط المتغيرات دي على محدد `body.apex-theme-iris` جوه نطاق الثيم بتاعنا، بنغير القيم الأساسية ونسمح لكلاسات أبيكس الجاهزة (`.t-Button--hot`, `.u-color-1`) إنها تفضل شغالة بأولويتها الطبيعية:

```css
/* إعادة توجيه متغيرات مكونات Iris بأمان جوه ثيم Carbon Volt */
html.app-theme-carbon-volt body.apex-theme-iris {
  /* مساحات الحاويات والصفحات */
  --ut-body-background-color:       var(--app-surface-page);
  --ut-component-background-color:  var(--app-surface-card);
  --ut-component-border-color:      var(--app-border-color);
  
  /* ألوان النصوص */
  --ut-body-text-color:             var(--app-text-primary);
  --ut-component-text-title-color:  var(--app-text-primary);
  --ut-component-text-muted-color:  var(--app-text-secondary);

  /* اللون الأساسي وإطار التركيز */
  --ut-palette-primary:             var(--app-color-primary);
  --ut-focus-outline-color:         var(--app-color-primary);
}
```

* * *

## ♿ درع إمكانية الوصول: حماية تقليل الحركة بقوة (0,3,0)

في أنظمة الشركات الكبرى، معايير إمكانية الوصول (Accessibility) إلزامية قانونياً وتقنياً. المستخدمين اللي بيعانوا من حساسية الحركة أو مشاكل التوازن ممكن يتعبوا جداً من الحركات والتأثيرات الانتقالية السريعة.

إزاي نجبر كل الثيمات إنها تحترم إعداد تقليل الحركة `prefers-reduced-motion` من غير ما نعتمد على ضمير مصمم الثيم؟

بنستخدم محدد CSS بقوة حسابية صارمة تبلغ **(0, 3, 0)**:

```css
/* درع الأساس: يتفوق حسابياً على أي كلاس فرعي html.app-theme-* بقوة (0,2,0) */
@media (prefers-reduced-motion: reduce) {
  :root:root[class*="app-theme-"] {
    --app-motion-duration: 0ms !important;
    --app-hover-transform: none !important;
    --app-hover-shadow:    none !important;
  }
}
```

لأن كل مكونات Theme Factory بتتحرك حصرياً من خلال المتغيرين `--app-motion-duration` و `--app-hover-transform`، السطر ده بيجمد أي حركة في الشاشة فوراً ويحولها لثبات تام ومريح للمستخدم.

* * *

## 🚫 الفخ القاتل: إزاي الخطوط المخصصة بتمسح أيقونات Font APEX؟

أشهر فخ بيقع فيه مطوري أبيكس لما يركبوا خط عربي أو إنجليزي جديد:

```css
/* ❌ مدمر الأيقونات الأوتوماتيكي */
html.app-theme-carbon-volt * {
  font-family: "Noto Kufi Arabic", sans-serif;
}
```

في أوراكل أبيكس، الأيقونات مش ملفات صور ولا SVG—دي رموز خطية بتعتمد على خط **Font APEX** من خلال كلاسات زي `.fa` و `.t-Icon`. لما بتطبق الخط بالنجمة `*`، المتصفح بيمسح جدول رموز الأيقونات ويحط مكانه خط النصوص، فتتحول علامة العدسة وسلة المهملات لمربعات بيضاء ممسوحة!

### الحل في Theme Factory: تحديد أدوار الخطوط بدقة
بنفصل الخطوط لـ 3 أدوار رئيسية: خط النصوص، وخط العناوين، وخط الأكواد البرمجية:

```css
/* ✅ استهداف آمن للخطوط مع عزل أيقونات Font APEX */
html.app-theme-carbon-volt {
  --app-font-family-body:    "Noto Kufi Arabic", -apple-system, sans-serif;
  --app-font-family-heading: "Noto Kufi Arabic", -apple-system, sans-serif;
  --app-font-family-mono:    "SFMono-Regular", Consolas, monospace;
}

/* تطبيق الخط على عناصر النصوص فقط، وممنوع استخدام النجمة * */
html.app-theme-carbon-volt body {
  font-family: var(--app-font-family-body);
}

html.app-theme-carbon-volt h1,
html.app-theme-carbon-volt h2,
html.app-theme-carbon-volt h3,
html.app-theme-carbon-volt .t-Region-title {
  font-family: var(--app-font-family-heading);
}

/* حماية صريحة لأيقونات أبيكس الرسمية */
html.app-theme-carbon-volt .apex-icons-fontapex,
html.app-theme-carbon-volt .fa,
html.app-theme-carbon-volt .t-Icon {
  font-family: "Font APEX 2.5.1", "FontAPEX" !important;
}
```

* * *

## 📦 تطبيق عملي: تلوين البطاقات والحقول العائمة

تعالوا نشوف كود واقعي من داخل ثيم **Carbon Volt** بيوضح إزاي بنلون بطاقات الـ Cards وحقول الإدخال ذات العناوين العائمة (Floating Labels):

```css
/* تلوين بطاقات الـ Cards جوه النطاق المعزول */
html.app-theme-carbon-volt .t-Card {
  background-color: var(--app-surface-card);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-md);
  transition: transform var(--app-motion-duration) ease,
              box-shadow var(--app-motion-duration) ease;
}

html.app-theme-carbon-volt .t-Card:hover {
  transform: var(--app-hover-transform);
  border-color: var(--app-border-strong);
  box-shadow: 0 8px 24px -8px rgba(0, 0, 0, 0.5);
}

/* ضبط العناوين العائمة لحقول الإدخال عند التنشيط */
html.app-theme-carbon-volt .t-Form-fieldContainer--floatingLabel.is-active .t-Form-label {
  color: var(--app-color-primary);
  background-color: var(--app-surface-card);
}
```

كل سطر تنسيق بيبدأ صراحة بـ `html.app-theme-carbon-volt`. لو المستخدم حب يغير الثيم أو يرجع للشكل الافتراضي، كل الأسطر دي بتصبح غير فعالة وكأنها غير موجودة بالمرة!

* * *

## ⏭️ المقال القادم: القضاء على الوميض الأبيض المزعج!

دلوقتي ملفات الـ CSS بتاعتنا بقت محصنة جوه قلعة منيعة. بس بيظهر تحدي جديد وخطير: **المتصفح إمتى هيضيف الكلاس ده على الصفحة؟**

لو استنيت لما الصفحة تخلص تحميل وشغلت كود JavaScript عشان يضيف الكلاس، المستخدم هيشوف وميض أبيض يخطف البصر لمدة 200 ميلي ثانية مع كل كليك ينقله لصفحة جديدة!

في **المقال 025**، هنكشف **سر الوميض الصفري**: إزاي سطر كود بسيط ومتزامن في Page 0 بيغير شكل الصفحة في أقل من 2 ميلي ثانية قبل ما ستارة المسرح تفتح! تابعوا معانا! 🚀
