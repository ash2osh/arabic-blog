---
category: enterprise-workflows
date: '2026-10-14'
description: الجزء الرابع من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس". ليه
  رص 40 زرار بشروط معقدة في Page Designer يعتبر ديون تقنية قاتلة—وإزاي جدول ميتاداتا
  بيحلها في ثواني!
draft: false
featured: false
hashnode_draft_id: 6ad869921d7a01b5589bacbc
image: /arabic-blog/covers/018_goodbye-hardcoded-buttons-storing-ui-actions-in-database-rows.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/goodbye-hardcoded-buttons-storing-ui-actions-in-database-rows
series_part: 4
tags:
- oracle-apex
- lowcode
- ui-design
- architecture
- database-design
- arabic
title: "وداعاً للزراير الثابتة: تخزين أكشنز الشاشات في سطور الداتابيز \U0001F39B️\U0001F4CB"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/goodbye-hardcoded-buttons-storing-ui-actions-in-database-rows).

# وداعاً للزراير الثابتة: تخزين أكشنز الشاشات في سطور الداتابيز 🎛️📋

*الجزء الرابع من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> لو فتحت قبل كده Oracle APEX Page Designer واتصدمت بمنظر 40 زرار مرصوصين جنب بعض في الهيدر—وكل زرار فيهم وراه مكرونة من الـ Server-Side Conditions زي *"يظهر بس لو الخطوة هي FINANCE_AUDIT، والأولوية HIGH، واليوزر معاه ROLE_CONTROLLER"*—فأنت عشت قمة الديون التقنية (Technical Debt) بعينك!
> 
> بنقل تعريفات وتنسيقات الزراير لجدول ميتاداتا علائقي (**`wf_action_config`**)، بنحول شاشة أبيكس لوحدة تحكم برمجية ديناميكية بترسم الزراير، والألوان، والأيقونات، ورسائل التأكيد المظبوطة لكل خطوة من مئات خطوات الـ Workflows من غير ما تفتح Page Designer مرة تانية في حياتك!
> 
> هنا هنتعلم إزاي نستبدل زحمة الزراير دي ببيانات وصفية شيك ومحترمة.

* * *

## 🎮 ذراع الألعاب القديم الملحوم ضد الدراع الذكي القابل للبرمجة

تخيل عالم أذرع ألعاب الفيديو (Controllers) كالمثال التالي:

*   **كابوس الدراع القديم الملحوم بـ كاوية اللحام**: كل ما تنزل لعبة جديدة في السوق، تجيب كاوية القصدير، وتسيح خرم جديد في البلاستيك بتاع الدراع، وتلحم زرار أحمر في لوحة الدوائر الإلكترونية، وتكتب عليه بقلم فلوماستر "تعويذة سحرية"! بعد 6 شهور، شكل الدراع بتاعك هيبقى شبه القنفذ المشوه بـ 50 زرار بارزين في كل اتجاه!
*   **الدراع الذكي الحديث**: الدراع فيه شريط أنيق من الزراير المزودة بشاشات OLED صغيرة. لما تشغل لعبة سباق عربيات، زرار 1 ينور بالأخضر ويكتب "نيترو". ولما تشغل لعبة ألغاز، نفس الزرار يتحول للأزرق ويكتب "تدوير القطعة". عتاد الهاردوير ثابت مبيتغيرش؛ اللعبة هي اللي بتبعت له ملف الإعدادات بس!

في تطبيقات Oracle APEX للمؤسسات، تثبيت عشرات الزراير يدوي في Page Designer هو بالظبط كاوية اللحام في البلاستيك. بيطلع نظام هش، معقد، وصيانته كابوس.

* * *

## 💥 عذاب صفحة الـ 40 زرار في أبيكس

لما تبني مسارات عمل وموافقات معقدة متعددة المراحل، كل مرحلة بتتطلب زراير وإجراءات مختلفة تماماً:
* خطوة **مراجعة المدير**: محتاجة زراير `Approve`، و `Reject`، و `Request Info`.
* خطوة **مراجعة الحسابات والمالية**: محتاجة `Verify Budget`، و `Authorize Payment`، و `Return to Requester`.
* خطوة **المراجعة القانونية**: محتاجة `Upload Addendum`، و `Flag Clause`، و `Approve Terms`.

لو بنيت ده بالطريقة التقليدية جوه شاشة أبيكس:
1. **الـ Page Designer بيبقى مستحيل استخدامه**: شجرة المكونات (Component Tree) بتتحول لحائط سد فيه 45 زرار!
2. **الشروط بتبقى مكرونة اسباجيتي**: بتنتهي بـ 45 شرط PL/SQL معقد بيفحص الـ Session State والـ Roles والمبالغ.
3. **كوارث تضارب الـ Merge في Git**: لو مطورين عدلوا في زرارين مختلفين على نفس الصفحة، ملف الـ SQL المصدر بيطلع فيه مئات سطور التضارب غير القابلة للحل!
4. **انعدام المرونة**: مجرد تغيير كلمة على زرار من *"Reject"* لـ *"Return for Revisions"* بيتطلب دورة سوفتوير كاملة: تذكرة شغل، وتعديل، وتصدير، وتيست، ونشر على السيرفر!

* * *

## 📋 الحل الذكي: جدول الميتاداتا `wf_action_config`

في المعمارية القابلة للتوسع، أكشنز الشاشات بتتعامل كـ **سطور بيانات في جدول**. بنعرف جدول لإعدادات الأكشنز في سكيما الداتا (`app_data`) كالآتي:

```sql
-- ====================================================================
-- جدول: app_data.wf_action_config
-- الهدف: ميتاداتا وصفية بتعرف زراير الأكشنز لكل خطوة في الـ Workflow
-- ====================================================================

create table app_data.wf_action_config (
    step_id          varchar2(50) primary key, -- مثلاً: 'PO_MANAGER_REVIEW'
    step_name        varchar2(150) not null,
    module_code      varchar2(50)  not null,   -- مثلاً: 'PROCUREMENT', 'CAPEX'
    
    -- مكان الزرار الأول
    has_btn1         varchar2(1)   default 'N' check (has_btn1 in ('Y', 'N')),
    btn1_config      varchar2(200), -- التنسيق: النص,كلاس_CSS,كلاس_الأيقونة,رسالة_تأكيد
    btn1_action_code varchar2(50),  -- مثلاً: 'APPROVE'
    
    -- مكان الزرار الثاني
    has_btn2         varchar2(1)   default 'N' check (has_btn2 in ('Y', 'N')),
    btn2_config      varchar2(200),
    btn2_action_code varchar2(50),  -- مثلاً: 'REJECT'
    
    -- مكان الزرار الثالث
    has_btn3         varchar2(1)   default 'N' check (has_btn3 in ('Y', 'N')),
    btn3_config      varchar2(200),
    btn3_action_code varchar2(50),  -- مثلاً: 'REQUEST_INFO'
    
    -- مكان الزرار الرابع
    has_btn4         varchar2(1)   default 'N' check (has_btn4 in ('Y', 'N')),
    btn4_config      varchar2(200),
    btn4_action_code varchar2(50),
    
    created_at       timestamp with local time zone default current_timestamp,
    updated_at       timestamp with local time zone default current_timestamp
);
```

* * *

## 🎨 تعريف الزراير في سطور داتا سهلة ومباشرة

بصوا بقى على السهولة والجمال لما نحدد إعدادات الشاشات كسطور داتا عادية:

```sql
-- 1. خطوة مراجعة مدير الإدارة لأمر الشراء
insert into app_data.wf_action_config (
    step_id, step_name, module_code,
    has_btn1, btn1_config, btn1_action_code,
    has_btn2, btn2_config, btn2_action_code,
    has_btn3, btn3_config, btn3_action_code
) values (
    'PO_MANAGER_REVIEW', 
    'Department Manager PO Review', 
    'PROCUREMENT',
    'Y', 'Approve Order,u-success,fa-check,1',            'APPROVE',
    'Y', 'Reject Order,u-danger,fa-times,1',             'REJECT',
    'Y', 'Request Clarification,u-warning,fa-comment,0', 'REQUEST_INFO'
);

-- 2. خطوة المراجعة المالية للمصروفات الرأسمالية (CAPEX)
insert into app_data.wf_action_config (
    step_id, step_name, module_code,
    has_btn1, btn1_config, btn1_action_code,
    has_btn2, btn2_config, btn2_action_code
) values (
    'CAPEX_FINANCE_AUDIT', 
    'Capital Expenditure Executive Audit', 
    'CAPEX',
    'Y', 'Authorize Expenditure,u-success,fa-check-circle,1', 'APPROVE',
    'Y', 'Return for Budget Revision,u-danger,fa-undo,1',     'REJECT'
);

-- 3. مطابقة فواتير الموردين في الحسابات
insert into app_data.wf_action_config (
    step_id, step_name, module_code,
    has_btn1, btn1_config, btn1_action_code,
    has_btn2, btn2_config, btn2_action_code,
    has_btn3, btn3_config, btn3_action_code
) values (
    'AP_INVOICE_MATCH', 
    'Accounts Payable 3-Way Match', 
    'INVOICING',
    'Y', 'Confirm Match & Release,u-primary,fa-link,1',   'MATCH_RELEASE',
    'Y', 'Flag Discrepancy,u-danger,fa-flag,1',           'FLAG_ERROR',
    'Y', 'Upload Supporting Dockets,u-info,fa-upload,0',  'UPLOAD_ATTACHMENT'
);
```

### فك تشفير نص إعدادات الزرار (`btn_config`):
لاحظ النص المكون من 4 أجزاء مفصولين بفواصل:
```plaintext
'Approve Order,u-success,fa-check,1'
       │          │          │   └── شاشة التأكيد المنبثقة: 1=اطلب تأكيد، 0=تنفيذ فوري
       │          │          └────── أيقونة Font Awesome: fa-check
       │          └───────────────── كلاس ألوان ثيم أبيكس Universal Theme: u-success (أخضر)
       └──────────────────────────── النص المكتوب على الزرار: "Approve Order"
```

* * *

## 🌟 ليه الطريقة دي بتكسب الزراير الثابتة بالضربة القاضية؟

| الميزة | زراير Page Designer الثابتة | جدول الميتاداتا `wf_action_config` |
|---|---|---|
| **عدد الزراير على الصفحة** | 30 – 50 مكون مرصوصين | **صفر زراير ثابتة** (حاوية واحدة ديناميكية) |
| **إضافة خطوة موافقة جديدة** | ضيف زراير، واكتب شروط، وصدر الكود، واعمل Deploy | **ضيف سطر واحد** في جدول الداتابيز |
| **تغيير اسم أو لون زرار** | تعديل كود + Pull Request + Deployment | أمر `UPDATE` بسيط في ثانيتين بس! |
| **رسائل التأكيد (Confirmations)**| كود جافاسكريبت مخصص لكل زرار | فلاج جاهز (`1` أو `0`) بيتعالج تلقائياً |
| **تناسق الألوان والمظهر** | سهل المطورين يلخبطوا في الألوان | معايير مفروضة من الداتابيز (`u-success`, `u-danger`) |
| **تضارب الـ Git** | خناقات وتضارب مستمر في ملفات الصفحات | **صفر تضارب** على صفحة الـ UI |

* * *

## 🦎 إيه اللي مستنينا في الجزء الخامس؟

الميتاداتا دلوقتي متخزنة بأمان في جداول الداتابيز. لكن إزاي Oracle APEX بتاخد السطور دي وتحولها لزراير HTML تفاعلية وشيك جداً على شاشة المستخدم وقت التشغيل؟

والأهم من كده: إزاي نتأكد إن الموظفين اللي معاهم صلاحية بس هما اللي يقدروا يشوفوا ويدوسوا على الزراير دي؟

في **الجزء الخامس ("شاشة الحرباء: الرسم الديناميكي لأشرطة الأكشنز في صفحة 8")**، هنبني منطقة PL/SQL ديناميكية على صفحة تفاصيل الطلب، بتغير شكل شريط الأدوات تلقائياً في لمح البصر مع تطبيق أمان سيرفر صارم لا يمكن اختراقه!

استنونا في الجزء الخامس! 🦎🎚️✨

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
