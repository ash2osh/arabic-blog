---
category: apex-devops
date: '2026-09-28'
description: 'لما كابتن الدليفري يوصل بعربيتك عند عمارة السيرفر، يهرش في شعره ويقولك:
  "هو أنا هسلم App 101 لـ أنهي شقة بالظبط؟!"'
draft: false
featured: true
hashnode_draft_id: 6ad8698b271729564d1767bd
image: /arabic-blog/covers/014_the-missing-apartment-number-why-your-apex-deployments-need-an-explicit-workspace.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/the-missing-apartment-number-why-your-apex-deployments-need-an-explicit-workspace
tags:
- oracle-apex
- database
- devops
- arabic
- sqlcl
title: "رقم الشقة الناقص: ليه لازم تحدد الـ Workspace صراحةً في الـ APEX Deployments؟
  \U0001F3E2\U0001F4E6"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/the-missing-apartment-number-why-your-apex-deployments-need-an-explicit-workspace).

# رقم الشقة الناقص: ليه لازم تحدد الـ Workspace صراحةً في الـ APEX Deployments؟ 🏢📦

*لما كابتن الدليفري يوصل بعربيتك عند عمارة السيرفر، يهرش في شعره ويقولك: "هو أنا هسلم App 101 لـ أنهي شقة بالظبط؟!"*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> تخيل طلبت ركنة أو صالون جديد أونلاين، وكتبت في العنوان: *"برج الصفوة، الدور الخامس، شقة 502"*.
> 
> للوهلة الأولى العنوان يبدو كامل ومفهوم.. لحد ما كابتن الدليفري يوصل الموقع ويكتشف إن الكومباوند فيه **3 أبراج توأم** بنفس الاسم والتصميم، وكل برج فيهم فيه دور خامس وشقة 502! وطبعاً مفيش رقم أو حرف للبرج على البوليصة. الكابتن هيرفع إيده، مستحيل يجازف ويخمن، وهيختم الشحنة فوراً: **"تعذر التسليم: العنوان غير محدد بدقة"**.
> 
> في عالم Oracle APEX والـ split-source deployments، أداة SQLcl بتعمل معاك نفس الموقف بالظبط لما تسيب الـ Target Workspace عايم من غير تحديد. ورغم إنك ممكن تتغر وتجري ورا حلول سريعة بـ PL/SQL (واللي ممكن تشتغل على جهازك الشخصي بس تفرقع وش في السيرفرات الحقيقية!)، الحل الجذري والاحترافي أبسط بكتير: اعمل ملفات إعدادات منفصلة لكل بيئة عمل (`dev.json`, `staging.json`, `prod.json`) محدد فيها اسم الـ Workspace صراحةً، وارفعها على Git مباشرة.

* * *

## 🚚 ورطة كابتن الدليفري (The Delivery Driver Dilemma)

في شغل Oracle APEX الحديث، كلنا بنحب نعمل export للتطبيقات بصيغة الـ Source Code المقسم (`.apx` files) عن طريق SQLcl أو إضافة VS Code الرسمية. الطريقة دي بتخلي الـ Git diffs نظيفة وسهلة، وتتبع التعديلات طبيعي، وبتخلي أتمتة الـ CI/CD متعة حقيقية.

أول ما بتعمل export للتطبيق، SQLcl بتنشئ لك ملف إعدادات deployment افتراضي داخل مشروعك اسمه `deployments/default.json`. في أغلب الأوقات بيكون شكله بسيط جداً زي كده:

```json
{
  "app" : {
    "id" : 101,
    "databaseSession" : {
      "parsingSchema" : "APP_SCHEMA"
    }
  }
}
```

تبص للملف تقول: "عظمة أوي! إيه المشكلة يعني؟ ما أنا مديله كل حاجة:"
1. **Application ID**: `101`
2. **Parsing Schema**: `APP_SCHEMA`

وعلى داتابيز التطوير المحلية (Local Sandbox) اللي مفيهاش غير Workspace واحدة يتيمة، كل حاجة بتشتغل زي الفل والـ deployment بيمر بنجاح باهر.

لكن الصدمة بتبدأ أول ما تترقى وتتصل بداتابيز الـ Development المشتركة للشركة أو سيرفر الـ Staging، وتيجي تنفذ أمر الاستيراد `apex import`، وفجأة... **بوووووم!** 💥

```text
[APEXLangCommandHandlers] [ERROR] 
Multiple workspaces available, use the workspaceId or the workspace option.
```

الـ CI/CD Pipeline يقف فجأة، و"بوت الدليفري" يرفض إنه يرمي الكود في أي مكان بالبركة!

* * *

## 🕵️‍♂️ وراء الكواليس: ليه SQLcl رفعت إيديها ووقفت؟

ليه SQLcl ضربت إيرور ومكملتش تثبيت التطبيق؟

لما SQLcl بتيجي تستورد تطبيق APEX من ملفات مجزأة (Split files)، بتحتاج في أول خطوة تثبت حاجة اسمها **APEX Workspace Context** (معرف الأمان الداخلي للـ Workspace أو الـ Security Group ID)، وده بيحصل قبل ما تنشئ أو تعدل أي صفحة من صفحات التطبيق.

لو ملف الـ `deployments/default.json` مش محدد فيه اسم الـ Workspace بشكل صريح، SQLcl بتحاول تعمل فيها ذكية وتكتشفه تلقائياً. في الخلفية، بتروح تنفذ استعلام بسيط على جداول الداتابيز:

```sql
SELECT workspace FROM apex_workspaces;
```

في أي داتابيز حقيقية لشركة أو مؤسسة، مستحيل يوزر المطورين يكون مربوط بـ Workspace واحدة بس. غالباً الاستعلام هيرجع لستة محترمة:
* `DEV_WORKSPACE`
* `FINANCE_WORKSPACE`
* `HR_WORKSPACE`
* `INTERNAL`

لما الـ query يرجع **أكتر من سطر**، SQLcl بترفض التخمين تماماً. لأنها لو خمّنت ونزلت التطبيق في الـ Workspace الغلط، ممكن تمسح شغل زميلك أو تكسر صلاحيات أمان حساسة.

عشان كده بتقفلها في وشك بأمان تام وتقولك:
`Multiple workspaces available, use the workspaceId or the workspace option.`

* * *

## ⚠️ الفخ المغري: حل الـ PL/SQL السريع (بيشتغل عندك ويفرقع في السيرفر!)

كتير من المطورين لما بيقابلوا الإيرور ده، أول فكرة بتيجي في بالهم هي "الترقيع" السريع عن طريق تشغيل كود PL/SQL قبل عملية الاستيراد (Import) كالآتي:

```sql
BEGIN
  -- "يا عم أنا هثبت له الـ Workspace ID بإيدي وخلاص!"
  APEX_UTIL.SET_SECURITY_GROUP_ID(1234567890123456);
END;
/
```

### هل الحل ده بيشتغل؟ أيوه.. بس في بيئات معينة جداً!

لو جربت الترقيعة دي على جهازك جوه Docker Container محلي، أو داتابيز تجارب داخل فيها بيوزر الـ DBA الخارق (`ADMIN` أو `SYS`)، هتحس إنك عبقري والمشكلة اتحلت في ثواني.

بس تعالى نفهم ليه هو اشتغل في بيئتك المحلية:
1. **صلاحيات السوبر مان**: الحساب اللي أنت داخل بيه واخد صلاحية **`APEX_ADMINISTRATOR_ROLE`**، ودي بتديه الحق إنه يغير ويدخل أي Workspace على مزاجه.
2. **الربط المباشر موجود**: يوزر السيشن بتاع الداتابيز (`USERENV('SESSION_USER')`) متعرف ومربوط مسبقاً كـ schema مسموح بيها في جدول `APEX_WORKSPACE_SCHEMAS` لنفس الـ Workspace.

### وليه نفس الحل ده بيفرقع في وشك فوراً في بيئات الـ CI/CD المشتركة 💥

أول ما الكود ده يخرج من جهازك ويروح لداتابيز تانية، أو سيرفر Staging مقفول بصلاحيات محدودة، أو أوتوميشن Pipeline، هتخبط في الحيطة دي:

```text
ORA-20987: APEX - Security Group ID (your workspace identity) is invalid.
ORA-06512: at "APEX_240200.WWV_FLOW_SECURITY", line 3145
```

والسبب بسيط جداً:
* **الأمان المشدد (Strict Security)**: في بيئات التيست والإنتاج (Production)، يوزرات الـ Deployment المخصصة للـ CI/CD (زي `CI_DEPLOYER`) بتكون محدودة الصلاحيات ومش واخدة `APEX_ADMINISTRATOR_ROLE`. نظام الأمان الداخلي في APEX (`WWV_FLOW_SECURITY`) بيكتشف المحاولة دي وبيعتبرها اختراق وبيوقف العملية فوراً.
* **الأرقام دي مش محمولة (Non-Portable IDs)**: رقم الـ Workspace ID ده مش رقم ثابت، ده مجرد Database Sequence رقمي. يعني الـ Workspace اللي اسمها `DEV_WORKSPACE` ممكن يكون الـ ID بتاعها `1234567890123456` في بيئة الـ DEV، لكن في الـ STAGING أو الـ PROD هيكون رقم عشوائي تاني خالص! فكرة إنك تكتب أرقام IDs ثابتة (Hardcoded) جوه السكربتات دي أسرع وصفة لخراب أي Pipeline.

عشان كده، الاعتماد على `SET_SECURITY_GROUP_ID` اليدوي هو مجرد "مسكن مؤقت" مش حل DevOps احترافي.

* * *

## 🔑 الحل الصح والمحترم: ملفات Deployment مستقلة في Git لكل بيئة

بدل ما نعتمد على ملف `default.json` واحد كل شوية حد يعدل فيه، أو نجري ورا سكربتات PL/SQL هشة بتتغير من سيرفر لسيرفر، الحل الأفضل والمعتمد عالمياً هو: **إنشاء ملف إعدادات deployment مستقل لكل بيئة عمل، ورفعه على Git مع الكود**.

### هيكل المشروع لكل البيئات (Multi-Environment Structure)

داخل مشروع الـ APEX split-source، أداة SQLcl بتتعرف تلقائياً على فولدر اسمه `deployments/`. بجانب ملف `default.json`، تقدر تنشئ ملفات واضحة وصريحة لكل سيرفر هترفع عليه:

```plaintext
my-apex-project/
├── src/
│   └── ... (ملفات السورس كود النظيفة .apx)
└── deployments/
    ├── dev.json         ──► بيئة التطوير والـ Dev Schema
    ├── staging.json     ──► بيئة الاختبار والـ QA Schema
    └── prod.json        ──► بيئة الإنتاج والـ Live Schema
```

كل بيئة هيكون ليها "عقد" واضح ومحفوظ في الـ Version Control.

#### 1. ملف `deployments/dev.json` (بيئة التطوير)
```json
{
  "workspace" : {
    "name" : "DEV_WORKSPACE"
  },
  "app" : {
    "id" : 101,
    "databaseSession" : {
      "parsingSchema" : "APP_DEV"
    }
  }
}
```

#### 2. ملف `deployments/staging.json` (بيئة الاختبار والتجهيز)
```json
{
  "workspace" : {
    "name" : "STAGE_WORKSPACE"
  },
  "app" : {
    "id" : 201,
    "databaseSession" : {
      "parsingSchema" : "APP_STAGE"
    }
  }
}
```

#### 3. ملف `deployments/prod.json` (بيئة الإنتاج الحية)
```json
{
  "workspace" : {
    "name" : "PROD_WORKSPACE"
  },
  "app" : {
    "id" : 100,
    "databaseSession" : {
      "parsingSchema" : "APP_DATA"
    }
  }
}
```

```plaintext
  ┌─────────────────────────────────────────────────────────────┐
  │                 DEPLOYMENTS / <ENV>.JSON                    │
  ├─────────────────────────────────────────────────────────────┤
  │  🏢 workspace.name    ──► اسم الـ Workspace الصريح للبيئة دي │
  │  📦 app.id            ──► رقم التطبيق المستهدف              │
  │  ⚙️ parsingSchema     ──► الـ Schema المالكة للداتا هنا     │
  └─────────────────────────────────────────────────────────────┘
```

### ليه الحل ده بيكسب دايماً؟ 🏆

1. **حاسم ومفيهوش أي لبس (Zero Ambiguity)**: لأنك حددت `"workspace": { "name": "..." }` بالاسم الصريح، SQLcl عمرها ما هتحتاج تسأل الداتابيز ولا تخمن. ودعنا للأبد مشهد "مندوب الدليفري الحيران في الباركينج".
2. **تتبع كامل ومراجعة كود (Auditability & PRs)**: إعدادات الـ deployment بقت كود عايش جوه Git جنب السورس كود. أي تغيير في اسم Schema أو Workspace هيتراجع في Pull Request ويتسجل مين اللي عمله وليه.
3. **مش محتاج صلاحيات DBA خطيرة**: لأن SQLcl بتستخدم دوال الـ APEX Deployment الرسمية بالاسم الصريح، حساب الـ CI/CD مش محتاج `APEX_ADMINISTRATOR_ROLE` ولا محتاج يوجع دماغه بأرقام الـ IDs المتغيرة.
4. **أتمتة سهلة وسلسة في الـ CI/CD**: في أي Pipeline آلي (GitHub Actions, GitLab CI, Azure Pipelines, Jenkins)، اختيار البيئة بيبقى سطر واحد في غاية السهولة:

```bash
# في خطوة الـ Deployment في الـ CI/CD Pipeline:
# 1. تفعيل ملف البيئة المستهدفة واستبداله كـ default.json
cp deployments/${TARGET_ENV}.json deployments/default.json

# 2. تشغيل الـ Deployment فوراً وبدون أي مشاكل عبر SQLcl
sql -s user/password@target_db <<EOF
apex import
exit;
EOF
```

* * *

## 🛡️ شيك ليست (Checklist) ذهبية لـ APEX Deployments سالكة

في المرة الجاية وأنت بتبني أو بتعدل مشروع APEX، اتأكد من النقط دي:

- [ ] **إنشاء ملفات مخصصة لكل بيئة في Git**: احفظ `dev.json` و `staging.json` و `prod.json` جوه فولدر `deployments/` في الـ Repo.
- [ ] **كتابة `workspace.name` صراحةً دايماً**: اذكر اسم الـ Workspace بالاسم في كل ملف عشان SQLcl متضطرش تخمن أبداً.
- [ ] **ضبط الـ `parsingSchema` الصحيحة**: اتأكد إن الـ Schema المكتوبة بتطابق اليوزر المخصص للداتا في البيئة دي (`APP_DEV`, `APP_STAGE`, `APP_DATA`).
- [ ] **التحقق من صلاحية يوزر الـ Deployer**: اتأكد إن يوزر الـ Deployment مصرح له بالتعامل مع الـ Workspace Schema من خلال إدارة APEX العادية ومن غير ما تديله أدوار DBA مفتوحة.

* * *

## 🎯 ملخص الكلام

زي ما كابتن الدليفري محتاج اسم الشارع ورقم البرج ورقم الشقة عشان يسلمك العفش بأمان، أداة SQLcl محتاجة **رقم التطبيق (App ID)** ومعاه **اسم الـ Workspace** عشان تنزل كود الـ APEX بتاعك في مكانه الصح والمظبوط.

بلاش الاعتماد على حيل PL/SQL المؤقتة اللي بتشتغل على جهازك وتخذلك في السيرفرات الحقيقية. ثبت ملفات الـ deployment لكل بيئة في الـ Git، وهتضمن إن الـ CI/CD Pipelines بتاعتك تكون صلبة، مستقرة، وشغالة من أول مرة وبدون أي مفاجآت! 🚀✨