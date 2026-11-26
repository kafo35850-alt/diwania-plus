# رسالة Codex (انسخ اللي داخل المربع وأرسله له لما يرجع)

> هذا الملف يتحدث مع كل دفعة جديدة. آخر تحديث: الدفعة ١٦.

```
فيه أسئلة جديدة 👍 اثنتا عشرة دفعة مرة وحدة:
- الدفعة ٥: طب الأسنان، عطور عالمية، تطبيقات، معلومات عامة، أهل البر.
- الدفعة ٦: بريزن بريك، لاكاسا، بيكي بلايندرز، ذا أوفيس، شيرلوك، Dark، جون ويك، قراصنة الكاريبي.
- الدفعة ٧: الزير سالم، باب الحارة، فايكنغز، أفلام نولان، القناص، قاتل الشياطين، الأنمي (عام)، كرتون الطيبين، الأفلام العالمية، المسلسلات الأجنبية.
- الدفعة ٨: ليفربول، مانشستر سيتي، تشيلسي، أرسنال، مانشستر يونايتد، أي سي ميلان، UFC، المصارعة، NBA، فورمولا 1، التنس.
- الدفعة ٩: برشلونة، الكلاسيكو، ميسي، رونالدو، دوري أبطال أوروبا، الدوري الإسباني، جدة، الرياض.
- الدفعة ١٠: المنتخب السعودي في كأس العالم، النصر، الاتحاد، الأهلي، الدوري السعودي، القصيم، حائل، تبوك، الطائف، أبها، جازان. + أسئلة مشاهد «طاش ما طاش» (كتبها Gemini، وأرقام الحلقات في reports/scene-episodes.csv: طلّع لقطة من الحلقة لكل سؤال، تنعرض في الإجابة).
- الدفعة ١١: التاريخ الإسلامي، الأمريكتان، عملات الدول، أطباق الشعوب. + أسئلة مشاهد «شباب البومب» (نفس الشي: لقطات من الحلقات المكتوبة في reports/scene-episodes.csv).
- الدفعة ١٢: الشعر العربي، الأمثال، الذكاء الاصطناعي. + أسئلة مشاهد «العاصوف» و«جعفر العمدة» (لقطات من الحلقات في reports/scene-episodes.csv).
- الدفعة ١٣: أنمي بليتش، جوجوتسو كايسن، فل ميتال ألكيميست، أكاديمية بطلي، سولو ليفلينغ. + أسئلة مشاهد «الكبير أوي» (لقطات من الحلقات في reports/scene-episodes.csv).
- الدفعة ١٤: GTA، جوجو، حرب النجوم. + أسئلة مشاهد «باب الحارة» و«لن أعيش في جلباب أبي» (لقطات من الحلقات في reports/scene-episodes.csv).
- الدفعة ١٥: روايات، جغرافيا، عالم الطيران، كوبا أمريكا. + أسئلة مشاهد «الزير سالم».
- الدفعة ١٦: الطب، الهندسة، علوم الحاسب. + أسئلة Gemini لـ ١٢ مسلسل أجنبي (لقطات من الحلقات في reports/scene-episodes.csv) و٤ أندية سعودية (صور من المباريات المذكورة).

اسحب شغل Claude وادمجه:
   git fetch origin claude/game-review-publish-fc34dv
   git merge origin/claude/game-review-publish-fc34dv

1) شغّل python3 scripts/auto_answer_media.py وارفع eight_answer_auto.json مع الصور.
2) صور الأسئلة الجديدة اللي في reports/eight-more-questions.csv (اتبع قواعد الوسائط في CLAUDE.md).
3) تحقّق بالبحث من هالملفات، واكتب الأخطاء فقط (نفس الأعمدة اللي قبل):
   reports/gemini-check-06.txt  ←  reports/fact-check-06.csv
   reports/gemini-check-07.txt  ←  reports/fact-check-07.csv
   reports/gemini-check-08.txt  ←  reports/fact-check-08.csv
   reports/gemini-check-09.txt  ←  reports/fact-check-09.csv
   reports/gemini-check-10.txt  ←  reports/fact-check-10.csv
   reports/gemini-check-11.txt  ←  reports/fact-check-11.csv
   reports/gemini-check-12.txt  ←  reports/fact-check-12.csv
   reports/gemini-check-13.txt  ←  reports/fact-check-13.csv
   reports/gemini-check-14.txt  ←  reports/fact-check-14.csv
   reports/gemini-check-15.txt  ←  reports/fact-check-15.csv
   reports/gemini-check-16.txt  ←  reports/fact-check-16.csv
   reports/gemini-check-17.txt  ←  reports/fact-check-17.csv
ارفع على codex/question-images ولا تنشر.
```
