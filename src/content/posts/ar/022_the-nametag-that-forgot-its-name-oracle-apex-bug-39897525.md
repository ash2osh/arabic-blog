---
category: oracle-apex-bugs
date: '2026-10-18'
description: لما شاشة الـ Popup LOV تنسى لغة المستخدم وتطلع له طلاسم &APP_TEXT$ على
  المكشوف بدل أسماء الأعمدة المعربة!
draft: false
featured: false
hashnode_draft_id: 6ad8699a271729564d1767e1
image: /arabic-blog/covers/022_the-nametag-that-forgot-its-name-oracle-apex-bug-39897525.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/the-nametag-that-forgot-its-name-squashing-oracle-apex-bug-39897525-with-a-clean-page-0-workaround
tags:
- oracle-apex
- javascript
- plsql
- web-development
- tips
- arabic
title: 'بادج المؤتمر اللي نسي اسمه: فرمتة باج أوراكل أبيكس 39897525 بحل عبقري في صفحة
  0 🏷️🎭'
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/the-nametag-that-forgot-its-name-squashing-oracle-apex-bug-39897525-with-a-clean-page-0-workaround).

# بادج المؤتمر اللي نسي اسمه: فرمتة باج أوراكل أبيكس 39897525 بحل عبقري في صفحة 0 🏷️🎭

*لما شاشة الـ Popup LOV تنسى لغة المستخدم وتطلع له طلاسم &APP_TEXT$ على المكشوف بدل أسماء الأعمدة المعربة!*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> تخيل رايح تسجل حضورك في مؤتمر تقني دولي كبير.. تبتسم لموظف الاستقبال، يديك بادج بلاستيك شيك جداً متعلق في شريطة معتبرة.
> 
> تبص في البادج ومستني تشوف اسمك مكتوب ببنط عريض وشيك، فتلاقي البادج مطبوع عليه بالحرف:  
> **`&{ATTENDEE_FIRST_NAME}.`** 🤦‍♂️
> 
> مكنة طباعة البادجات نسيت تدمج البيانات وطبعت اسم المتغير البرمجي في وشك!
> 
> ده بالظبط اللي بتعمله **باج أوراكل أبيكس الشهيرة رقم 39897525** في شاشات الـ Popup LOV متعددة الأعمدة! لما تستخدم نصوص الترجمة الرسمية (`&{MESSAGE}.` أو `&APP_TEXT$MESSAGE.`) عشان تعرب رؤوس الأعمدة، شاشة الـ Dialog في المتصفح بتفوت الترجمة، وترمي كود التوكن الخام في وش المستخدمين على المكشوف!
> 
> بدل ما تقعد مستني شهور لحد ما ينزل Patch رسمي أو تعدل في عشرات الصفحات يدوي، هنقضي على المشكلة دي النهاردة في **خطوتين اتنين في قمة الشياكة**:
> 1. تشغيل سكربت PL/SQL في 10 ثواني يفعل خيار `Used in JavaScript = Yes` لكل رسائل التطبيق.
> 2. حتة كود جافاسكريبت ذكي من 30 سطر يتحط في **صفحة 0 (Global Page)** يعترض رؤوس الأعمدة ويبدلها بالترجمة المظبوطة على الطاير.
> 
> وأول ما أوراكل تنزل الباتش الرسمي، هتدخل تمسح الكود من صفحة 0 وخلاص. **صفر ديون تقنية، وصفر تعديل على صفحات المشروع!** 🚀

* * *

## 🏷️ إحراج بادج المؤتمر (المشكلة عملياً)

بناء تطبيقات متعددة اللغات في Oracle APEX في العادة بيكون متعة وسلاسة. بتعرف نصوصك في **Shared Components > Text Messages**، وتديها مفاتيح واضحة زي `CUSTOMER_NAME` أو `ORDER_STATUS`، وتحط ترجمتها بالعربي والإنجليزي وتستخدمها في شاشاتك.

ولما تيجي تظبط شاشة **Popup LOV** فيها أعمدة كتير، طبيعي جداً إنك تحب تخلي رؤوس الأعمدة تتكلم بلغة المستخدم. فبتدخل في إعدادات العمود وتكتب كود التعويض القياسي في أبيكس:

```text
&{CUSTOMER_NAME}.
```
*(أو الصيغة الكلاسيكية `&APP_TEXT$CUSTOMER_NAME.`)*

في الـ Page Designer كلو بيبان سليم وزي الفل. لكن أول ما ترن التطبيق، وتدوس على عدسة البحث عشان تفتح الـ Popup LOV، تتصدم بالمنظر ده:

```text
+-------------------------+-------------------------+
| &{CUSTOMER_ID}.         | &{CUSTOMER_NAME}.       |  <-- 💥 يا نهار أبيض!
+-------------------------+-------------------------+
| 1001                    | شركة الأهرام للتجارة     |
| 1002                    | Stark Industries        |
+-------------------------+-------------------------+
```

بدل ما يظهر للمستخدم **"اسم العميل"**، شايف قدامه كود متغير برمجي داخلي! شكلها بيكون غير احترافي إطلاقاً، وبتلخبط المستخدمين، وبتخلي فريق الـ QA يفتح تذاكر أخطاء مستعجلة في ثواني!

أهلاً بيك في **Oracle APEX Bug 39897525**—المشكلة اللي شغالة نقاشات سخنة في [منتدى أوراكل الرسمي: عدم تطبيق نصوص الترجمة على عناوين الـ LOV](https://forums.oracle.com/ords/apexds/post/apex-26-1-4-translation-messages-not-applied-to-lov-titles-0486).

* * *

## 🕵️‍♂️ وراء الكواليس: ليه المتصفح بيفوّت الترجمة؟

عشان نفهم المشكلة حصلت ليه، لازم نبص في كواليس عمل الـ Popup LOVs في المتصفح.

في مناطق أبيكس العادية (زي التقارير الكلاسيكية وعناوين الحقول)، محرك أبيكس في السيرفر بيعوض كل متغيرات `&ITEM.` و `&APP_TEXT$...` بلغة الـ PL/SQL **قبل** ما يبعت صفحة الـ HTML للمتصفح. فالمتصفح بيستلم الكود وهو مترجم وجاهز أصلاً.

لكن شاشة الـ Popup LOV الحديثة في أبيكس عبارة عن مكون جافاسكريبت غير متزامن شغال في المتصفح بالكامل (`apex.widget.popupLov`).

أول ما بتدوس على العدسة:
1. أبيكس بتقرأ تعريفات الأعمدة من كائن في ذاكرة المتصفح (`options.columns`).
2. بتنشئ شاشة Grid مصغرة (`.a-PopupLOV-dialog`) جوه نافذة منبثقة (`.ui-dialog`).
3. بترسم رؤوس الأعمدة مباشرة من `options.columns.heading` باستخدام جافاسكريبت العميل.

ولأن الباج 39897525 بتفوّت تعويض السيرفر لعناوين أعمدة الـ LOV دي بالذات، النصوص الخام بتوصل للمتصفح زي ما هي. ولأن أبيكس مبيشغلش دالة `apex.lang.getMessage()` تلقائياً على العناوين دي قبل بناء الجدول، الرمز البرمجي بيطبع في وش المستخدم زي ما هو!

* * *

## ⚙️ الخطوة 1: السر الصغير — تفعيل الرسائل في الجافاسكريبت

أوراكل أبيكس فيها مكتبة ترجمة جاهزة في الجافاسكريبت:
```javascript
apex.lang.getMessage("CUSTOMER_NAME"); // بيرجع: "اسم العميل"
```

تقول: "بس خلاص! اتحلت! أنادي الدالة دي في الجافاسكريبت وخلاص!"

**على مهلك شوية!** ✋

عشان صفحات أبيكس تفضل خفيفة ومحملة ببيانات قليلة، السيرفر **مبيبعتش** كل رسائل الترجمة لذاكرة المتصفح افتراضياً. بيبعت بس الرسائل اللي متعلم عليها خيار **"Used in JavaScript"** (`IS_JS_MESSAGE = 'Y'`).

لو الخيار ده `No`، دالة `apex.lang.hasMessage("CUSTOMER_NAME")` هترجع `false`، ودالة `getMessage` هترجع نفس اسم المفتاح بدون أي ترجمة!

### الحل اليدوي المرهق ضد سكربت الـ 10 ثواني
لو تطبيقك فيه 300 رسالة ترجمة، إنك تدخل على واحدة واحدة في APEX Builder وتغير الخيار لـ Yes هيضيع لك نص اليوم.

بدل من كده، بنستخدم دالة `apex_lang.update_message` الرسمية ونحدث كل رسائل التطبيق في خطوة واحدة بس عبر سكربت (`update_app_text_messages_js.sql`) كالآتي:

```sql
-- =============================================================================
-- سكربت: update_app_text_messages_js.sql
-- الوصف: تفعيل خيار Used in JavaScript = Yes لكل نصوص ترجمة التطبيق
-- =============================================================================

SET SERVEROUTPUT ON
SET FEEDBACK OFF
SET VERIFY OFF

DECLARE
  -- 🎯 حط رقم التطبيق بتاعك هنا:
  c_app_id         CONSTANT NUMBER := 500; 
  l_workspace_id   NUMBER;
  l_workspace_name VARCHAR2(255);
  l_count          PLS_INTEGER := 0;
BEGIN
  -- 1. استخراج الـ Workspace المرتبطة بالتطبيق
  BEGIN
    SELECT a.workspace_id, a.workspace
      INTO l_workspace_id, l_workspace_name
      FROM apex_applications a
     WHERE a.application_id = c_app_id;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RAISE_APPLICATION_ERROR(-20001, 'التطبيق رقم ' || c_app_id || ' غير موجود.');
  END;

  -- 2. تثبيت سياق الأمان لتشغيل الـ APIs
  wwv_flow_imp.set_security_group_id(l_workspace_id);

  -- 3. المرور على كل الرسائل غير المفعلة وتحديثها
  FOR r IN (
    SELECT translation_entry_id,
           static_id,
           language_code,
           message_text
      FROM apex_application_translations
     WHERE application_id = c_app_id
       AND is_js_message = 'N'
     ORDER BY static_id, language_code
  ) LOOP
    apex_lang.update_message(
      p_id                 => r.translation_entry_id,
      p_name               => r.static_id,
      p_language           => r.language_code,
      p_message_text       => r.message_text,
      p_used_in_javascript => TRUE,
      p_metadata           => NULL,
      p_comment            => NULL
    );
    l_count := l_count + 1;
  END LOOP;

  COMMIT;

  DBMS_OUTPUT.PUT_LINE('------------------------------------------------------------');
  DBMS_OUTPUT.PUT_LINE('التطبيق: ' || c_app_id || ' (' || l_workspace_name || ')');
  DBMS_OUTPUT.PUT_LINE('عدد الرسائل المحدثة: ' || l_count);
  DBMS_OUTPUT.PUT_LINE('الحالة: كل رسائل الترجمة مفعلة وجاهزة للجافاسكريبت بنجاح.');
  DBMS_OUTPUT.PUT_LINE('------------------------------------------------------------');
END;
/

SET FEEDBACK ON
SET VERIFY ON
```

بمجرد تشغيل السكربت، كل رسائل الترجمة بقت محملة في المتصفح وجاهزة للاستخدام الفوري.

* * *

## 🪄 الخطوة 2: المعترض الذكي الشامل في صفحة 0 (Page 0 Interceptor)

دلوقتي المتصفح بقى معاه كل الترجمات، محتاجين بس حتة كود جافاسكريبت ذكية تعترض رؤوس أعمدة الـ Popup LOV وتستبدل الرموز بالترجمة الحقيقية.

وأجمل ما في الموضوع؟ **هنحط الكود ده في صفحة 0 (Global Page)**!

بوضع الكود في صفحة 0، هيشتغل تلقائياً على كل صفحات التطبيق بلا استثناء. مش محتاج تفتح صفحة 1 وصفحة 24 وصفحة 105 يدوي!

ده كود الحل الذكي الكامل:

```javascript
// =============================================================================
// حل باج أوراكل أبيكس 39897525:
// تعويض &{MESSAGE}. و &APP_TEXT$ تلقائياً في رؤوس أعمدة الـ Popup LOV
// =============================================================================
(function($) {
  function resolveLovHeaders(context) {
    $(context || document).find(".a-GV-headerLabel").each(function() {
      const text = $(this).text().trim();
      const match = text.match(/^&(?:\{([A-Za-z0-9_$]+)\}|(?:APP_TEXT\$)?([A-Za-z0-9_$]+))\.$/);
      if (match) {
        const key = match[1] || match[2];
        if (apex.lang.hasMessage(key)) {
          $(this).text(apex.lang.getMessage(key));
        }
      }
    });
  }

  // الخطاف 1: اعتراض فتح نافذة الـ Popup LOV (للحالات الديناميكية)
  $(document).on("dialogopen", ".ui-dialog", function(e) {
    const $dlg = $(e.target);
    if ($dlg.hasClass("a-PopupLOV-dialog") || $dlg.find(".a-PopupLOV-dialog").length) {
      setTimeout(() => resolveLovHeaders($dlg), 0);
      setTimeout(() => resolveLovHeaders($dlg), 100);
    }
  });

  // الخطاف 2: تعديل العناوين في الذاكرة قبل بناء جدول المكون
  if (apex.widget && apex.widget.popupLov) {
    const origPopupLov = apex.widget.popupLov;
    apex.widget.popupLov = function(options) {
      if (options && options.columns) {
        Object.values(options.columns).forEach(col => {
          if (col.heading) {
            const m = col.heading.match(/^&(?:\{([A-Za-z0-9_$]+)\}|(?:APP_TEXT\$)?([A-Za-z0-9_$]+))\.$/);
            if (m) {
              const key = m[1] || m[2];
              if (apex.lang.hasMessage(key)) {
                col.heading = apex.lang.getMessage(key);
              }
            }
          }
        });
      }
      return origPopupLov.apply(this, arguments);
    };
  }
})(apex.jQuery);
```

### إزاي السحر ده بيشتغل؟ 🔍

الكود بيعتمد على استراتيجية خطافين دفاعيين:

1. **الخطاف الاستباقي (Hook 2)**: قبل ما مكون الـ Popup LOV يبني الـ HTML بتاعه، بيعدل الـ `options.columns` في الذاكرة ويستبدل العناوين بالترجمة فوراً. ده بيمنع أي وميض (Flicker) في الشاشة!
2. **الخطاف التفاعلي (Hook 1)**: بيراقب حدث فتح الـ Dialog في المتصفح للتأكد بنسبة 100% إن أي عنصر اتأخر في التحميل تم تعويضه في الحال.

* * *

## 🚀 تطبيق الحل في 3 دقائق بس

1. **شغل سكربت الـ PL/SQL**: من خلال SQL Workshop أو SQLcl وفعل رسائل التطبيق لـ JavaScript.
2. **حط كود الجافاسكريبت في صفحة 0**: افتح **Page 0** في الـ Page Designer، وتحت قسم **JavaScript $\rightarrow$ Execute when Page Loads** الزق الكود ده واحفظ.
3. **جرب الشاشات**: افتح أي Popup LOV في مشروعك.. ومبروك! العناوين هتظهر معربة وشيك جداً! 🎉

* * *

## 🧹 خطة الخروج الآمنة (صفر ديون تقنية)

أكبر خوف من الحلول المؤقتة هو: *"طب لما أوراكل تنزل الباتش الرسمي، هنقعد نلف على الصفحات نمسح الشغل ده؟"*

الإجابة: **هتاخد منك 30 ثانية بس!**

لأننا ملمسناش ولا صفحة ولا غيرنا إعدادات الحقول، كل اللي هتعمله لما ينزل الباتش الرسمي:
1. طبّق الباتش في السيرفر.
2. ادخل على **صفحة 0** وامسح كود الجافاسكريبت.
3. وشكراً! التطبيق هيفضل شغال بنفس الطريقة الأصلية من غير أي تعديلات!

* * *

*كتبه:* [*أحمد شريف (Ahmed Sherif)*](https://www.linkedin.com/in/ahmed-d-sherif)*.*
