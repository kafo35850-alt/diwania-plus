# رسالة Codex (انسخ اللي داخل المربع وأرسله له لما يرجع)

> هذا الملف يتحدث مع كل دفعة جديدة. آخر تحديث: الدفعة ٩.

```
فيه أسئلة جديدة 👍 خمس دفعات مرة وحدة:
- الدفعة ٥: طب الأسنان، عطور عالمية، تطبيقات، معلومات عامة، أهل البر.
- الدفعة ٦: بريزن بريك، لاكاسا، بيكي بلايندرز، ذا أوفيس، شيرلوك، Dark، جون ويك، قراصنة الكاريبي.
- الدفعة ٧: الزير سالم، باب الحارة، فايكنغز، أفلام نولان، القناص، قاتل الشياطين، الأنمي (عام)، كرتون الطيبين، الأفلام العالمية، المسلسلات الأجنبية.
- الدفعة ٨: ليفربول، مانشستر سيتي، تشيلسي، أرسنال، مانشستر يونايتد، أي سي ميلان، UFC، المصارعة، NBA، فورمولا 1، التنس.
- الدفعة ٩: برشلونة، الكلاسيكو، ميسي، رونالدو، دوري أبطال أوروبا، الدوري الإسباني، جدة، الرياض.

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
ارفع على codex/question-images ولا تنشر.
```
