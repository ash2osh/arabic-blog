---
category: apex-project-template
date: '2026-08-15'
description: الجزء الرابع من سلسلة "أبيكس تحت السيطرة". إزاي تربط زراير الـ UI بجداول
  أوراكل في رسم بياني دقيق يوفر آلاف التوكنز ويمنع الهبد تماماً!
draft: false
featured: false
hashnode_draft_id: 6ad869769043ff40e2dccdaf
image: /arabic-blog/covers/004_building-a-brain-for-your-agent-the-custom-apexlang-knowledge-graph.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/building-a-brain-for-your-agent-the-custom-apexlang-knowledge-graph
tags:
- oracle-apex
- ai
- knowledge-graph
- ast
- arabic
title: 'ابني مخ حقيقي للـ Agent بتاعك: الـ APEXlang Knowledge Graph المخصص 🗺️🧠'
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/building-a-brain-for-your-agent-the-custom-apexlang-knowledge-graph).

# ابني مخ حقيقي للـ Agent بتاعك: الـ APEXlang Knowledge Graph المخصص 🗺️🧠

*الجزء الرابع من سلسلة "أبيكس تحت السيطرة".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> لما تسأل AI Agent مبيملكش خريطة هندسية لمشروعك: *"يا فنان، هو إيه اللي بيحصل لما العميل يدوس على زرار 'ادفع الآن' في صفحة 20؟"*، معندوش أي حل غير إنه يروح يعمل `grep` على كل ملف في المشروع، ويسحب 50 ألف سطر كود في الـ Context Window، ويحرق رصيد التوكنز بتاعك على الفاضي، وفي الآخر يخمن إجابة نص كم!
> 
> في المقال ده، هنشوف إزاي [قالب مشروع APEX](https://github.com/ash2osh/APEX_PROJECT_TEMPLATE) بيزود الـ Agent بـ **Knowledge Graph عالي الدقة** مبني بأداة [Graphify](https://github.com/ash2osh) ومستخرج **APEXlang AST** مخصص—بيربط زراير شاشات الـ UI بجداول أوراكل في استعلامات بتاخد أجزاء من الثانية.

* * *

## 🏙️ جولة في شوارع روما: الـ GPS ضد التوهان في الضلمة

تخيل إنك بتدور على مخبز إيطالي معين في وسط شوارع روما العريقة:

*   **الطريقة (أ) - العمياني بالـ Grep**: تلف على كل عمارة في كل شارع، تخبط على الأبواب، تقرأ عقود الإيجار، وتسأل السكان: "هو أنتم بتعملوا كانولي؟". دي بالظبط طريقة الـ LLMs لما تسيبها معندهاش غير أداة `grep`!
*   **الطريقة (ب) - الـ GPS وخريطة المترو**: تفتح خريطة مسارات واضحة تقلك: `المحطة -> الميدان -> المخبز -> المنيو`. بتوصل في 3 دقايق من غير ما تضيع خطوة واحدة.

في قالب Oracle APEX بتاعنا، الـ Knowledge Graph هو الـ GPS الهندسي ده بالظبط:

```plaintext
 [ صفحة 20: إنهاء الطلب Checkout ]
         │
         ├──(contains)────────► [ Region: بيانات الدفع ]
         │                              │
         │                              ├──(reads_from)──► [ جدول: CUSTOMER_CARDS ]
         │                              │
         └──(calls)───────────► [ PL/SQL: PKG_BILLING.PROCESS_PAYMENT ]
                                        │
                                        └──(writes_to)───► [ جدول: INVOICE_HEADERS ]
```

* * *

## 🧩 ليه أدوات التحليل العادية (Generic Parsers) بتفشل مع APEX؟

لو رميت ملف `.apx` لأي أداة تحليل كود تقليدية، بتعامله كأنه شوية كود SQL عادي ومرمي على بعضه.

أقصى حاجة هتطلعهالك هي نود سطحية على مستوى الملفات زي `f100_page_20.apx (File)`، وبـ **صفر فهم معماري حقيقي**.

الأداة العادية معندهاش أي فكرة إن:
* بلوك التكست المعين ده عبارة عن **Interactive Grid**.
* حتة الـ JSON دي بتعرف **Dynamic Action**.
* كود الـ SQL ده محمي بـ **Authorization Scheme** معين.

* * *

## 🔬 السر الصنعة: سكربت `graphify_apexlang_extractor.py`

عشان نعلم أداة Graphify إزاي تقرأ Oracle APEX صح، بنينا مستخرج لغة مخصص اسمه **APEXlang Extractor**.

السكربت بيقرأ ملفات `.apx` كعناصر معمارية حقيقية وبيطلع **علاقات هندسية قطعية**:

| العلاقة في الجراف | بتمثل إيه في التطبيق؟ |
| --- | --- |
| `contains` | التطبيق يحتوي صفحات؛ الصفحة تحتوي Regions؛ الـ Region يحتوي Items وزراير. |
| `navigates_to` | دوسات الزراير والـ Branches والتحويلات اللي بتوديك من صفحة لصفحة تانية. |
| `secured_by` | خطط المصادقة والتصريح (Auth Schemes) المربوطة بالصفحات أو الـ Regions. |
| `reads_from` | استعلامات الـ SQL في التقارير والـ Grids والشارتات اللي بتقرأ من الجداول والـ Views. |
| `writes_to` | معالجات البيانات التلقائية (DML) اللي بتعدل أو تمسح في الجداول. |
| `calls` | عمليات الـ PL/SQL اللي بتنادي Packages أو Procedures أو Functions في الداتابيز. |

### 🎯 دقة 100% حتمية (بدون أي هبد أو تخيل)

ده مش نموذج ذكاء اصطناعي بيخمن علاقات—ده **تحليل نحوي قطعي (Pure AST Parse)**. بيشتغل محلياً بلغة Python في أقل من ثانيتين، مبيكلفكش مليم في الـ APIs، وبيطلع نفس النتيجة الموثوقة كل مرة.

* * *

## 🌉 كوبري الربط: لما شاشات APEX تقابل جداول الـ DDL

أقوى ميزة في الجراف ده هي الربط المباشر بين واجهة المستخدم (UI) والداتابيز:

1.  مستخرج APEX بيفهرس فولدر `apps/<parsing-schema>/<app-id>/`.
2.  محلل `tree-sitter-sql` بيفهرس فولدر `database/<schema>/` (ملفات الـ DDL النظيفة).
3.  **وهنا السحر بيحصل**: Graphify بتدمج الاتنين مع بعض في شبكة واحدة!

لما منطقة الدفع في صفحة 20 تطلع سهم `reads_from: CUSTOMER_CARDS`، السهم مبيشاورش على مجرد اسم جدول وخلاص—ده بينط مباشرة على **النود الحقيقية لتعريف الجدول** في `database/APP_TABLES/CUSTOMER_CARDS.sql`!

```plaintext
 ┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
 │ شاشات أبيكس (apps/...)               │       │ جداول الداتابيز (database/...)       │
 │                                      │       │                                      │
 │ [ صفحة 20: تفاصيل الفاتورة ]         │       │ [ جدول: ORDERS ]                     │
 │   └── Region: جدول الأوردرات         │       │   ├── عمود: ORDER_ID (PK)            │
 │         └── reads_from ──────────────┼───────┼──►├── عمود: CUSTOMER_ID              │
 │                                      │       │   └── عمود: TOTAL_AMOUNT             │
 └──────────────────────────────────────┘       └──────────────────────────────────────┘
```

في التطبيقات التجريبية، ده بيولد **627 عقدة (نود) و 835 علاقة** رابطة معمارية المؤسسة كلها ببعضها.

* * *

## ⚡ توفير التوكنز: 50,000 توكن مقابل 250 توكن بس!

تعالوا نشوف إيه اللي بيحصل في جلسة برمجة حقيقية لما تطلب من الـ Agent يحقق في مشكلة في الكود:

```bash
# الـ Agent بيسأل الجراف بدل ما يفضل يلف على الملفات بالـ Grep
graphify query "What components interact with INVOICE_HEADERS?"
```

```text
[GRAPH MATCH] Node: TABLE:INVOICE_HEADERS
  ├── read_by:    Page 10 (Interactive Report: 'Open Invoices')
  ├── written_by: Page 20 (Process: 'Create Invoice Header')
  ├── called_by:  Package: PKG_BILLING.GENERATE_PDF
  └── secured_by: Scheme: IS_FINANCE_USER
```

بدل ما يشفط عشرات الملفات في الـ Context، الـ Agent بيستلم الرسم البياني الصغير ده (حوالي 250 توكن بس!)، وبيفهم فوراً المسار المعماري بالكامل.

**النتيجة**: ردود سريعة جداً، صفر تهييس، وتوفير ضخم في فلوس الـ API! 💰✨

* * *

## 🛠️ إزاي تركبه في مشروعك بأمرين اتنين؟

```bash
# 1. تثبيت أداة Graphify مع دعم الـ SQL
uv tool install graphifyy --with tree-sitter-sql

# 2. ربط مستخرج APEX واستخراج الجراف
python3 setup_graphify_apx.py
graphify extract . --force
```

بعد ما تعدل في الكود، تحديث الجراف بيتم في لحظة:
* شغل `graphify update .` بعد تعديل ملفات `.apx` أو `.sql` (تحديث فوري بدون تكلفة API).
* شغل `graphify extract .` لما تعدل ملاحظات معمارية في `app_context/`.

* * *

## 🔮 إيه اللي مستنينا في الجزء الخامس؟

في **الجزء الخامس**، هندخل في **الذاكرة الدائمة والـ Agent Context**:
* إزاي فولدر `app_context/<app-id>/` بيعالج فقدان ذاكرة وكلاء الذكاء الاصطناعي بين الشات والتاني.
* إزاي تفهم الـ Agent التكات الغريبة الخاصة بالبيزنس بتاعك (زي الـ APEX Collections ضد الجداول العادية).
* وإزاي أمر `/init` التفاعلي بيجهز الـ Agent للشغل في أقل من 60 ثانية!

استنونا في الجزء الخامس! 📓☕

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
