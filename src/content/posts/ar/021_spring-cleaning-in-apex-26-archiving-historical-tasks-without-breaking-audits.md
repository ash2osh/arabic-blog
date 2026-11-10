---
category: enterprise-workflows
date: '2026-10-26'
description: الجزء السابع (مسك الختام) من سلسلة "إدارة الـ Workflows الضخمة في أوراكل
  أبيكس". إزاي تنضف جداول التشغيل من ملايين المهام المنتهية وتحافظ على سجلات الرقابة
  القانونية بأعلى أداء!
draft: false
featured: false
hashnode_draft_id: 6ad869981d7a01b5589bacdf
image: /arabic-blog/covers/021_spring-cleaning-in-apex-26-archiving-historical-tasks-without-breaking-audits.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/spring-cleaning-in-apex-26-archiving-historical-tasks-without-breaking-audits
series_part: 7
tags:
- oracle-apex
- workflows
- database
- data-archiving
- dba
- arabic
title: "حملة تنظيف الربيع في APEX 26.1: أرشفة المهام التاريخية بدون كسر التدقيق \U0001F5C4️\U0001F9F9"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/spring-cleaning-in-apex-26-archiving-historical-tasks-without-breaking-audits).

# حملة تنظيف الربيع في APEX 26.1 — أرشفة المهام التاريخية بدون كسر التدقيق 🗄️🧹

*الجزء السابع (مسك الختام) من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> لو فضلت محتفظ بكل فاتورة كهرباء، وكل إيصال فيزا، وكل إقرار ضريبي من آخر 12 سنة متكومين جوه درج مكتبك اللي بتفتحه كل يوم، في الآخر مش هتعرف تشد الدرج 2 سم عشان تطلع قلم تكتب بيه!
> 
> في ختام السلسلة دي، هنتعلم إزاي ندمج **الـ Human Task Archiving APIs الجديدة في Oracle APEX 26.1** مع **استراتيجيات تقسيم الجداول الشهرية (Interval Range Partitioning)** في قاعدة بيانات أوراكل.
> 
> ده بيحافظ على جداول التشغيل اليومية خفيفة، وصاروخية، ومضغوطة الحجم—وفي نفس الوقت بيضمن إن سجلات التدقيق التاريخية تفضل متاحة 100% لمفتشي الامتثال والرقابة القانونية للشركة.

* * *

## 🗄️ درج المكتب الشغال ضد الخزنة المحصنة المكيفة

كل نظام Workflows وموافقات في الشركات بيصطدم في النهاية بـ **قانون تراكم البيانات (Law of Data Accumulation)**:

*   **السنة الأولى (مرحلة العسل)**: النظام بتاعك بيدير 500 مهمة وموافقة نشطة بس. الجداول صغيرة جداً، وفهارس الـ B-Tree كلها مرتاحة جوه رامات الداتابيز (Buffer Cache)، وكل استعلام بيفتح في أقل من 10 ميلي ثانية.
*   **السنة الثالثة (مرحلة الغرز في الطين)**: شركتك نفذت **أكتر من 3,500,000 مسار عمل منتهي**. الجداول بقى حجمها 45 جيجابايت! صيانة الفهارس مع كل عملية Insert بدأت تسبب بطء ملحوظ في الـ I/O، والنسخ الاحتياطي اليومي بقى يمتد لبعد الفجر، وبحث المدراء في الشاشات بقى يجر الداتابيز كلها لتحت!

### ليه مستحيل تقول "يا عم نشغل أمر `DELETE` وخلاص"؟!
في أنظمة الشركات الكبرى، مينفعش تدخل تضرب `DELETE FROM wf_requests WHERE status = 'COMPLETED'`:
* **المتطلبات القانونية والضريبية**: مصلحة الضرائب، ومفتشو الأيزو، والرقابة المالية بيلزموا الشركات بالاحتفاظ بسجلات الموافقات وتفاصيل القرارات لمدد من 7 لـ 10 سنين!
* **نزاهة التدقيق والمراجعة (Audit Integrity)**: كل كومنت، وكل توقيع إلكتروني، وكل تاريخ تفويض لازم يفضل موجود ومحفوظ بحالته الأصلية.

الحل مش الحذف؛ الحل هو **أرشفة دورة الحياة (Lifecycle Archival)**. جداول التشغيل اليومية تشيل بس الشغل الحي، والأرشيف التاريخي يروح لخزنة الأرشيف المحمية.

* * *

## ✨ إيه الجديد في أرشفة Oracle APEX 26.1؟

بداية من إصدار Oracle APEX 26.1، أوراكل أدركت عنق الزجاجة ده وقدمت دوال رسمية ومدمجة لإدارة دورة حياة الـ Human Tasks والـ Workflows كالآتي:
* `apex_task.archive`
* `apex_workflow.archive`

```sql
-- تشغيل الأرشفة البرمجية في APEX 26.1
begin
    apex_task.archive (
        p_task_id      => 108429,
        p_archive_type => apex_task.c_archive_completed
    );
end;
/
```

### المزايا اللي بتقدمها أرشفة APEX 26.1 الرسمية:
1. **النقل لمخزن الأرشيف البارد (Cold Storage)**: بتنقل المهام المقفولة برة طوابير التشغيل النشطة لمخازن أرشيف داخلية معزولة.
2. **Views مخصصة للأرشيف التاريخي**: المهام المؤرشفة بتفضل متاحة للاستعلام عبر `APEX_TASK_ARCHIVE` و `APEX_WORKFLOW_ARCHIVE`. شاشات التقارير التاريخية تقدر تستعلم منها براحتها بدون ما تلمس شاشة المهام النشطة أو تأثر على سرعتها!
3. **استعادة رشاقة الفهارس**: الفهارس النشطة على جداول أبيكس بترجع صغيرة وخفيفة وشايلة بس الطلبات المفتوحة.

* * *

## 🏗️ على مستوى الداتابيز: التقسيم الشهري الآلي (Interval Partitioning)

لسجلات العمليات الكبيرة (زي جدول `app_data.wf_task_event_log`)، بندمج أرشفة أبيكس مع **تقسيم الجداول الشهري الآلي** في أوراكل:

```sql
-- ====================================================================
-- جدول: app_data.wf_task_event_log (مقسم شهرياً بالـ Interval)
-- ====================================================================

create table app_data.wf_task_event_log (
    event_id         number generated always as identity,
    request_id       number not null,
    task_id          number,
    action_type      varchar2(50) not null,
    previous_status  varchar2(50),
    new_status       varchar2(50) not null,
    action_user      varchar2(100) not null,
    action_comments  varchar2(4000),
    event_timestamp  timestamp with local time zone default current_timestamp not null
)
partition by range (event_timestamp) 
interval (numtoyminterval(1, 'month')) (
    partition p_initial values less than (timestamp '2025-01-01 00:00:00')
);

-- فهارس محلية معزولة لكل بارتشن
create index app_data.wf_task_event_req_lidx 
    on app_data.wf_task_event_log(request_id) local;
```

* * *

## 🚀 القوى الخارقة لتقسيم الـ Interval Partitioning

ليه التقسيم ده يعتبر سلاح سري في قواعد بيانات المؤسسات؟

### 1. ضغط البارتشنات القديمة بدون أي توقف (Zero-Downtime Compression)
في نهاية كل ربع سنة، سكربت صيانة آلي يقدر يضغط شهور السنة اللي فاتت اللي محدش بيعدل فيها:

```sql
-- ضغط بارتشن قديم لتوفير لحد 80% من مساحة الهارد ديسك
alter table app_data.wf_task_event_log 
    move partition sys_p12849 compress for oltp;
```
ده بيوفر مساحات هائلة في الهارد ديسك وفي نفس الوقت الداتا بتفضل مقروءة ومتاحة بالكامل للمراجعين!

### 2. حذف البارتشن المنتهي في أقل من 100 ميلي ثانية
لما البيانات التاريخية تخلص مدتها القانونية (مثلاً بعد مرور 7 سنين)، مش بتشغل أمر `DELETE` عملاق يولد جيجابايت من ملفات الـ Redo والـ Undo.

أنت بتطير البارتشن بالكامل في **أقل من 100 ميلي ثانية**:
```sql
alter table app_data.wf_task_event_log drop partition sys_p00481;
```

* * *

## 🤖 حزمة الصيانة التلقائية: `pkg_wf_maintenance`

دي Package صيانة احترافية ومجدولة تشتغل يوم 1 في كل شهر عبر `DBMS_SCHEDULER`:

```sql
create or replace package app_code.pkg_wf_maintenance as
    procedure archive_closed_tasks(p_days_old in number default 30);
end pkg_wf_maintenance;
/

create or replace package body app_code.pkg_wf_maintenance as

    procedure archive_closed_tasks(p_days_old in number default 30) is
        cursor c_expired_tasks is
            select task_id
              from apex_tasks
             where state in ('COMPLETED', 'CANCELED', 'TERMINATED')
               and completed_on < trunc(sysdate) - p_days_old;
               
        type t_id_list is table of apex_tasks.task_id%type;
        v_ids t_id_list;
        v_archived_cnt number := 0;
    begin
        open c_expired_tasks;
        loop
            fetch c_expired_tasks bulk collect into v_ids limit 500;
            exit when v_ids.count = 0;

            for i in 1 .. v_ids.count loop
                begin
                    -- استدعاء دالة الأرشفة الرسمية في APEX 26.1
                    apex_task.archive(
                        p_task_id      => v_ids(i),
                        p_archive_type => apex_task.c_archive_completed
                    );
                    v_archived_cnt := v_archived_cnt + 1;
                exception
                    when others then
                        null; -- تسجيل الخطأ والاستمرار في باقي المهام
                end;
            end loop;
            
            commit;
        end loop;
        close c_expired_tasks;

        dbms_output.put_line('تمت أرشفة ' || v_archived_cnt || ' مهمة بنجاح.');
    end archive_closed_tasks;

end pkg_wf_maintenance;
/
```

* * *

## 🏁 مسك الختام: الأعمدة السبعة لإدارة الـ Workflows الضخمة

على مدار السلسلة دي المكونة من 7 أجزاء، حولنا نظام موافقات تقيل ومخنوق لمنظومة مؤسسية صاروخية تنافس كبرى البنوك والشركات العالمية:

```plaintext
معمارية الـ APEX Workflows عالية الأداء:
┌────────────────────────────────────────────────────────────┐
│ 7. أرشفة دورة الحياة والتقسيم الشهري (APEX 26.1 + أوراكل) │  ← توسع مستدام للأبد
├────────────────────────────────────────────────────────────┤
│ 6. الاعتماد الجماعي بضغطة واحدة (Savepoints في الـ Grid)   │  ← سرعة قياسية للمدراء
├────────────────────────────────────────────────────────────┤
│ 5. شاشة الحرباء الذكية (أشرطة أدوات ديناميكية بـ PL/SQL)    │  ← صفحة تفاصيل واحدة
├────────────────────────────────────────────────────────────┤
│ 4. تخزين الأكشنز في الميتاداتا (جدول wf_action_config)     │  ← صفر زراير ثابتة
├────────────────────────────────────────────────────────────┤
│ 3. التزامن الفوري بالأحداث (تريجرات خفيفة بدون كرون)      │  ← لحظي بدون تأخير
├────────────────────────────────────────────────────────────┤
│ 2. كاش بونات المطبخ السريع (جدول wf_task_cache)            │  ← استعلامات تحت 50ms
├────────────────────────────────────────────────────────────┤
│ 1. فك الارتباط المعماري عن استعلامات APEX_TASKS الجاهزة    │  ← حل زحمة الـ 30k
└────────────────────────────────────────────────────────────┘
```

1. **كشفنا سر زحمة الـ 30 ألف مهمة**: وعرفنا ليه الاستعلام المباشر من `APEX_TASKS` بيخنق الداتابيز في الشركات.
2. **بنينا حامل بونات المطبخ**: جدول `wf_task_cache` اللي حول استعلامات الـ 15 ثانية لبحث فهارس في 20 ميلي ثانية.
3. **زامنّا الكاش في اللحظة نفسها**: بتريجرات خفيفة قضت على لاج الـ Polling بدون أي قفل للجداول.
4. **ودعنا رص الزراير الثابتة**: ونقلنا تعريفات الأكشنز لجدول ميتاداتا مرن وشيك (`wf_action_config`).
5. **صممنا شاشة الحرباء**: صفحة تفاصيل واحدة بتتلون وتتكيف مع صلاحيات كل موظف على الطاير.
6. **فعلنا الاعتماد الجماعي بضغطة واحدة**: مكنّا المدراء من اعتماد 50 طلب في ثانيتين بحماية الـ Savepoints.
7. **أتقنا الأرشفة المستدامة**: بدمج ميزات APEX 26.1 مع تقسيم الجداول الشهري عشان يفضل أداء النظام طيارة لسنين قدام!

مبروك عليك امتلاك المعمارية دي كاملة، وبرمجة ممتعة وناجحة للجميع! 🚀🎉✨

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
