---
category: apex-project-template
date: '2026-08-05'
description: الجزء الثاني من سلسلة "أبيكس تحت السيطرة". إزاي تمنع الـ AI Agent من
  إنه يفرمت جداول الـ Production لما يسوق فيها بحسن نية!
draft: false
featured: false
hashnode_draft_id: 6ad869726a8f4c4ef76f03f5
image: /arabic-blog/covers/002_lock-down-your-database-foolproof-sqlcl-connections-safety-guards.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/lock-down-your-database-foolproof-sqlcl-connections-safety-guards
series_part: 2
tags:
- oracle-apex
- sqlcl
- database
- security
- arabic
title: "اقفل على الداتابيز بالضبة والمفتاح: اتصالات SQLcl الآمنة وحراس الحماية \U0001F6E1️\U0001F510"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/lock-down-your-database-foolproof-sqlcl-connections-safety-guards).

# اقفل على الداتابيز بالضبة والمفتاح: اتصالات SQLcl الآمنة وحراس الحماية 🛡️🔐

*الجزء الثاني من سلسلة "أبيكس تحت السيطرة".*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> إنك تدي لـ AI Coding Agent كونكشن سترينج مباشر للداتابيز بصلاحيات Root أو DBA، ده بالظبط زي ما تدي طفل صغير في إيده منشار كهربائي شغال وتقوله "يلا قص لنا شجرة الجنينة"! ممكن يقص الشجرة فعلاً.. بس جنينتك وعفش بيتك مستحيل يرجعوا زي الأول!
> 
> في المقال ده، هنشوف إزاي [قالب مشروع APEX](https://github.com/ash2osh/APEX_PROJECT_TEMPLATE) بيستخدم **بروفايلات اتصالات SQLcl المسماة**، و**فحص وتأكيد هوية البيئة بعد الاتصال**، و**حارس أمان لا يرحم** عشان يخلي وقوع كوارث الداتابيز غير المقصودة أمر مستحيل هندسياً.

* * *

## 🏨 مبدأ كروت الفندق: 3 بروفايلات اتصال منفصلة

في العادة، كتير من المطورين لما بيكسلوا بيعملوا كونكت بيوزر واحد زي `SYS` أو `HR` واخد كل الصلاحيات، ويدخل بيه يخلص كل حاجة في الداتابيز بمفتاح دهبي واحد.

لو الوكيل الذكي دخل بنفس المفتاح ده واتلخبط بين تعريفات الجداول وسورس كود الـ Packages وميتاداتا تطبيق الـ APEX، ممكن في غمضة عين يشغل سكربت يمسح الدنيا في المكان الغلط.

عشان نمنع الكارثة دي، القالب بيقسم الدخول لـ **3 بروفايلات اتصال مستقلة**—عاملة بالظبط زي ما تديله 3 كروت غرف فندق بألوان مختلفة، وكل كارت مبيفتحش غير باب واحد بس:

```plaintext
 ┌─────────────────────────────────────────────────────────────┐
 │                    الـ 3 بروفايلات اتصال                    │
 ├───────────────────┬───────────────────┬─────────────────────┤
 │ 🟢 بروفايل TABLES │ 🟡 بروفايل CODE   │ 🟣 بروفايل APEX     │
 ├───────────────────┼───────────────────┼─────────────────────┤
 │ • أوامر الـ DDL   │ • الـ Packages    │ • تطبيقات APEX      │
 │ • الجداول والـ    │ • الـ Functions   │ • عناصر الصفحات     │
 │   Views           │ • الـ Triggers    │ • الملفات الثابتة   │
 │ • الـ Constraints │                   │                     │
 └───────────────────┴───────────────────┴─────────────────────┘
```

في بيئة التطوير المحلية تقدر تخليهم يشاوروا على نفس اليوزر، وفي بيئات الشركات بيشاوروا على Schemas منفصلة ومعزولة. لكن الأهم إن الـ Agent مجبر يطلب بالاسم الكارت المحدد للمهمة اللي رايح يعملها.

* * *

## 🤫 كاتم الأسرار: مفيش ولا باسورد جوه الـ Repository!

لو بصيت في ملف `.env.example` اللي جوه القالب، هتلاحظ حاجة هتبهرك: **مفيش خانة لباسورد واحدة في أي حتة!**

```dotenv
# إعدادات ملف الـ .env (ركز: مفيش باسووردات نهائي!)
TABLES_SQLCL_CONNECTION=dev_tables_alias
TABLES_EXPECTED_USER=APP_TABLES_OWNER

CODE_SQLCL_CONNECTION=dev_code_alias
CODE_EXPECTED_USER=APP_CODE_OWNER

APEX_SQLCL_CONNECTION=dev_apex_alias
APEX_EXPECTED_USER=APEX_PARSER
```

### ليه دي نقلة نوعية في الأمان؟

1.  **بيانات الدخول متخزنة جوه SQLcl**: أسرار الاتصال، ومحافظ الأمان (Wallets)، والباسووردات متسجلة بأمان تام في مخزن اتصالات SQLcl المحلي (اللي بنعمله بأمر `conn -save`).
2.  **المشروع مبيعرفش غير أسماء مستعارة (Aliases)**: ملف `.env` بيحتفظ بس باسم الـ Alias (زي `dev_tables_alias`).
3.  **مستحيل تتسرب بياناتك**: حتى لو الـ Agent طبع ملف `.env` بالكامل في الشات، أو عمله commit بالغلط، أو ظهر في لوجات الإيرور، باسووردات الداتابيز بتاعتك محمية 100%.

* * *

## 🕵️‍♂️ تأكيد الهوية بعد الاتصال: "طلع بطاقتك الأول!"

عمرك شغلت سكربت migration بالغلط على الداتابيز الغلط عشان نسيت أي تاب في الـ SQL Developer كانت متصلة بالـ Production؟ وكلاء الذكاء الاصطناعي يقدروا يعملوا نفس الغلطة دي بسرعة 100 ضعف!

عشان نقفل الحنفية دي، القالب بيشغل **فحص تأكيد فوري بعد كل عملية اتصال**:

```sql
-- scripts/verify_db_access.sql
SET SERVEROUTPUT ON
DECLARE
    v_actual_user VARCHAR2(128);
BEGIN
    SELECT USER INTO v_actual_user FROM DUAL;
    
    -- لو اليوزر الحقيقي مش هو اللي ملف الـ .env طلبه.. اضرب فرامل واقفل!
    IF v_actual_user != '&1' THEN
        RAISE_APPLICATION_ERROR(-20001, 
            'SAFETY HALT: Connected user [' || v_actual_user || 
            '] does not match expected user [' || '&1' || ']');
    END IF;
END;
/
```

لو الـ Alias بتاعك بالغلط شاور على `SYS` في الوقت اللي الـ `.env` طالب `APP_TABLES_OWNER`، السكربت بيرمي Exception فوراً ويفصل الكونكشن. **مفيهاش هزار ولا تخمين!**

* * *

## 🛑 حارس بيئة الـ Production — سكربت `check_db_target.sh`

طب إيه اللي بيحصل لما الـ Agent يحتاج يعمل deploy لأي تعديل؟ مينفعش يدخل يرمي كود SQL بمزاجه. لازم يعدي الأول من تحت إيد **حارس الأمان**:

```bash
scripts/check_db_target.sh write tables
```

```plaintext
                     [ الـ Agent بيطلب صلاحية كتابة WRITE ]
                                      │
                                      ▼
                    ┌───────────────────────────────────┐
                    │ هل DB_ENVIRONMENT == production؟ │
                    └─────────────────┬─────────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
                 نعم │                                 │ لا
                     ▼                                 ▼
          ┌─────────────────────┐           ┌─────────────────────┐
          │ 🚫 رفض قاطع وحاسم   │           │ التحقق من البروفايل │
          │ بيئة الـ Production │           │   والسماح بالتنفيذ   │
          │ مقفولة READ-ONLY!   │           └─────────────────────┘
          └─────────────────────┘
```

### القواعد الثلاثة الصارمة لحارس الأمان:

1.  **الـ Production للقراءة فقط (Read-Only By Design)**: لو المتغير `DB_ENVIRONMENT=production`، كل عمليات التعديل والكتابة (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`) بتترفض وتتقفل قبل ما SQLcl يفكر يفتح أصلاً.
2.  **تحديد الهدف بالاسم (Whitelisting)**: الـ Agent لازم يعلن صراحة هو رايح فين (`tables`، `code`، ولا `apex`). أمر مخصص للـ `tables` مستحيل يلمس Package Bodies جوه الـ `code`.
3.  **أمر يدوي من المطور البشري**: مفيش سطر كود في المشروع يقدر يشغل الحارس في وضع الكتابة تلقائياً. المطور هو صاحب القرار الأول والأخير.

* * *

## 💻 مثال حي: لما الحارس يقفش الـ Agent متلبس!

تعالوا نشوف إيه اللي بيحصل لما الوكيل الذكي يتحمس بزيادة ويحاول يعدل جدول في بيئة متسجلة إنها Production كالآتي:

```text
$ DB_ENVIRONMENT=production scripts/check_db_target.sh write tables

[SAFETY GUARD] ❌ Operation Denied!
===========================================================
Target Environment: PRODUCTION
Requested Action:   WRITE
Profile:            TABLES
===========================================================
ERROR: Direct write operations are strictly prohibited 
when DB_ENVIRONMENT is set to 'production'.

Production environments are READ-ONLY (SELECT only).
Please run migrations through your approved CI/CD pipeline.
```

السكربت بيخرج فورا بكود إيرور `1`، ولا حرف SQL واحد بيتبعت للسيرفر، وإجازة الويك إند بتاعتك بتفضل هادية ومفيهاش مكالمات طوارئ من الإدارة! 🎉

* * *

## 🚀 الخلاصة لمشروعات أوراكل أبيكس بتاعتك

1.  **استخدم الـ Named Aliases في SQLcl**: ابعد الباسووردات عن ملفات الـ `.env` وسيب SQLcl تدير مفاتيح الأمان.
2.  **افصل الصلاحيات (3 البروفايلات)**: بروفايل للجداول، بروفايل للبرمجة، وبروفايل لميتاداتا أبيكس.
3.  **اتأكد من الهوية بعد كل اتصال**: افحص `USER` قبل ما تكتب سطر DDL واحد.
4.  **اقفل الـ Production على وضع القراءة فقط**: الحماية على مستوى السكربت بتمنع السهو البشري والـ AI Blunders.

* * *

## 🔮 إيه اللي مستنينا في الجزء التالت؟

في **الجزء التالت**، هندخل في تفاصيل **Atomic Exports and Clean Mirrors**:
* ليه التصدير اللي بيهنج في النص بيبوظ تاريخ الـ Git بالكامل؟
* إزاي فولدر `scratch/` والتبديل الذري بيحافظ على نظافة سورس كود مشروعك؟
* وإزاي تحمي شغلك وتعديلاتك اللي لسه معملتلهاش Commit من إن سكربتات التصدير تطيرها في ثواني!

استنونا، وخلي دايماً وكلاء الذكاء الاصطناعي بتوعك مربوطين بلجام الأمان! 🐕✨

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
