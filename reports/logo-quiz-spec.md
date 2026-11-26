# فئتا «اكتشف الشعار الصحيح» — شغل Codex

الفئتان في content/eight_categories.json: custom_logo_brands و custom_logo_clubs (مخفيتين بـ "draft": true لين تخلص الصور).

## صورة السؤال (content/media/<المفتاح>_q.jpg)
- شبكة 2×2 على خلفية بيضاء، مقاس 1200×1200، وتحت كل مربع حرف كبير واضح: أ  ب  ج  د (أ فوق يمين، ب فوق يسار، ج تحت يمين، د تحت يسار).
- مربع واحد = الشعار الرسمي الحالي الأصلي (الحرف الصحيح في الجدول تحت).
- الثلاثة الباقية = نفس الشعار بنفس الحجم والجودة لكن فيه تعديل واحد صغير في التفصيلة المكتوبة (قلب الاتجاه، تبديل لون، زيادة/نقص عنصر، تغيير ترتيب). لازم تبان كأنها حقيقية، والفرق ما ينلاحظ إلا بالتركيز.
- 200 = فرق واضح شوي، 400 = متوسط، 600 = دقيق جداً.
- لا تكتب اسم الشركة/النادي في الصورة إذا كان جزء من الشعار نفسه خلّه.

## صورة الإجابة (content/media/<المفتاح>_a.jpg)
- الشعار الأصلي لحاله، وفوقه «✅ الصحيح: (الحرف)».

## بعد ما تخلص
1. سجّل المصدر لكل شعار أصلي في content/eight_media_sources.json.
2. حدّث hint لكل سؤال بجملة توضح الفرق (مثال: «الأصلي: القضمة على اليمين»).
3. سوّ بوستر لكل فئة: content/media/poster_custom_logo_brands.jpg و poster_custom_logo_clubs.jpg.
4. شيل "draft": true من الفئتين.
5. إذا ما قدرت على شعار، سجّله في reports/eight-media-gaps.csv.

## الجدول
| الفئة | # | النقاط | الشعار | الحرف الصحيح | التفصيلة اللي تتعدل في النسخ المزيفة | المفتاح |
|---|---|---|---|---|---|---|
| custom_logo_brands | 1 | 200 | أبل | أ | قضمة التفاحة: مكانها ويمين أو يسار، والورقة واتجاهها | logo_apple |
| custom_logo_brands | 2 | 200 | نايكي | ب | اتجاه السهم (السوووش) وانحناءه | logo_nike |
| custom_logo_brands | 3 | 200 | ماكدونالدز | د | لون حرف M وشكل القوسين | logo_mcdonalds |
| custom_logo_brands | 4 | 200 | واتساب | أ | اتجاه السماعة وذيل الفقاعة | logo_whatsapp |
| custom_logo_brands | 5 | 200 | بيبسي | ج | ترتيب الأحمر والأزرق وشكل الموجة البيضاء | logo_pepsi |
| custom_logo_brands | 6 | 200 | ستاربكس | ج | نجمة التاج، عدد الذيول، ولون الأخضر | logo_starbucks |
| custom_logo_brands | 7 | 400 | قوقل (حرف G) | أ | ترتيب الألوان الأربعة داخل حرف G | logo_google |
| custom_logo_brands | 8 | 400 | أديداس | ج | عدد الخطوط المائلة (3) وميلانها | logo_adidas |
| custom_logo_brands | 9 | 400 | شل | ب | عدد الأخاديد في الصدفة والأحمر والأصفر | logo_shell |
| custom_logo_brands | 10 | 400 | تويوتا | د | تداخل البيضاويات الثلاث | logo_toyota |
| custom_logo_brands | 11 | 400 | أودي | ب | عدد الحلقات (4) وتداخلها | logo_audi |
| custom_logo_brands | 12 | 400 | لاكوست | د | اتجاه التمساح ولون فمه | logo_lacoste |
| custom_logo_brands | 13 | 600 | بوما | أ | اتجاه القطة، الذيل، والأذن | logo_puma |
| custom_logo_brands | 14 | 600 | مرسيدس | ج | عدد أذرع النجمة (3) والدائرة | logo_mercedes |
| custom_logo_brands | 15 | 600 | أمازون | ب | السهم: من أي حرف لأي حرف يروح | logo_amazon |
| custom_logo_brands | 16 | 600 | فولكس واجن | د | ترتيب V و W (مين فوق) | logo_volkswagen |
| custom_logo_brands | 17 | 600 | بي إم دبليو | ب | ترتيب الأزرق والأبيض في الدائرة | logo_bmw |
| custom_logo_brands | 18 | 600 | نتفليكس | أ | حرف N: الظل والشريط الأوسط | logo_netflix |
| custom_logo_clubs | 1 | 200 | الهلال | د | لون الأزرق، الهلال والكرة | clublogo_hilal |
| custom_logo_clubs | 2 | 200 | النصر | ج | لون الأصفر والأزرق، الخريطة والسنة | clublogo_nassr |
| custom_logo_clubs | 3 | 200 | ريال مدريد | ج | التاج، الشريط البنفسجي، والحروف MCF | clublogo_realmadrid |
| custom_logo_clubs | 4 | 200 | برشلونة | ب | ترتيب الصليب والخطوط الحمراء والصفراء، وحروف FCB | clublogo_barcelona |
| custom_logo_clubs | 5 | 200 | الاتحاد | ب | الألوان والنمر والسنة | clublogo_ittihad |
| custom_logo_clubs | 6 | 200 | مانشستر يونايتد | ب | اتجاه الشيطان، السفينة، والألوان | clublogo_manutd |
| custom_logo_clubs | 7 | 400 | الأهلي السعودي | أ | الألوان الأخضر والأبيض والتفاصيل | clublogo_ahli |
| custom_logo_clubs | 8 | 400 | ليفربول | أ | طائر الليفر، النيران الجانبية، You'll Never Walk Alone | clublogo_liverpool |
| custom_logo_clubs | 9 | 400 | يوفنتوس | ج | شكل حرف J الحالي | clublogo_juventus |
| custom_logo_clubs | 10 | 400 | بايرن ميونخ | أ | ترتيب المعينات الزرقاء والبيضاء والكتابة | clublogo_bayern |
| custom_logo_clubs | 11 | 400 | تشيلسي | د | اتجاه الأسد والكرات والزهور | clublogo_chelsea |
| custom_logo_clubs | 12 | 400 | باريس سان جيرمان | د | برج إيفل، زهرة الزنبق، وترتيب الألوان | clublogo_psg |
| custom_logo_clubs | 13 | 600 | أرسنال | د | اتجاه المدفع (يمين أو يسار) | clublogo_arsenal |
| custom_logo_clubs | 14 | 600 | مانشستر سيتي | أ | السفينة والوردة والخطوط | clublogo_mancity |
| custom_logo_clubs | 15 | 600 | ميلان | ب | الصليب والخطوط والحروف ACM 1899 | clublogo_milan |
| custom_logo_clubs | 16 | 600 | إنتر | أ | ترتيب حروف IM والدوائر | clublogo_inter |
| custom_logo_clubs | 17 | 600 | الشباب | ج | الألوان والتفاصيل والسنة | clublogo_shabab |
| custom_logo_clubs | 18 | 600 | الاتفاق | ب | الألوان والتفاصيل والسنة | clublogo_ettifaq |
