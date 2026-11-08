---
category: apex-project-template
date: '2026-08-10'
description: الجزء الثالث من سلسلة "أبيكس تحت السيطرة". إزاي تضمن إن عمليات الـ Export
  تكون 100% نظيفة، ومستحيل شبكة مهنجة تفرمت لك تاريخ الـ Git!
draft: false
featured: false
hashnode_draft_id: 6ad869741d7a01b5589babd4
image: /arabic-blog/covers/003_atomic-exports-clean-mirrors-no-more-half-baked-apex-disasters.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/atomic-exports-clean-mirrors-no-more-half-baked-apex-disasters
tags:
- oracle-apex
- sqlcl
- git
- devops
- arabic
title: 'تصدير ذري ومرايات نظيفة: ودّع كوابيس الـ APEX نص-المستوية! 🧳✨'
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/atomic-exports-clean-mirrors-no-more-half-baked-apex-disasters).

# تصدير ذري ومرايات نظيفة: ودّع كوابيس الـ APEX نص-المستوية! 🧳✨

*الجزء الثالث من سلسلة "أبيكس تحت السيطرة".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> تخيل وأنت مسافر بتوضب شنطة هدومك على السرير براحتك، وتراجع قايمة طلباتك مرتين، ولما تتأكد إن كل حاجة تمام تقفل السوستة وتنزل تحطها في شنطة العربية. ده بالظبط مفهوم الـ **Atomic Export** (التصدير الذري).
> 
> البديل الكارثي؟ إنك تقف في الشارع والعربية ماشية بسرعة 120 كم/ساعة وترمي القمصان والجزم مباشرة جوه الشنطة المفتوحة! لو عديت فوق مطب أو الهوا طير حاجة (أو النت فصل)، نص هدومك هتتبعثر على الطريق الصحراوي!
> 
> في المقال ده، هنشوف إزاي [قالب مشروع APEX](https://github.com/ash2osh/APEX_PROJECT_TEMPLATE) بيضمن عمليات تصدير ومزامنة كود نظيفة ومستقرة 100% ومستحيل تبوظ بسبب هنجة في الشبكة.

* * *

## 🌪️ رعب التصدير "نص المستوي" (Half-Baked Export)

لو اشتغلت على Oracle APEX و SQLcl لفترة، أكيد مريت بالكابوس ده على الأقل مرة:

1.  شغلت سكربت تصدير آلي بيستهدف فولدر مشروعك في Git مباشرة.
2.  عند الصفحة 42 من أصل 50 صفحة، الـ VPN علّق ثانية أو الداتابيز عملت Timeout.
3.  أداة SQLcl وقعت فجأة وضربت إيرور.
4.  **الكارثة حصلت**: فولدر الـ Git بتاعك بقى عامل زي زلزال! الصفحات من 1 لـ 41 اتعدلت بتواريخ جديدة، الصفحات من 42 لـ 50 نصها طاير أو ممسوح، ومشروعك المحلي باظ تماماً.

والأسوأ من كده: لو فيه AI Agent شغال معاك في نفس المشروع، هيشوف الفولدر المضروب ده ويفتكر إنه كود محتاج "تصليح"، فيهبد أكواد خيالية (Hallucinations) عشان يعوض الصفحات الناقصة ويبوظ الدنيا أكتر وأكتر!

* * *

## 🛡️ خطة العمل المعقمة (The 3-Step Cleanroom Workflow)

عشان نقضي على كابوس الملفات المضروبة للأبد، القالب بينفذ دورة تصدير صارمة بتفشل بأمان (Fail-Closed) كالآتي:

```plaintext
 ┌───────────────────────────────────────────────────────────┐
 │                   دورة التصدير الذري                      │
 ├───────────────────────────────────────────────────────────┤
 │ 1. التجهيز في منطقة الحجر الصحي scratch/                  │
 │    SQLcl بتعمل تصدير كامل لملفات .apx جوه scratch/        │
 │    (لو هنجت في النص، كودك الحقيقي سليم ومحدش لمسه!)       │
 │                                                           │
 │ 2. تنظيف وتوحيد نهايات السطور                             │
 │    سكربت normalize_apx.sh بيوحد نهايات السطور لـ LF       │
 │                                                           │
 │ 3. التبديل الذري الفوري (Atomic Mirror Swap)              │
 │    سكربت replace_mirror.sh بيتأكد إن الـ Git نظيف         │
 │    وبيبدل scratch/ بفولدر apps/ أو database/ في فمتو ثانية│
 └───────────────────────────────────────────────────────────┘
```

تعالوا نشوف كل خطوة بتشتغل إزاي.

* * *

## 1. التجهيز في `scratch/`: منطقة العزل الطبي

لما بتشغل سكربت `scripts/export_apps.sh` (أو `scripts/backup_db.sh`)، السكربت مستحيل يمد إيده على فولدر `apps/` أو `database/` مباشرة.

بدل من كده، التصدير بالكامل بيترمي الأول جوه فولدر مؤقت اسمه `scratch/` (وده فولدر معموله Gitignore ومحدش مهتم بيه) كالآتي:

```bash
# مخرجات سكربت scripts/export_apps.sh
[EXPORT] Staging APEX App 100 into scratch/export_100_temp...
[SQLCL] Running APEX export for application 100...
[SQLCL] Export completed with return code 0.
```

لو SQLcl طلعت أي إيرور، أو النت فصل، أو الداتابيز علقت لأي سبب، السكربت بيقفل فوراً وبيموت في مكانه. وفولدر `apps/` الحقيقي بيفضل سليم ونظيف 100% كأن مفيش حاجة حصلت.

* * *

## 2. حماية الشغل غير المحفوظ (Dirty Tree Protection)

تخيل قعدت آخر ساعتين بتعدل وتكتب كود في صفحة 10 جوه `apps/APP_OWNER/100/f100_page_10.apx`، ونسيت تعمل `git commit`، وقمت مشغل سكربت التصدير؟

أي أداة تصدير عادية هتدخل على الفولدر بـ "غشامة" وتمسح كل اللي كتبته وتستبدله باللي كان متخزن في الداتابيز، وتطير تعب ساعتين في الأرض!

القالب ده أذكى من كده بكتير. بيفحص حالة الـ Git الأول قبل ما يلمس أي ملف:

```bash
# scripts/replace_mirror.sh
if [ -n "$(git status --porcelain "$TARGET_DIR")" ]; then
    echo "❌ SAFETY HALT: Destination directory has uncommitted changes!"
    echo "Please commit or stash your changes before syncing the mirror."
    exit 1
fi
```

لو الفولدر بتاعك "Dirty" (فيه تعديلات لسه معملتلهاش Commit أو Stash)، السكربت بيرفض التبديل ويقف فوراً احتراماً لشغلك. مستحيل تصدير آلي يبلع كودك أبداً! 🛡️

* * *

## 3. فخ نهايات السطور: ليه APEX بتكره الـ CRLF؟

دي غلطة خبيثة جداً جننت مطورين كتير حول العالم:
* أجهزة **Windows** بتعمل نهايات السطور بنظام **CRLF** (`\r\n`).
* أنظمة **Linux و Mac** بتستخدم نظام **LF** (`\n`).
* **كومبيلر لغة APEXlang** بيتخنق تماماً من الـ CRLF! لو اديته ملفات بنظام ويندوز، هيطلع لك أخطاء Parsing غريبة وغير مفهومة.

القالب بيقفل الباب ده من جذوره بخطوتين:

1. ملف `.gitattributes` بيثبت كل ملفات `.apx` على نظام LF إجبارياً:
   ```gitattributes
   *.apx text eol=lf
   ```
2. سكربت `normalize_apx.sh` بيعدي بطلقة Perl سريعة جداً على الفولدر المؤقت ينضف أي `\r` شاردة قبل ما الملفات تفكر تدخل الـ Git أصلاً:
   ```bash
   find "$STAGING_DIR" -name "*.apx" -exec perl -pi -e 's/\r\n/\n/g' {} +
   ```

* * *

## 4. الأرقام مبتكدبش: رقم التطبيق (App ID) ضد الاسم المستعار (Alias)

أداة SQLcl عندها طبع غريب إنها بتسمي الفولدرات باسم الـ *Alias* بتاع التطبيق (مثلاً: `apps/my-cool-portal/`).

المشكلة فين؟ في فرق العمل الحقيقية، المطورين كل شوية يغيروا الـ Alias من شاشة الـ APEX Builder (مثلاً من `my-cool-portal` لـ `customer-portal-v2`).

لو تقسيم الفولدرات معتمد على الـ Alias، مجرد تغيير بسيط في الشاشة هيعمل فولدر جديد تماماً، ويقطع تاريخ الـ Git نصين، ويبوظ كل مراجع الوكيل الذكي.

عشان كده القالب بيثبت التسمية دائماً برقم الـ `APEX_APP_ID` الثابت اللي مبيتغيرش:

```plaintext
apps/<parsing-schema>/<app-id>/
├── f100_page_1.apx
├── f100_page_2.apx
└── supporting-objects/
```

غيروا في الـ Aliases زي ما أنتم عايزين في الشاشات—هيكل الملفات وتاريخ الـ Git هيفضل ثابت ومستقر زي الصخر!

* * *

## 💻 جربه عملياً بضغطة زر

تشغيل التصدير أبسط مما تتخيل:

```bash
# على Linux أو Mac
scripts/export_apps.sh

# على Windows PowerShell
./scripts/export_apps.ps1
```

```text
[INFO] Loading .env configuration...
[INFO] Verifying git status of apps/APEX_PARSER/100... Clean!
[INFO] Exporting APEX application 100 to scratch/...
[INFO] Normalizing line endings to LF...
[INFO] Staging verified. Replacing mirror atomically.
[SUCCESS] Application 100 mirror updated cleanly in 2.4s.
```

* * *

## 🔮 إيه اللي مستنينا في الجزء الرابع؟

في **الجزء الرابع**، هنكشف الستار عن الجوهرة الحقيقية للقالب كله: **The Custom APEXlang Knowledge Graph**!
* ليه الـ Code Parsers العادية بتفشل فشل ذريع لما تقرأ ملفات تصدير APEX؟
* إزاي أداة Graphify بتستخرج علاقات حقيقية من شجرة الكود (`contains`, `navigates_to`, `reads_from`, `writes_to`, `calls`)؟
* وإزاي المساعد الذكي (الـ Agent) لما يسأل سؤال ينط فوراً على رسم بياني من 4 نودز (Nodes) بدل ما يحرق 50 ألف توكن في الـ Grep على الفاضي!

استنونا في الجزء الرابع! 🗺️🧠

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
