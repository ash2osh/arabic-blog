---
category: apex-project-template
date: '2026-08-25'
description: 'الجزء السادس (مسك الختام) من سلسلة "أبيكس تحت السيطرة". رحلة عملية حية:
  من كتابة الكود لمراجعة الأمان حتى المزامنة واختبارات الـ 36 تيست!'
draft: false
featured: false
hashnode_draft_id: 6ad8697a271729564d17678e
image: /arabic-blog/covers/006_putting-it-all-together-building-deploying-an-apex-feature-with-ai-agents.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/putting-it-all-together-building-deploying-an-apex-feature-with-ai-agents
tags:
- oracle-apex
- ai
- devops
- ci-cd
- arabic
title: 'تجميع الخيوط: بناء ونشر ميزة APEX كاملة مع الـ AI Agents من الألف للياء 🚀🎉'
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/putting-it-all-together-building-deploying-an-apex-feature-with-ai-agents).

# تجميع الخيوط: بناء ونشر ميزة APEX كاملة مع وكلاء الذكاء الاصطناعي من الألف للياء 🚀🎉

*الجزء السادس (مسك الختام) من سلسلة "أبيكس تحت السيطرة".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> في الأجزاء من 1 لـ 5، بنينا السور الإلكتروني، وصنعنا مفاتيح الأمان، ونظمنا منطقة الحجر الصحي المعقمة، ورسمنا خريطة المدينة بالـ Knowledge Graph، وجهزنا شنطة ذاكرة الـ Agent عشان ميتوهش أبداً.
> 
> دلوقتي جه ميعاد الحدث الرئيسي: **بناء ونشر ميزة حقيقية متكاملة لمؤسسة ضخمة في Oracle APEX من الصفر** جنب لجنب مع زميلنا الذكي، باستخدام دورة عمل [قالب مشروع APEX](https://github.com/ash2osh/APEX_PROJECT_TEMPLATE) الكاملة.

* * *

## 🛫 خطة الطيران: دورة حياة الميزة في 6 مراحل

لما تبني ميزات جديدة باستخدام القالب ده، أنت مستحيل تسيب الـ Agent يسرح في الداتابيز بمزاجه.

كل تعديل بيمشي على خطة طيران صارمة من 6 مراحل:

```plaintext
 ┌─────────────────────────────────────────────────────────────┐
 │                دورة حياة ميزة APEX في 6 مراحل               │
 ├─────────────────────────────────────────────────────────────┤
 │ 1. 🧠 التخطيط في فولدر AI_GENERATE/                         │
 │    الـ Agent بيجهز سكربتات SQL/PLSQL جاهزة للنشر بتواريخها. │
 │                                                             │
 │ 2. 👁️ المراجعة البشرية بالعين المجردة                      │
 │    أنت بتراجع الكود سطر سطر قبل ما يتنفذ منه حرف واحد.      │
 │                                                             │
 │ 3. 🛡️ النشر المحمي بحراس الأمان                             │
 │    سكربت check_db_target.sh بينفذ السكربتات عبر SQLcl بأمان.│
 │                                                             │
 │ 4. 🪞 تحديث المرايات وسورس كود أبيكس ذرياً                   │
 │    سكربتات export_apps.sh و backup_db.sh بتحدث الـ Git.    │
 │                                                             │
 │ 5. 🗺️ تحديث الـ KNOWLEDGE GRAPH                            │
 │    أمر graphify update . بيحدث شبكة العلاقات الهندسية.      │
 │                                                             │
 │ 6. 🧪 تشغيل حزمة الاختبارات الشاملة                         │
 │    سكربت test_template.sh بيتأكد إن الـ 36 فحص أخضر 100%!   │
 └─────────────────────────────────────────────────────────────┘
```

تعالوا نعيش تجربة عملية واقعية مع بعض: هنبني **جدول Audit Log و Package لتسجيل العمليات وربطها بعملية صفحة في التطبيق!**

* * *

## 📝 المرحلة 1: التخطيط في `ai_generate/`

بندي البرومبت (Prompt) ده للوكيل الذكي كالآتي:

> *"محتاجين جدول سجل رقابة* `APP_AUDIT_LOG` *ومعاه Package اسمها* `PKG_AUDIT` *عشان نسجل التعديلات الحساسة على بيانات العملاء. جهز لي السكربتات القابلة للنشر."*

الـ Agent بيقرا ملفات `app_context/100/` وبيحط الـ Migration الجديد في فولدر `ai_generate/`:

```sql
-- ai_generate/2026-08-29/01_create_audit_log.sql
CREATE TABLE APP_TABLES.APP_AUDIT_LOG (
    LOG_ID        NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    USER_NAME     VARCHAR2(128) DEFAULT COALESCE(SYS_CONTEXT('APEX$SESSION','APP_USER'), USER),
    ACTION_TYPE   VARCHAR2(50)  NOT NULL,
    RECORD_ID     NUMBER        NOT NULL,
    LOG_TIMESTAMP TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL
);
```

```sql
-- ai_generate/2026-08-29/02_pkg_audit.sql
CREATE OR REPLACE PACKAGE APP_CODE.PKG_AUDIT AS
    PROCEDURE LOG_EVENT(p_action IN VARCHAR2, p_record_id IN NUMBER);
END PKG_AUDIT;
/
```

* * *

## 🔍 المرحلتين 2 و 3: المراجعة البشرية والتنفيذ المحمي

لأن ملفات الـ Migration متجهزة في `ai_generate/2026-08-29/`، تقدر تفتح الـ Diff براحتك وتراجعه بعينك في المحرر. مفيش Triggers مستخبية ولا أوامر Drop غدارة.

أول ما توافق على الكود، بتشغل الـ Deployment من خلال حارس الأمان:

```bash
# نشر جدول الـ DDL على بروفايل الجداول (tables)
scripts/check_db_target.sh write tables ai_generate/2026-08-29/01_create_audit_log.sql

# نشر لوجيك الـ Package على بروفايل الكود (code)
scripts/check_db_target.sh write code ai_generate/2026-08-29/02_pkg_audit.sql
```

الحارس بيفحص كونكشن الـ `.env`، ويتأكد من يوزر الـ `SESSION_USER` المتصل، ويطمن إنه مش Production، وينفذ السكربتات بنظافة عبر SQLcl.

* * *

## 🪞 المرحلة 4: التحديث الذري للمرايات (Atomic Mirror Refresh)

دلوقتي بعد ما الداتابيز بقى فيها جداول و Packages جديدة، بنحدث مرايات الكود المحلية:

```bash
# حفظ ميتاداتا الداتابيز الجديدة
scripts/backup_db.sh

# تصدير صفحات أبيكس المحدثة
scripts/export_apps.sh
```

*   ملف `database/APP_TABLES/APP_AUDIT_LOG.sql` بيتولد أوتوماتيك من `DBMS_METADATA`.
*   ملف `database/APP_CODE/PKG_AUDIT.sql` بيتحدث بالكامل.
*   فولدر `apps/APEX_PARSER/100/` بيتحدث بعملية الصفحة الجديدة (Page Process).

كل حاجة بتتم بشكل ذري، ونهايات السطور متنضفة لـ LF، وجاهزة لـ Git Commit معتبر!

* * *

## 🗺️ المرحلة 5: تحديث الـ Knowledge Graph

بنقول لأداة Graphify تحدث فهرس الـ AST كالآتي:

```bash
graphify update .
```

في أقل من ثانيتين، الجراف بيسجل العلاقات الجديدة فوراً:
* `صفحة 20` ──`(calls)`──► `PKG_AUDIT.LOG_EVENT`
* `PKG_AUDIT` ──`(writes_to)`──► جدول `APP_AUDIT_LOG`

أي دور جديد للـ Agent بعد كده هيكون فاهم مسار الـ Audit بالكامل في لمحة بصر!

* * *

## 🧪 المرحلة 6: الشاشة الخضراء (`scripts/test_template.sh`)

أخيراً، وقبل ما ترفع الكود لـ GitHub، بنشغل حزمة اختبارات الانحدار الآلية للقالب:

```bash
scripts/test_template.sh
```

```text
===========================================================
  حزمة اختبارات قالب مشروع ORACLE APEX
===========================================================
  [TEST 01/36] فحص تطابق متغيرات ملف .env.example........ ناجح
  [TEST 02/36] التحقق من مستخرج APEXlang AST............. ناجح
  [TEST 03/36] فحص تحليل قواعد tree-sitter-sql............ ناجح
  [TEST 04/36] اختبار التجهيز الذري في scratch/.......... ناجح
  [TEST 05/36] التأكد من حماية الـ Git Dirty Tree........ ناجح
  [TEST 06/36] فحص توحيد نهايات السطور LF................ ناجح
  [TEST 07/36] التأكد من رفض الكتابة في الـ Production... ناجح
  ...
  [TEST 36/36] التحقق من استعلامات جراف Graphify.......... ناجح
===========================================================
  🎉 36 من أصل 36 اختبار ناجحة تماماً (100% أخضر)
===========================================================
```

* * *

## 🎓 مراجعة سريعة على السلسلة كاملة

مبروك! دلوقتي بقى عندك معمارية متكاملة تنافس كبرى المؤسسات لتطوير Oracle APEX بمساعدة وكلاء البرمجة الذكية (AI Coding Agents)، وإليك ملخصها:

1.  **الجزء الأول (المقدمة)**: التوزيع الفيزيائي للفولدرات وتشبيه جراوي الكلاب الشقية.
2.  **الجزء الثاني (أمان الداتابيز)**: 3 بروفايلات اتصال معزولة وأسماء SQLcl المستعارة بدون باسووردات مكشوفة.
3.  **الجزء الثالث (التصدير الذري)**: التجهيز في `scratch/`، وفحص الـ Dirty Tree، وتوحيد نهايات السطور LF.
4.  **الجزء الرابع (الـ Knowledge Graph)**: دمج Graphify مع مستخرج APEXlang (627 نود و 835 علاقة).
5.  **الجزء الخامس (الذاكرة الدائمة)**: فولدر `app_context/`، وقواعد `AGENTS.md`، وأمر التهيئة `/init`.
6.  **الجزء السادس (تجميع الخيوط)**: خطة طيران الميزة الكاملة في 6 مراحل من الألف للياء.

* * *

## 🌟 نزل القالب وابني مشروعاتك بأمان تام!

اعمل Clone للـ Repository وابدأ اشتغل مع وكلاء الذكاء الاصطناعي وأنت في قمة الثقة وراحة البال:

📦 **مستودع المشروع على GitHub**: [github.com/ash2osh/APEX\_PROJECT\_TEMPLATE](https://github.com/ash2osh/APEX_PROJECT_TEMPLATE)

خلوا دايماً الـ Agents بتوعكم تحت السيطرة، وبرمجة ممتعة للجميع! 🐕⚡🚀

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
