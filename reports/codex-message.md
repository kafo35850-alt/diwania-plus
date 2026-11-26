# رسالة Codex (انسخ اللي داخل المربع وأرسله له لما يرجع)

> هذا الملف يتحدث مع كل دفعة جديدة. آخر تحديث: بعد الدفعة ١٨ + ملفات Gemini (تقريباً ٤٩٠٠ سؤال جديد).

```
رجعنا 👍 فيه شغل كثير، فاشتغل عليه بالترتيب، وارفع (commit + push) بعد كل خطوة عشان ما يضيع شي لو خلص الليمت.

اسحب شغل Claude وادمجه أول:
   git fetch origin claude/game-review-publish-fc34dv
   git merge origin/claude/game-review-publish-fc34dv

الخطوة 1 — فحص الأسئلة اللي كتبها Claude (الأهم):
تحقّق بالبحث من هالملفات، واكتب الأخطاء فقط (نفس الأعمدة اللي قبل):
   reports/gemini-check-06.txt  ←  reports/fact-check-06.csv
   reports/gemini-check-07.txt  ←  reports/fact-check-07.csv
   ... إلى ...
   reports/gemini-check-19.txt  ←  reports/fact-check-19.csv
   reports/gemini-check-20.txt  ←  reports/fact-check-20.csv  (6 أسئلة عن أحداث 2026، ابدأ فيه أول لأنه صغير ومهم)
(15 ملف، من 06 إلى 20). ارفع بعد كل 3 ملفات.
ملاحظة: الأسئلة اللي في content/eight_checked.json تحت gemini_new كتبها Gemini بمصادر، لا تفحصها.

الخطوة 2 — صور الإجابات التلقائية:
شغّل python3 scripts/auto_answer_media.py وارفع eight_answer_auto.json مع الصور.

الخطوة 3 — لقطات المشاهد:
reports/scene-episodes.csv فيه أكثر من 1300 سؤال عن مشاهد مسلسلات وأنمي وأفلام ومباريات، مع رقم الحلقة (أو اسم الفيلم/المباراة).
لكل سؤال: لقطة حقيقية من الحلقة أو المشهد تنعرض في الإجابة (مو في السؤال عشان ما تكشف الجواب).
ابدأ بالمسلسلات العربية (طاش ما طاش، شباب البومب، العاصوف، جعفر العمدة، الكبير أوي، باب الحارة، لن أعيش في جلباب أبي، الزير سالم)، بعدها الأجنبية، بعدها الأنمي، بعدها الأفلام، وآخر شي الكورة.
ارفع بعد كل مسلسل. اللي ما تلقى له لقطة سجّله في reports/eight-media-gaps.csv.

الخطوة 4 — صور الأسئلة الجديدة الباقية اللي في reports/eight-more-questions.csv (اتبع قواعد الوسائط في CLAUDE.md).

ارفع كل شي على codex/question-images ولا تنشر.
```
