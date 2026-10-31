---
category: enterprise-workflows
date: '2026-10-06'
description: الجزء الثاني من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس". إزاي
  جدول كاش خفيف يحول استعلامات الشاشات من 15 ثانية انتظار لـ 20 ميلي ثانية وبسرعة
  600 ضعف!
draft: false
featured: false
hashnode_draft_id: 6ad8698fb7abc8958ad96d45
image: /arabic-blog/covers/016_the-kitchen-ticket-carousel-designing-a-high-speed-workflow-cache.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/the-kitchen-ticket-carousel-designing-a-high-speed-workflow-cache
tags:
- oracle-apex
- workflows
- performance
- caching
- sql
- arabic
title: "حامل بونات المطبخ: تصميم كاش العمليات عالي السرعة \U0001F3AB⚡"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/the-kitchen-ticket-carousel-designing-a-high-speed-workflow-cache).

# حامل بونات المطبخ: تصميم كاش العمليات عالي السرعة 🎫⚡

*الجزء الثاني من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> لما الأوردرات تهجم على مطعم زحمة ليلة السبت، شيفات خط الطبخ مستحيل يسيبوا الشواية ويدخلوا مخزن البضاعة يعدوا كراتين الصلصة ويراجعوا فواتير الموردين عشان يعرفوا إيه المطلوب يطبخوه! هما بيبصوا قدامهم مباشرة على "حامل البونات الدوار" اللي متعلق فوق الشواية.
> 
> ببناء جدول كاش عمليات مخصص (**`wf_task_cache`**)، بنفرز ونخزن بس البيانات اللي شاشات المهام محتاجاها بالضبط—وبنحول استعلامات بطيئة بتاخد 15 ثانية على الـ Views الرسمية لعملية بحث فوري في الفهارس بتاخد 20 ميلي ثانية بس!
> 
> هنا هنتعلم إزاي نبني، ونفهرس، ونستعلم من جدول كاش فائق السرعة للـ Workflows جوه Oracle Database.

* * *

## 🍳 مخزن البضائع الخلفي ضد حامل البونات السريع

في [الجزء الأول](./015_the-30000-task-traffic-jam-why-native-apex-workflow-views-hit-a-wall.md)، شرحنا ليه الاستعلام المباشر من `APEX_TASKS` في الأعداد الكبيرة بيهد حيل الداتابيز، لأنه بيجبرها تحسب شجرة الصلاحيات وتفك الـ JSON لكل سطر في النظام.

تخيل معايا إدارة مطعم كبير:

*   **طريقة مخزن البضائع (الاستعلام المباشر من `APEX_TASKS`)**: كل ما ترابيزة 7 تطلب ستيك مشوي، الشيف يسيب ماسك الشواء، ويدخل المكتب ورا، ويفتح درج الأرشيف بالمفتاح، ويقرا بوليصة شحن اللحمة، ويفحص شهادة الصحة، ويحسب هامش الربح! المطبخ في نص ساعة هيتأخر 3 ساعات عن الزباين!
*   **طريقة حامل بونات المطبخ (جدول كاش العمليات `wf_task_cache`)**: الويتر بيكتب الطلب على التابلت. طابعة البونات فوق الشواية تطلع كارت صغير 5 سم يتعلق في الحامل الدوار. الكارت فيه 4 معلومات واضحة وصريحة: **ترابيزة 7**، **ستيك ريب آي (وسط)**، **الساعة 7:42 م**، **الويتر: ماركوس**.

الشيف بيبص للبونة، يسوي الستيك في 6 دقايق، يطلعه على الطبق، ويشك البونة في مسمار الأوردرات المخلصة!

في معمارية Oracle APEX بتاعتنا، جدول **`wf_task_cache`** هو بالظبط حامل البونات السريع ده.

* * *

## 🏗️ التصميم الهندسي لجدول `wf_task_cache`

بدل ما نخلي تقارير أبيكس تغوص في جداول الداتابيز الداخلية المعقدة (`WWV_FLOW_TASKS$`)، بنعمل جدول بسيط ونظيف في الـ Schema المخصصة للداتا (`app_data`) كالآتي:

```sql
-- ====================================================================
-- جدول: app_data.wf_task_cache
-- الهدف: كاش عمليات عالي السرعة لمهام الـ Workflow النشطة
-- ====================================================================

create table app_data.wf_task_cache (
    cache_id         number generated always as identity primary key,
    request_id       number not null,
    task_id          number,
    task_group       varchar2(100) not null, -- مثلاً: 'PURCHASE_REQUESTS', 'INVOICES'
    task_type        varchar2(200) not null, -- مثلاً: 'PO_FINANCE_APPROVAL'
    status           varchar2(50)  not null, -- 'PENDING', 'ASSIGNED', 'IN_PROGRESS'
    priority         number(2,0)   default 3 not null, -- 1=طارئ، 2=عالي، 3=عادي
    requester_id     number,
    requester_name   varchar2(250),
    title            varchar2(300) not null,
    amount           number(14,2),           -- مؤشر مالي مهم للفلترة السريعة
    potential_owners varchar2(4000),         -- لستة مسبقة الحساب باليوزرات والأدوار المسموح لها بالاعتماد
    created_at       timestamp with local time zone default current_timestamp not null,
    updated_at       timestamp with local time zone default current_timestamp not null
);

-- فهارس الأداء الحاسمة
create index app_data.wf_task_cache_grp_st_idx 
    on app_data.wf_task_cache(task_group, status, priority, created_at);

create index app_data.wf_task_cache_req_idx 
    on app_data.wf_task_cache(request_id);

create index app_data.wf_task_cache_task_idx 
    on app_data.wf_task_cache(task_id);
```

* * *

## 🧠 السلاح السري: حساب الصلاحيات مسبقاً (Pre-Aggregated Security)

أكبر سبب لبطء استعلامات المهام في أبيكس هو **حساب المشاركين لحظة القراءة (Runtime Participant Calculation)**. لو مهمة متخصصة لجروب مدراء الحسابات `FINANCE_MANAGERS`، الداتابيز بتضطر تفحص جداول الأمان لكل سطر عشان تشوف هل `:APP_USER` عضو في الجروب ده حالياً ولا لأ!

في جدول الكاش بتاعنا، نقلنا الحسبة دي من **وقت القراءة (Read Time)** لـ **وقت الكتابة (Write Time)**:

أول ما المهمة بتتكريت، كود الـ Workflow بيحسب لستة الناس المسموح لهم بالموافقة وبيخزنها في نص موحد ومفصول بفواصل:

```plaintext
,ADMIN,FINANCE_MANAGERS,SARAH_CONNOR,JOHN_DOE,
```

لاحظ الفواصل اللي في الأول وفي الآخر. بفضل الفواصل دي، نقدر نعمل بحث مطابقة دقيق في جملة الـ SQL بدون أي لخبطة بين الأسماء المتشابهة (مثلاً مطابقة `JOHN` جوه `JOHN_DOE`) كالتالي:

```sql
-- فحص أمان صاروخي ومضمون في الـ SQL
and instr(potential_owners, ',' || :APP_USER || ',') > 0
```

> [!TIP]
> ### ⚡ اكتب مرة واحدة، واقرأ آلاف المرات!
> في أنظمة الشركات، المهمة بتتكريت أو تتعدل مرة أو مرتين في حياتها. لكنها بتتقري وتتفلتر وتترتب من عشرات المدراء مئات المرات في اليوم! نقل التعقيد الحسابي لمرحلة الكتابة بيحول كل استعلام قراءة لعملية Index Scan رخيصة جداً على السيرفر!

* * *

## ⚡ استعلام شاشة المهام في APEX

مع وجود جدول الكاش، بنعمل View نظيفة في الـ Schema المخصصة للبرمجة (`app_code`) كالآتي:

```sql
create or replace view app_code.v_pending_tasks as
select c.cache_id,
       c.request_id,
       c.task_id,
       c.task_group,
       c.task_type,
       c.title,
       c.priority,
       c.amount,
       c.requester_name,
       c.potential_owners,
       c.created_at
  from app_data.wf_task_cache c
 where c.status in ('PENDING', 'ASSIGNED');
```

شوف بقى كويري الـ APEX Interactive Report بقى نظيف وسريع إزاي:

```sql
-- استعلام شاشة المهام في أبيكس
select request_id,
       task_id,
       task_type,
       title,
       priority,
       amount,
       requester_name,
       created_at
  from app_code.v_pending_tasks
 where task_group = :P100_TASK_GROUP
   and (
       instr(potential_owners, ',' || :APP_USER || ',') > 0
       or exists (
           select 1 
             from app_security.user_roles r
            where r.user_name = :APP_USER
              and instr(potential_owners, ',' || r.role_name || ',') > 0
       )
   );
```

* * *

## 📊 مقارنة الأداء بالأرقام: الـ View الجاهزة ضد جدول الكاش

دي أرقام حقيقية اتسجلت على داتابيز أوراكل شغالة فيها 35,000 مهمة ومسار موافقات نشط:

| المقياس | الـ View الجاهزة `APEX_TASKS` | جدول الكاش السريع (`wf_task_cache`) | نسبة التحسن |
|---|---|---|---|
| **وقت استجابة الشاشة** | 14.8 ثانية انتظار | **0.024 ثانية (24 ميلي ثانية بس!)** | **أسرع 600 ضعف** |
| **قراءات الذاكرة (Buffer Gets)** | ~340,000 قراءة | **45 قراءة بس** | **توفير 99.98% من استهلاك الـ I/O** |
| **خطة التنفيذ (Execution Plan)** | Full scan + nested loops | B-Tree Index Range Seek | **أفضل خطة بحث في الفهارس** |
| **استهلاك الـ CPU** | بيطير لـ 90%+ | مسطح تحت 2% | **تأثير شبه منعدم على السيرفر** |
| **تجربة المستخدم** | الصفحة بتهنج والدايرة بتلف | الشاشة بتفتح في غمضة عين | **سلسة وسريعة جداً** |

* * *

## 🔄 سؤال التحديث: إزاي بنضمن إن الكاش طازة دايماً؟

أي كاش في الدنيا قوته بتعتمد على طريقة مزامنته:
* لما موظف يقدم طلب شراء جديد، إزاي بينزل فوراً على حامل البونات؟
* ولما المدير يدوس "موافق"، إزاي المهمة بتختفي فوراً من غير ما تسيب أشباح وراها؟

في **الجزء الثالث ("تزامن الكاش بالأحداث: تحديث كاش المهام بنسبة 100% فورياً")**، هنبني Triggers خفيفة في الداتابيز وحزم مزامنة بتخلي `wf_task_cache` متزامن بالمللي مع أحداث الـ Workflow في اللحظة نفسها—بدون أي Cron Jobs ولا Polling دوري متعب!

استنونا في الجزء الثالث! 🔄🔔

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*