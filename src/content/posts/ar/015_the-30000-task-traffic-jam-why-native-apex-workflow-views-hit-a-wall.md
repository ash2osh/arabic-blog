---
category: enterprise-workflows
date: '2026-10-02'
description: الجزء الأول من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس". إيه
  اللي بيحصل في كواليس الداتابيز لما 500 مدير يفتحوا شاشة الموافقات في نفس اللحظة!
draft: false
featured: true
hashnode_draft_id: 6ad8698c1d7a01b5589bac7e
image: /arabic-blog/covers/015_the-30000-task-traffic-jam-why-native-apex-workflow-views-hit-a-wall.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/the-30-000-task-traffic-jam-why-native-apex-workflow-views-hit-a-wall
tags:
- oracle-apex
- workflows
- performance
- database
- human-tasks
- arabic
title: "زحمة الـ 30 ألف مهمة: ليه استعلامات APEX Workflow الجاهزة بتخبط في الحيطة؟
  \U0001F6A6\U0001F40C"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/the-30-000-task-traffic-jam-why-native-apex-workflow-views-hit-a-wall).

# زحمة الـ 30 ألف مهمة: ليه استعلامات APEX Workflow الجاهزة بتخبط في الحيطة؟ 🚦🐌

*الجزء الأول من سلسلة "إدارة الـ Workflows الضخمة في أوراكل أبيكس".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> لما تكون شركتك بتمشي كام طلب إداري بسيط في اليوم، محرك الـ Workflows والـ Human Tasks في Oracle APEX بيشتغل زي الفراشة وبمنتهى الخفة والجمال. لكن أول ما 500 مدير إدارة يدخلوا مع بعض صباح يوم الإثنين عشان يراجعوا طابور متراكم فيه 30,000 مهمة وموافقة مستنية، الـ CPU بتاع الداتابيز بينط فجأة لـ 100%، وشاشة المهام بتاخد من 15 لـ 30 ثانية عشان تفتح!
> 
> والسبب مش ضعف إمكانيات السيرفر ولا بطء شبكة الإنترنت. السبب الحقيقي هو "التكلفة المعمارية الباهظة" لكيفية معالجة الـ Views الرسمية الجاهزة (`APEX_TASKS` و `APEX_TASK_PARTICIPANTS`) لحسابات صلاحيات الأمان، وشجرة أدوار الموظفين، وفك تشفير معطيات الـ JSON لكل سطر في اللحظة نفسها (On the Fly).
> 
> في الدليل ده، هنشرح بالتفصيل ليه الـ Views الجاهزة دي بتخبط في حيطة سد في الشركات الضخمة—وإزاي فصل عرض الشاشات (UI Rendering) عن محرك الـ Workflow بيحل الأزمة دي للأبد.

* * *

## 🏨 دفتر نزلاء الفندق: تشبيه في غاية البساطة

عشان نتخيل اللي بيحصل جوه خوادم الداتابيز، تعالوا نقارن بين فندقين مختلفين تماماً:

### 1. بنسيون العجمي الصغير (حجم بيئات التطوير المحلية)
* أنت صاحب بنسيون ريفي جميل فيه 6 أوض بس. لما يوصل نزيل جديد، موظف الاستقبال بيبص في كشكول ورقي من صفحة واحدة محطوط على المكتب.
* الموظف بيلاقي اسم النزيل في ثانيتين، يديله مفتاح أوضة 3 ويبتسم في وشه. الوقت الإجمالي: **3 ثواني بس**.
* ده بالظبط حالك في بيئة التجارب والـ Staging — عندك 50 مهمة و 3 يوزرات بتجرب بيهم، ومفيش أي بطء ملحوظ على الإطلاق.

### 2. منتجع لاس فيجاس العملاق ليلة رأس السنة (حجم المؤسسات الضخمة)
* تخيل بقى منتجع وكازينو ضخم فيه 5,000 جناح فندقي فاخر في ليلة رأس السنة، ومئات النزلاء بيوصلوا في كل دقيقة!
* تخيل لو موظف الاستقبال معندوش كمبيوتر ولا قاعدة بيانات، وبدل كدة مضطر يقلب في مجلد يدوي من 3,000 صفحة لكل نزيل لوحده! ومع كل اسم، لازم يقوم يفتح دولاب أرشيف في أوضة تانية يتأكد النزيل ده واخد كارت VIP ولا لأ، ويكلم قسم الحسابات بالتليفون يفحص الحد الائتماني، ويكلم أمن الفندق يراجع أختام الباسبور!
* طابور النزلاء هيمتد لبرة الفندق ويسد الشارع، الموظفين هينهاروا من التعب، والنزلاء هيتخانقوا واللوبي كله هيقف تماماً!

ده بالظبط اللي بيحصل لما شاشة المهام في نظام APEX بتاعك تقرر تستعلم من `APEX_TASKS` مباشرة على داتابيز حية فيها عشرات الآلاف من المهام!

* * *

## 🔬 تشريح `APEX_TASKS`: إيه اللي بيحصل وراء الكواليس؟

من أول إصدارات Oracle APEX الحديثة في 26.1 و 26.2، وفرت أوراكل محرك Workflows و Human Tasks استثنائي لإدارة مسارات الموافقات، والـ Escalations، والتفريعات المعقدة.

وعشان تعرض المهام دي للمطورين، وفرت أبيكس Views جاهزة:
* `APEX_TASKS`: بتمثل المهام النشطة والمحجوزة والمنتهية.
* `APEX_TASK_PARTICIPANTS`: لستة اليوزرات والمجموعات المرشحة للموافقة.
* `APEX_WORKFLOWS`: لتتبع مسارات الـ Workflows بالكامل.

الـ Views دي اتصممت عشان تكون مرنة مع أي سيناريو في العالم. لكن المرونة المطلقة دي بتيجي على حساب تكلفة معالجة مرعبة! لما تستعلم من `APEX_TASKS`، الداتابيز مش مجرد بتقرأ جدول عادي، هي مجبرة تحسب 3 طبقات تقيلة جداً ديناميكياً:

### الطبقة 1: فحص الصلاحيات والأطراف المشاركة (Dynamic Participant Resolution)
مين مسموح له يعتمد أو يستلم المهمة دي حالياً؟
* هل هي متخصصة مباشرة لليوزر المتصل `:APP_USER`؟
* ولا اليوزر بينتمي لجروب موافقات (زي `FINANCE_CONTROLLERS`)؟
* ولا المدير الأساسي فوض صلاحياته لمساعده في الفترة الزمنية دي؟
* وهل الهيكل الإداري بيسمح للمدير الأكبر إنه يتدخل؟

تقييم المنطق ده بيتطلب Subqueries متداخلة، و Join مع جداول الأمان الداخلية (`WWV_FLOW_TASK_PARTICIPANTS$`)، وفحص ديناميكي لعضويات الجروبات **لكل سطر من سطور المهام المرشحة**!

### الطبقة 2: فك تشفير محتوى المعطيات (Context Payload Extraction)
المهام غالباً بتخزن بيانات البيزنس (زي إجمالي أمر الشراء، واسم الموظف، وبنود الفاتورة) جوه حقول JSON أو XML داخلية. فك تشفير الـ JSON المعقد ده لبيانات علائقية على آلاف السطور بيحرق الـ CPU حرق!

### الطبقة 3: التحقق من ماكينة الحالات (State Machine Validation)
المحرك بيفحص باستمرار هل المهمة دي انتهت مهلتها (Timeouts) أو معادها عدا، وبيعيد حساب الأولويات والحالات على الطاير.

* * *

## 🐌 الاستعلام اللي بيولع في سيرفرات الـ Production

في مشروعات المؤسسات والشركات الكبيرة، مفيش حاجة اسمها شاشة مهام بكويري بسيط من 5 سطور زي بتاعة كتب التدريب.

في الحقيقة، بناء الـ Interactive Grid الشامل ده مكنش مجرد رفاهية من المطورين أو خيار تجميلي—**ده كان متطلب إجباري وقاطع من الإدارة العليا ورؤساء القطاعات!** القيادات ومدراء العموم رفضوا رفضاً باتاً إنهم يقعدوا يتنقلوا بين 5 شاشات مختلفة أو يكتفوا ببطاقات مهام عامة ومختصرة عشان يراجعوا طلب واحد. كان المطلب الحاسم هو وجود "لوحة قيادة مركزية ومكتظة بالبيانات (High-Density Operational Cockpit)" تفتح للمدير الصورة كاملة من شاشة واحدة:
- بيانات مقدم الطلب بالكامل وإدارته،
- حالة الـ Workflow والمدراء اللي لسه معتمدوش،
- تفاصيل البيزنس المعقدة المتخزنة جوه باراميترات الـ Workflow،
- زراير لفتح شاشات منبثقة (Modals) للكومنتات والمرفقات،
- أيقونات ملونة بتحدد هل مسموح للمدير ده يلغي أو يمسح الطلب ده ولا لأ،
- إمكانية البحث الجماعي الضخم (زي إنه ينسخ 50 رقم قومي أو كود موظف من الإكسيل ويلزقهم في شاشة البحث مرة واحدة!).

ولأن الـ Human Tasks الرسمية في أبيكس مبتحطش بيانات البيزنس دي في أعمدة صريحة وجاهزة، المطورين اتزنقوا واضطروا يربطوا كل الخيوط دي ببعضها جوه نفس استعلام الـ Grid على الطاير!

بصوا على الكود الواقعي اللي الفرق بتبنيه في بيئات العمل الحقيقية لتنفيذ متطلبات الإدارة—قبل ما يكتشفوا إنهم بالغلط ولعوا في الداتابيز:

```sql
-- ==============================================================================
-- نمط استعلام "كل شيء في شاشة واحدة" الشهير
-- تحذير: إياك تشغل ده على 30,000 مهمة حقيقية في الـ Production!
-- ==============================================================================
with emp_data as (
    -- 1. البحث في بيانات الموظفين
    select e.emp_id,
           e.emp_number,
           nvl(e.emp_name_ar, e.emp_name_en) as emp_name,
           e.emp_status,
           e.category_type,
           e.national_id,
           e.employment_start_date,
           app_code.emp_pkg.get_department_name(e.emp_id) as department_name
      from app_data.employees e
),
task_payload_data as (
    -- 2. استخراج وفك بيانات الـ JSON لباراميترات المهام لكل سطر
    select tl.task_id as tsk_id,
           tl.workflow_id,
           json_value(tl.task_parameters_data, '$[*]?(@.param_static_id=="REQ_ID").param_value' returning varchar2(4000)) as req_id,
           json_value(tl.task_parameters_data, '$[*]?(@.param_static_id=="EMP_NO").param_value' returning varchar2(4000)) as emp_no,
           json_value(tl.task_parameters_data, '$[*]?(@.param_static_id=="MASTER_PK_ID").param_value' returning varchar2(4000)) as master_pk_id,
           al.main_action_id,
           decode(tl.state_code, 'COMPLETED', null, sl.pending_approvers) as pending_approvers,
           ra.action_id as action_id_raw,
           nvl(app_code.wf_pkg.get_action_desc(ra.action_id), ra.action_id) as action_desc,
           ra.status,
           ra.sub_status
      from app_data.wf_task_log tl
      left join app_data.wf_action_log al 
        on al.wf_id = tl.workflow_id
      join apex_task_parameters atp 
        on atp.task_id = tl.task_id 
       and atp.param_static_id = 'P_ACTION_ID'
      left join app_data.wf_action_sub_log sl 
        on tl.task_id = sl.task_id 
       and al.current_sub_id = sl.sub_id
      left join app_data.request_actions ra 
        on ra.action_id = al.main_action_id
     where :P100_ACTION_ID = atp.param_value
)
-------------------------- الاستعلام الرئيسي للـ INTERACTIVE GRID --------------------------
select e.*,
       tasks.*,
       td.*,
       -- 3. نداءات دوال PL/SQL سكلر لكل سطر عشان لينكات الكومنتات والمرفقات
       decode(td.main_action_id, null, '#', 
              app_code.doc_pkg.get_comments_url(
                  p_doc_type    => 'REQUEST_ACTION',
                  p_doc_id      => td.main_action_id,
                  p_emp_id      => e.emp_id,
                  p_action_id   => td.main_action_id,
                  p_from_page   => 4,
                  p_app_session => :APP_SESSION
              )) as comment_url,
       decode(td.main_action_id, null, '#', 
              app_code.doc_pkg.get_attach_url(
                  p_doc_type    => 'REQUEST_ACTION',
                  p_doc_id      => td.main_action_id,
                  p_app_session => :APP_SESSION,
                  p_emp_id      => e.emp_id,
                  p_from_page   => 312
              )) as attach_url,
       case 
         when app_security.auth_pkg.user_can_follow_action(:APP_USER, :P100_ACTION_ID) = 'YES' 
         then '<span class="fa fa-times-circle u-danger-text" aria-hidden="true"></span>'
         else '' 
       end as delete_icon
  from (
       -- 4. استدعاء دالة المهام الرسمية Pipelined Table Function
       select t1.*, 'a' as join_dummy
         from table(apex_approval.get_tasks(
                      p_context            => 'MY_TASKS',
                      p_show_expired_tasks => 'Y'
                    )) t1
       ) tasks
  left join task_payload_data td 
    on td.tsk_id = tasks.task_id
  -- 5. الربط مع جداول الموظفين بتعبيرات Regex الشرطية
  left join emp_data e 
    on e.emp_number = case 
                        when regexp_like(td.emp_no, '^[0-9]+$') then td.emp_no
                        else null
                      end
 where (:P100_TASK_DEF_STATIC_ID = tasks.task_def_static_id)
   and nvl(:P100_REQ_ID, '-') = nvl(td.req_id, '-')
   -- 6. الفحص متعدد المستويات لصلاحيات الفئات
   and (
         e.category_type is null
         or (
              e.category_type = nvl(:SESSION_CATEGORY, 'ALL')
              or (
                   nvl(:SESSION_CATEGORY, 'ALL') = 'ALL'
                   and e.category_type in (
                       select category_type
                         from app_security.user_permitted_categories
                        where user_name = :APP_USER
                          and category_type <> 'ALL'
                   )
              )
         )
       )
   -- 7. البحث الجماعي بلستة أرقام موظفين ملزوقة في الشاشة
   and (
         :P100_SEARCH_VALUES is null
         or (
              :P100_SEARCH_TYPE = 'EMP_NUMBERS'
              and e.emp_number in (
                  select column_value as id_num
                    from the (
                        select cast(app_code.string_utils_pkg.split_ids(
                                      rtrim(replace(replace(:P100_SEARCH_VALUES, chr(13), ''), chr(10), ','), ',')
                                    ) as app_code.id_table_t)
                          from dual
                    )
              )
         )
         or (
              :P100_SEARCH_TYPE = 'NATIONAL_ID'
              and e.national_id in (
                  select column_value as id_num
                    from the (
                        select cast(app_code.string_utils_pkg.split_ids(
                                      rtrim(replace(replace(:P100_SEARCH_VALUES, chr(13), ''), chr(10), ','), ',')
                                    ) as app_code.id_table_t)
                          from dual
                    )
              )
         )
       );
```

### ليه الاستعلام ده بينهار تماماً عند 30 ألف مهمة؟

لما تجربه في بيئة التجارب بـ 20 مهمة، بيخلص في 120 ميلي ثانية وتفرح بيه! لكن أول ما يروح للـ Production مع 30,000 مهمة ومئات المدراء المتزامنين، ست اختناقات معمارية بيتجمعوا مع بعض عشان يسببوا كارثة أداء حتمية:

1. **الصندوق الأسود لدوال الـ Pipelined Table (`TABLE(apex_approval.get_tasks(...))`):**
   محرك تحسين الاستعلامات (CBO) مبيقدرش يشوف اللي جوه دوال الـ Pipelined في PL/SQL. مبيقدرش يحسب إحصائيات الداتا ولا توزيعها، فبيفترض أرقام افتراضية عشوائية. والأخطر من كده، شروط الـ `WHERE` الخارجية مستحيل تنزل جوه استعلام المحرك الداخلي (No Predicate Pushdown)!
2. **فك الـ JSON على الطاير لكل سطر (`JSON_VALUE`):**
   لأن باراميترات المهام (`REQ_ID`, `EMP_NO`, `MASTER_PK_ID`) متسلسلة جوه نصوص JSON، الكويري مضطر يحلل نصوص JSON لآلاف السطور في كل فتحة شاشة. بنتكلم في أكتر من 90,000 عملية فك JSON مع كل ريفريش!
3. **الربط مع الجداول بتعبيرات الـ Regex (`REGEXP_LIKE`):**
   لأن بيانات الـ JSON المستخرجة مجرد نصوص غير مفحوصة، الربط مع جدول `employees` بيتطلب فحوصات Regex وتحويل أنواع. ده بيلغي تماماً استخدام فهارس الـ B-Tree العادية، ويجبر الداتابيز تعمل Full Table Scans مدمرة!
4. **التبديل بين المحركات سطر بسطر (Scalar PL/SQL Context-Switching):**
   استدعاء دوال الـ PL/SQL في جملة الـ `SELECT` بيسبب آلاف التبديلات المتكررة (Context Switches) بين محرك الـ SQL ومحرك الـ PL/SQL.
5. **الضربة القاضية: فخ التقسيم والترتيب في الـ Interactive Grid:**
   في أبيكس، شاشات الـ Interactive Grid بتغلف أي استعلام بمنطق ترقيم الصفحات (`Pagination`). أول ما مدير يدوس على رأس أي عمود عشان يرتب المهام (مثلاً بتاريخ الإنشاء أو اسم الموظف)، الداتابيز **متقدرش** تستخدم اختصارات الـ Pagination. لازم تشغل كل دوال الـ Table functions، وتفك كل نصوص الـ JSON، وتعمل كل الـ Joins، وتنفذ دوال الـ PL/SQL، وترتب الـ 30,000 سطر كلهم في الـ `TEMP` Tablespace—وبعدين ترمي 29,950 سطر في الزبالة عشان تعرض للمدير أول 50 بس!

* * *

## 🎯 أعراض زحمة الـ 30 ألف مهمة

لو بيئة عملك بتعاني من المشكلة دي، هتلاحظ العلامات الحمراء دي فوراً:

| العَرَض | اللي بتشوفه بعينك | السبب الجوهري الحقيقي |
|---|---|---|
| **شاشات مهام تقيلة ومهنجة** | صفحة المهام بتفضل تلف من 12 لـ 25 ثانية قبل ما تفتح. | حسابات الأمان الديناميكية لكل سطر من آلاف المهام غير المفهرسة. |
| **ارتفاع جنوني في الـ CPU** | الـ CPU بتاع سيرفر الداتابيز بيوصل 95–100% صباح الإثنين. | مئات المدراء بيشغلوا استعلامات متزامنة بتعمل Joins معقدة مع جداول أبيكس الداخلية. |
| **هنجة وتجميد عند البحث والترتيب** | الفلترة برقم الموظف أو الترتيب بالتاريخ بيطلع Gateway Timeout. | عجز محرك التحسين عن دفع شروط البحث داخل دوال الـ Table. |
| **تطفيش المستخدمين** | المدراء بيبطلوا يفتحوا شاشة أبيكس ويطالبوا بموافقات يدوي بالإيميل! | بطء وتجربة استخدام مستحيلة في الواجهة. |

* * *

## 💡 الحل المعماري: فصل العرض عن ماكينة الحالات (Decoupling)

هل ده معناه إن محرك الـ Workflows في Oracle APEX فيه عيب؟ **أبداً على الإطلاق!**

محرك أبيكس للـ Workflows عبقري وممتاز جداً في الحاجة اللي اتصمم عشانها: **إدارة دورة حياة الحالات، وفرض شروط الموافقات، وحساب مدد الانتهاء والـ Escalations، وتشغيل الخطوات الآلية**.

الغلطة كلها كانت في إننا طلبنا من المحرك ده إنه يشتغل كمان كمحرك بحث سريع وفوري لشاشات العرض والـ Grids!

الحل الهندسي المعتمد عالمياً هو **الفصل المعماري (Architectural Decoupling)**:
* خلي **محرك APEX Workflows** يدير العمليات، وتنقل الحالات، وشروط البيزنس في الخلفية.
* أنشئ **جدول كاش عمليات خفيف ومفهرس بالمللي** (`wf_task_cache`) معمول مخصوص عشان يغذي شاشات الـ UI في أقل من 50 ميلي ثانية!

```mermaid
flowchart LR
    Engine["محرك Oracle APEX Workflow<br/>(إدارة الحالات والخطوات والشروط)"] 
    -->|Trigger معتمد على الأحداث| 
    Cache["جدول كاش العمليات السريع<br/>(wf_task_cache)<br/>مفهرس وجاهز للعرض"]
    Cache 
    -->|استعلام فهارس في أقل من 50ms| 
    Cockpit["شاشة مهام أبيكس التفاعلية<br/>(Interactive Grid / Report)"]
```

* * *

## 🚀 إيه اللي مستنينا في الجزء الثاني؟

إزاي نصمم جدول كاش العمليات ده عشان يستوعب ملايين المهام بكل سلاسة ويخلي استعلامات شاشات أبيكس تفتح في غمضة عين وبأقل من 50 ميلي ثانية؟

في **الجزء الثاني ("حامل بونات المطبخ: تصميم كاش العمليات عالي السرعة")**، هنبني هيكل جدول `wf_task_cache` بالكامل، وهندرس استراتيجية الفهارس الذكية، وهنشوف إزاي نكتب استعلامات شاشات بتفتح في فمتو ثانية!

استنونا في الجزء الثاني! 🎫⚡

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*