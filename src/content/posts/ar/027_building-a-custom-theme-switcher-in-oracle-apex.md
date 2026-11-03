---
category: apex-theme-factory
date: '2026-11-07'
description: الجزء الخامس من سلسلة APEX Theme Factory. إزاي نبني أداة تبديل ثيمات حديثة، واستخدام روابط الـ Hash لتفادي أخطاء الـ Checksum، وربط مكونات Alpine.js وعناصر نماذج أبيكس.
draft: false
featured: false
hashnode_draft_id: ""
image: /arabic-blog/covers/027_building-a-custom-theme-switcher-in-oracle-apex.jpg
lang: ar
original_english_url: https://ash2osh.hashnode.dev/building-a-custom-theme-switcher-in-oracle-apex
tags:
- oracle-apex
- javascript
- alpinejs
- ui-design
- arabic
title: "بناء أداة تبديل الثيمات المخصصة في Oracle APEX: ودجز الواجهة، Alpine.js، وعناصر النماذج 🎛️✨"
---

> 🇬🇧 **English Version:** Read the original article in English [here](https://ash2osh.hashnode.dev/building-a-custom-theme-switcher-in-oracle-apex).

# بناء أداة تبديل الثيمات المخصصة في Oracle APEX: ودجز الواجهة، Alpine.js، وعناصر النماذج 🎛️✨

*الجزء الخامس من السلسلة التقنية الشاملة: تصميم عناصر التحكم وتطوير واجهات المستخدم التفاعلية في Oracle APEX.*

* * *

## ⚡ الخلاصة في كلمتين (TL;DR)

> تخيل راكب عربية كهربائية رياضية فخمة وسريعة جداً، وعايز تحول وضع القيادة من الوضع الاقتصادي الهادي لوضع الحلبات الرياضي فائق السرعة. بدل ما تلاقي شاشة لمس زجاجية مضيئة وشيك في التابلوه، لقيت صانع العربية حاطط لك بكرة راديو ترانزستور قديمة من بتوع التمانينات تحت درج التابلوه وبتزيق مع كل لفة!
>
> ده الإحساس اللي بيوصل لمستخدمين تطبيقات الشركات لما تحط لهم أداة تبديل ثيمات عشوائية. القائمة المنسدلة في شريط التنقل العلوي (Navigation Bar) كويسة وشغالة، بس المستخدمين دلوقتي مستنيين عناصر تحكم بصرية حديثة ومريحة: بطاقات ملونة في صفحة الملف الشخصي، وأزرار كبسولات تفاعلية (Pills)، وعناصر نماذج قياسية جوه شاشات الإعدادات.
>
> في الجزء الخامس من سلسلتنا **APEX Theme Factory**، هنستلم قمرة القيادة في واجهة المستخدم. هنشرح بالتفصيل محرك الجافاسكريبت `window.ApexThemeFactory`، ونكتشف إزاي روابط الـ Hash بتحمينا من أخطاء الـ Checksum في روابط أبيكس الذكية (Friendly URLs)، ونعترض ودجت القوائم الرسمية في أبيكس، ونبني أزرار حديثة باستخدام **Alpine.js 3.x** وعناصر نماذج أبيكس القياسية. 🚀

* * *

## 🕹️ استكشاف كود `window.ApexThemeFactory`

لما كود التمهيد بيشتغل في الصفحة رقم 0، بيثبت كائن تحكم برمجي خفيف ومحمي على الكائن العام `window`:

```javascript
/* واجهة التحكم البرمجية في المتصفح */
window.ApexThemeFactory = Object.freeze({
  // بيرجع اسم الثيم النشط حالياً (زي 'carbon-volt' أو 'linen')
  current: function () { ... },

  // بيرجع مصفوفة بكل الثيمات المثبتة في التطبيق مع عناوينها
  choices: function () { ... },

  // بيفعل الثيم المطلوب ويحدث التخزين المحلي وينضف رابط الصفحة ويعيد التحميل
  use: function (name) { ... }
});
```

تقدر تفتح نافذة المطورين في المتصفح وتجرب الأوامر دي بنفسك:

```javascript
// 1. شوف إيه الثيم النشط دلوقتي
console.log(window.ApexThemeFactory.current());
// النتيجة: "linen"

// 2. اعرض كل الثيمات المتاحة في جدول منظم
console.table(window.ApexThemeFactory.choices());

// 3. بدل لثيم Carbon Volt بلمسة واحدة
window.ApexThemeFactory.use("carbon-volt");
```

لما بتنادي الدالة `window.ApexThemeFactory.use('carbon-volt')`، المحرك بينفذ الخطوات التالية:
1. بيتحقق إن اسم الثيم موجود فعلاً في قائمة الثيمات المصرح بها في التطبيق.
2. بيسجل الاختيار في التخزين المحلي: `localStorage.setItem('apex.themeFactory.102', 'carbon-volt')`.
3. لو المستخدم اختار الثيم الافتراضي للنظام (زي `linen`)، الكود **بيمسح المفتاح** من الـ `localStorage`، عشان لو مدير النظام غير الثيم الافتراضي بعد أسبوع، المستخدم ياخد التحديث الجديد فوراً!
4. بينضف أي زوائد `#theme=` من رابط المتصفح ويعيد تحميل الصفحة بنعومة.

* * *

## 🛡️ سر روابط الـ Hash والحماية من أخطاء الـ Checksum

ليه Theme Factory بيدعم تبديل الثيمات عبر الهاش `#theme=carbon-volt` بدل استخدام المعاملات العادية زي `?theme=carbon-volt`؟

أي مطور اشتغل مع روابط أبيكس الذكية الحديثة (Friendly URLs) عارف شاشة الخطأ الشهيرة دي:

```text
HTTP 400 Bad Request
"The request could not be processed because the checksum is invalid."
```

في أوراكل أبيكس، خاصية **حماية حالة الجلسة (Session State Protection - SSP)** بتنشئ توقيع تشفيري (Checksum) لكل المعاملات اللي بتتبعت في الرابط. لو ضفت معامل جديد زي `?theme=dark` من غير ما تكون مشفره من السيرفر، محرك أبيكس بيرفض الطلب فوراً باعتباره محاولة اختراق أمني!

### حل الهاش السحري في جهة العميل:
```text
https://mycorp.com/ords/r/demo/ut/dashboard#theme=carbon-volt
                                            ▲
                                            └── هاش محلي جوه المتصفح فقط
```

أجزاء الـ Hash في الرابط (أي حاجة بعد علامة `#`) **مبتتبعتش للسيرفر أو قاعدة البيانات إطلاقاً**! المتصفح بيحتفظ بيها جواه فقط.

كود التمهيد في الصفحة رقم 0 بيقرا الهاش ده محلياً قبل ما يقرا التخزين المحلي. بكده فرق الدعم والمبيعات والتسويق يقدروا يبعتوا روابط مباشرة بتفتح شاشات معينة بثيم محدد وبدون أي خطأ Checksum على الإطلاق!

* * *

## 🪄 اعتراض قائمة الـ Navigation Bar الأصلية في أبيكس

لو ثبت حزم الثيمات بخيار `--with-switcher`، إزاي Theme Factory بيحول عنصر شريط التنقل لقائمة راديو متفاعلة؟

الكود بيستمع لحدث رسمي بيطلقه الثيم الموحد لما يجهز اسمه `theme42ready.apexThemeFactory`. ولما الحدث ده يحصل، بيعترض القائمة الداخلية ويحولها لقائمة خيارات راديو (Radio Group) متصلة بواجهة الـ API كالآتي:

```javascript
/* كود اعتراض القائمة من الملف theme-factory-runtime.js */
apex.jQuery(window)
  .off("theme42ready.apexThemeFactory")
  .on("theme42ready.apexThemeFactory", function () {
    var $ = apex.jQuery;
    var button = $(".t-NavigationBar-item.theme-factory-managed-switcher [data-menu]").first();
    var menu = button.length ? $("#" + button.attr("data-menu")) : $();
    
    if (!menu.length) return;

    // حقن مجموعة راديو تفاعلية جوه ودجت قائمة أبيكس الرسمية!
    menu.menu("option", "items", [{
      type: "radioGroup",
      get: window.ApexThemeFactory.current,
      set: window.ApexThemeFactory.use,
      choices: window.ApexThemeFactory.choices()
    }]);
  });
```

الحركة دي بتحول القائمة العادية لقائمة راديو ذكية، عليها علامة صح جنب الثيم المختار حالياً، ومتوافقة 100% مع لوحة المفاتيح ومعايير إمكانية الوصول لذوي الاحتياجات الخاصة!

* * *

## 🎨 النمط الأول: أزرار كبسولات حديثة باستخدام Alpine.js 3.x

عايز تبني واجهة شيك وعصرية جوه شاشة الملف الشخصي للمستخدم؟ تقدر تعمل أزرار كبسولات (Pills) تفاعلية باستخدام مكتبة **Alpine.js 3.x** جوه منطقة محتوى ثابت في أبيكس:

```html
<!-- حط الكود ده جوه Static Content Region في شاشة إعدادات المستخدم أو الملف الشخصي -->
<div x-data="themePicker()" class="app-theme-picker">
  <label class="app-theme-picker__label">تخصيص المظهر البصري:</label>
  <div class="app-theme-picker__group">
    <template x-for="theme in themes" :key="theme.value">
      <button 
        type="button"
        class="app-theme-picker__pill"
        :class="{ 'is-active': currentTheme === theme.value }"
        @click="switchTheme(theme.value)">
        <span class="app-theme-picker__indicator" :data-theme="theme.value"></span>
        <span x-text="theme.label"></span>
      </button>
    </template>
  </div>
</div>

<script>
function themePicker() {
  return {
    currentTheme: window.ApexThemeFactory ? window.ApexThemeFactory.current() : 'iris',
    themes: window.ApexThemeFactory ? window.ApexThemeFactory.choices() : [],
    switchTheme(themeName) {
      if (this.currentTheme === themeName) return;
      this.currentTheme = themeName;
      window.ApexThemeFactory.use(themeName);
    }
  };
}
</script>
```

وحط كود الـ CSS المنسق ده في خانة **Inline CSS** الخاصة بالصفحة:

```css
.app-theme-picker {
  padding: 1rem;
  background: var(--app-surface-card);
  border: 1px solid var(--app-border-color);
  border-radius: var(--app-radius-md);
}
.app-theme-picker__label {
  display: block;
  font-weight: var(--app-font-weight-semibold);
  margin-bottom: 0.75rem;
  color: var(--app-text-primary);
}
.app-theme-picker__group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.app-theme-picker__pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: 1px solid var(--app-border-color);
  background: var(--app-surface-input);
  color: var(--app-text-primary);
  border-radius: 9999px;
  cursor: pointer;
  transition: all var(--app-motion-duration) ease;
}
.app-theme-picker__pill:hover {
  transform: var(--app-hover-transform);
  border-color: var(--app-border-strong);
}
.app-theme-picker__pill.is-active {
  border-color: var(--app-color-primary);
  background: var(--app-surface-selected);
  font-weight: var(--app-font-weight-semibold);
}
.app-theme-picker__indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--app-color-primary);
}
```

* * *

## 📋 النمط الثاني: عناصر نماذج أبيكس الرسمية والأوامر الديناميكية

لو بتفضل مكونات أوراكل أبيكس القياسية من غير مكتبات إضافية، تقدر تبرمج قائمة منسدلة أو مجموعة أزرار راديو في **3 خطوات سهلة**:

```text
الخطوة 1: أنشئ عنصر جديد جوه الصفحة:
         - الاسم: P10_THEME_SELECTOR
         - النوع: Select List (أو Radio Group)
         - نوع القيم: Static Values
         - كود القيم الثابتة:
           STATIC:Carbon Volt;carbon-volt,Citrus Pop;citrus-pop,Solarized Dark;solarized-dark,Linen;linen,Iris;iris

الخطوة 2: اضبط القيمة الافتراضية (Default Value) كالتالي:
         - النوع: JavaScript Expression
         - الكود: window.ApexThemeFactory ? window.ApexThemeFactory.current() : 'iris'

الخطوة 3: أضف أمر ديناميكي (Dynamic Action) عند التغيير:
         - الحدث: Change
         - الإجراء: Execute JavaScript Code
         - الكود:
           window.ApexThemeFactory.use(this.data);
```

أول ما المستخدم يختار أي قيمة، الأمر الديناميكي بينادي دالة `use` تلقائياً بدون ما تشغل بالك بتفاصيل التخزين!

* * *

## ⏭️ المقال القادم: حفظ الثيمات على مستوى قاعدة البيانات

التخزين في المتصفح `localStorage` حل ممتاز وسريع جداً. بس في أنظمة الشركات الضخمة، الموظف بيتنقل طول اليوم بين كمبيوتر المكتب، واللابتوب في الاجتماع، والتابلت في المخزن. ومستني إن التطبيق يفتكر ثيمه المفضل وراه في كل جهاز يسجل دخول منه!

في **المقال 028** (مسك الختام!)، هنتعلم **حفظ الثيمات على مستوى المؤسسة**: ربط التفضيلات بحساب المستخدم (`:APP_USER`) في قاعدة البيانات، واستدعاءات Ajax المباشرة، وحقن الكلاس في الصفحة الأولى بدون وميض وبسرعة البرق! 🏨🔐🚀
