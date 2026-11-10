---
category: enterprise-workflows
date: '2026-10-22'
description: الجزء السادس من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس". معالجة
  50 إجراء وموافقة في نفس اللحظة بحماية الـ Savepoints لعزل الأخطاء!
draft: false
featured: true
hashnode_draft_id: 6ad869962939f2047a44d876
image: /arabic-blog/covers/020_the-rubber-stamp-1-click-batch-approvals-in-interactive-grids.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/the-rubber-stamp-1-click-batch-approvals-in-interactive-grids
series_part: 6
tags:
- oracle-apex
- interactive-grid
- batch-processing
- plsql
- arabic
title: "الختم السريع: الاعتماد الجماعي بضغطة واحدة جوه الـ Interactive Grid \U0001F4D1\U0001F58A️"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/the-rubber-stamp-1-click-batch-approvals-in-interactive-grids).

# الختم السريع: الاعتماد الجماعي بضغطة واحدة جوه الـ Interactive Grid 📑🖊️

*الجزء السادس من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> لو اديت مدير تنفيذي كبير قلم حبر جاف، وطلبت منه يقرا ويمضي 50 طلب شراء روتيني بسيط واحد ورا التاني، هيمضي أول أربعة، يجيله تليفون مهم، ويسيب الـ 46 التانيين مركونين في مكتبه لمدة أسبوعين!
> 
> بتزويد شاشة الـ Interactive Grid في Oracle APEX بروتين معالجة جماعي سريع (**`pkg_workflow_actions.ig_batch_action`**)، المدراء يقدروا يحددوا الـ 50 سطر بالـ Checkbox، ويدوسوا "اعتماد المحدد"، والـ 50 طلب يتنفذوا كلهم في ثانيتين اتنين بس!
> 
> هنا هنتعلم إزاي نبني محرك موافقات جماعية صلب ومحمي بـ **Savepoints على مستوى كل سطر**، وبـ **حماية القفل التفاؤلي (Optimistic Locking)** عشان لو سطر واحد فشل، ميبوظش باقي الدفعة كلها.

* * *

## 🖋️ قلم الحبر البطيء ضد ختم المصنع السريع

لما نيجي نصمم مسارات الموافقات في أبيكس، تفكيرنا التلقائي بيروح لشاشة تفاصيل الطلب المفردة. للقرارات الضخمة—زي شراء أصل رأسمالي بـ 250 ألف دولار—شاشة التفاصيل الكاملة إلزامية ومهمة جداً.

لكن في أي شركة كبيرة، 80% من حجم الشغل اليومي عبارة عن طلبات روتينية ومخاطرها شبه منعدمة:
* طلبات شراء أدوات مكتبية بسيطة تحت 100 دولار.
* اعتمادات صيانة دورية مجدولة.
* بدلات سفر وإقامة متراجعة ومرفق فواتيرها مسبقاً.

### قارن بين التجربتين:

*   **تجربة قلم الحبر (الاعتماد الفردي صفحة بصفحة)**:
    افتح الطلب $\rightarrow$ استنى ثانيتين $\rightarrow$ انزل لتحت $\rightarrow$ دوس موافق $\rightarrow$ أكد الرسالة $\rightarrow$ ارجع للشاشة الرئيسية $\rightarrow$ كرر نفس المأساة 50 مرة!  
    *الوقت المستغرق*: **من 12 لـ 15 دقيقة** من الضغطات المتكررة وتحميل الصفحات والإرهاق الذهني.
*   **تجربة ختم المصنع (الاعتماد الجماعي السريع)**:
    فلتر الـ Grid على "مشتريات دورية" $\rightarrow$ دوس "تحديد الكل" $\rightarrow$ دوس "اعتماد المحدد".  
    *الوقت المستغرق*: **أقل من 5 ثواني**!

* * *

## 🛑 معضلة "الحبة المسمومة" في المعالجة الجماعية (The Poison Pill)

قبل ما نبص على الكود، لازم نفهم الخطر الأكبر في العمليات الجماعية: **الحبة المسمومة**.

تخيل مدير علم على 50 طلب وداس "اعتماد الكل":
* الطلبات من 1 لـ 24 اعتمدت بسلام.
* الطلب رقم 25 ضرب إيرور لأن ميزانية القسم ده خلصت من 10 دقايق.
* في كود PL/SQL عادي مفهوش عزل للأخطاء، الإيرور غير المعالج على سطر 25 هيعمل Rollback لـ **المعاملة كلها بالكامل**! الـ 50 طلب هيفضلوا معلقين ومفيش حاجة هتعتمد!

المدير هيتجنن: *"هو إيه اللي اتوافق عليه وإيه اللي فشل؟! ليه مفيش حاجة اتغيرت؟!"*

عشان نحل المأساة دي، محركنا بيستخدم **نقاط الحفظ الفردية (Row-Level Savepoints)**:
```sql
savepoint sp_single_record;
```
لو السطر رقم 25 فشل، بنعمل تراجع **فقط لنقطة حفظ السطر ده لوحده**، ونسجل سبب الفشل في اللوج، ونكمل عادي جداً وبدون أي توقف في معالجة السطور من 26 لـ 50!

* * *

## ⚙️ محرك المعالجة الخلفي: `pkg_workflow_actions.ig_batch_action`

ده كود الـ Package الاحترافي في سكيما البرمجة (`app_code`) كالآتي:

```sql
create or replace package app_code.pkg_workflow_actions as
    procedure ig_batch_action(
        p_request_ids in apex_t_varchar2,
        p_action_type in varchar2, -- 'APPROVE', 'REJECT'
        p_comments    in varchar2 default null,
        o_success_cnt out number,
        o_failure_cnt out number,
        o_error_log   out apex_t_varchar2
    );
end pkg_workflow_actions;
/

create or replace package body app_code.pkg_workflow_actions as

    procedure ig_batch_action(
        p_request_ids in apex_t_varchar2,
        p_action_type in varchar2,
        p_comments    in varchar2 default null,
        o_success_cnt out number,
        o_failure_cnt out number,
        o_error_log   out apex_t_varchar2
    ) is
        v_req_id     number;
        v_curr_user  varchar2(100) := coalesce(sys_context('APEX$SESSION','APP_USER'), user);
    begin
        o_success_cnt := 0;
        o_failure_cnt := 0;
        o_error_log   := apex_t_varchar2();

        for i in 1 .. p_request_ids.count loop
            v_req_id := to_number(p_request_ids(i));

            -- 1. نقطة حفظ معزولة لكل سطر منفرد
            savepoint sp_single_record;

            begin
                -- 2. فحص القفل التفاؤلي والتزامن (Lock Row Nowait)
                declare
                    v_status varchar2(50);
                begin
                    select status
                      into v_status
                      from app_data.wf_requests
                     where request_id = v_req_id
                       for update of status nowait;

                    if v_status != 'PENDING' then
                        raise_application_error(-20010, 'الطلب لم يعد معلقاً للمراجعة.');
                    end if;
                end;

                -- 3. تنفيذ التعديل ونقل الحالة
                update app_data.wf_requests
                   set status      = case p_action_type when 'APPROVE' then 'APPROVED' else 'REJECTED' end,
                       resolved_by = v_curr_user,
                       resolved_at = current_timestamp
                 where request_id = v_req_id;

                -- 4. تسجيل الحدث في سجل التدقيق (بيشغل تزامن الكاش تلقائياً)
                insert into app_data.wf_task_event_log (
                    request_id,
                    action_type,
                    previous_status,
                    new_status,
                    action_user,
                    action_comments
                ) values (
                    v_req_id,
                    p_action_type,
                    'PENDING',
                    case p_action_type when 'APPROVE' then 'APPROVED' else 'REJECTED' end,
                    v_curr_user,
                    p_comments
                );

                o_success_cnt := o_success_cnt + 1;

            exception
                when others then
                    -- 5. تراجع فقط للسطر ده بالذات!
                    rollback to sp_single_record;
                    o_failure_cnt := o_failure_cnt + 1;
                    apex_string.push(o_error_log, 'طلب رقم #' || v_req_id || ': ' || sqlerrm);
            end;
        end loop;
    end ig_batch_action;

end pkg_workflow_actions;
/
```

* * *

## 🖥️ ربط الـ Interactive Grid في شاشة APEX

عشان تشغل ده جوه الـ Interactive Grid كالآتي:

### 1. تفعيل اختيار السطور المتعددة
في خصائص الـ Interactive Grid كالآتي:
* **Row Selection**: Multiple
* **Selection Checkbox**: Enabled

### 2. إضافة زرار Toolbar مخصص بكود الجافاسكريبت
في إعدادات الـ Grid: **Attributes $\rightarrow$ Advanced $\rightarrow$ JavaScript Initialization Code**:

```javascript
function(config) {
    let $ = apex.jQuery;
    let toolbarData = $.apex.interactiveGrid.copyDefaultToolbar();
    let actionsGroup = toolbarData.toolbarFind("actions1");

    actionsGroup.controls.push({
        type: "BUTTON",
        id: "btn_batch_approve",
        label: "اعتماد المحدد",
        icon: "fa fa-check",
        hot: true,
        action: "batch-approve"
    });

    config.toolbarData = toolbarData;

    config.initActions = function(actions) {
        actions.add({
            name: "batch-approve",
            action: function(event, focusElement) {
                let grid = apex.region("tasks_ig").widget().interactiveGrid("getViews").grid;
                let selectedRecords = grid.getSelectedRecords();
                
                if (selectedRecords.length === 0) {
                    apex.message.alert("برجاء اختيار طلب واحد على الأقل للاعتماد.");
                    return;
                }

                let model = grid.model;
                let requestIds = [];
                for (let i = 0; i < selectedRecords.length; i++) {
                    requestIds.push(model.getValue(selectedRecords[i], "REQUEST_ID"));
                }

                apex.message.confirm(
                    "هل أنت متأكد من اعتماد جميع الطلبات المحددة (" + requestIds.length + " طلب)؟",
                    function(okPressed) {
                        if (okPressed) {
                            apex.server.process(
                                "PROCESS_BATCH_APPROVAL",
                                {
                                    f01: requestIds,
                                    x01: "APPROVE"
                                },
                                {
                                    success: function(data) {
                                        apex.message.showPageSuccess(
                                            "تمت العملية: تم اعتماد " + data.success_count + " بنجاح، وفشل " + 
                                            data.failure_count + "."
                                        );
                                        apex.region("tasks_ig").refresh();
                                    }
                                }
                            );
                        }
                    }
                );
            }
        });
    };

    return config;
}
```

* * *

## 🔒 صمامين الأمان ضد التضارب والتزامن

لاحظ صمامي الأمان اللي جوه كود الـ PL/SQL هنا:

1. **`for update nowait`**: لو فيه مدير تاني (أو سكالر آلي) بيعدل في طلب رقم 14 في نفس اللحظة، أوراكل هترمي خطأ فوري بدل ما تعلق الجلسة في الانتظار. المعالج هيلقط الخطأ، ويكتب "الطلب 14 مشغول حالياً بعملية أخرى"، ويكمل في باقي الطلبات.
2. **التحقق من حالة الطلب الحالية**: قبل ما ينفذ الاعتماد، الكود بيتأكد إن `status = 'PENDING'`. لو حد اعتمده قبله بثانيتين، السطر بيتفوت بأمان وبدون أي تكرار.

* * *

## 🧹 إيه اللي مستنينا في مسك الختام (الجزء السابع)؟

نظام الـ Workflows بتاعك في أبيكس دلوقتي طيارة وصاروخي: الكويريز بتفتح في 20 ميلي ثانية، والشاشات بتتأقلم ديناميكياً، والمدراء يقدروا يوافقوا على 50 طلب في ضغطة واحدة.

قدم الشريط 18 شهر لقدام في المستقبل.. شركتك نفذت **أكتر من 2,500,000 مسار عمل منتهي**.

جداول الداتابيز بتكبر جداً، صيانة الفهارس بدأت تتقل، وتكاليف التخزين بتزيد. إزاي تنضف البيت من الكراكيب القديمة من غير ما تمسح سجلات التدقيق والرقابة القانونية للشركة؟

في ختام السلسلة، **الجزء السابع ("حملة تنظيف الربيع في APEX 26.1 — أرشفة المهام التاريخية بدون كسر التدقيق")**، هنتعلم أسرار الـ Archiving APIs الجديدة في APEX 26.1 واستراتيجيات تقسيم الجداول (Table Partitioning)!

نشوفكم في الحلقة الأخيرة الكبيرة! 🗄️🧹✨

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
