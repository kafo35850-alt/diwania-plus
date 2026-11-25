// Answer pictures picked by scripts/auto_answer_media.py (Arabic Wikipedia, strict checks).
// Only fills an answer that has no picture yet, and only while the question text is the one that was checked.
import AUTO from './eight_answer_auto.json';
import PICS from './pictures.json';

function fingerprint(question, answer) {
  const text = String(question || '') + '\0' + String(answer || '');
  let digest = 2166136261;
  for (let i = 0; i < text.length; i++) digest = Math.imul(digest ^ text.charCodeAt(i), 16777619);
  return digest >>> 0;
}

export function addAutoAnswerMedia(stored, rawQuestions) {
  for (const [slug, byUid] of Object.entries(AUTO.items || {})) {
    const cards = Object.hasOwn(stored, slug) ? stored[slug] : rawQuestions(slug);
    if (!Array.isArray(cards) || !cards.length) continue;
    let changed = false;
    const updated = cards.map((card) => {
      const hit = card && byUid[card.uid];
      if (!hit || card.am || (PICS[card.uid] || [])[1] || fingerprint(card.q, card.a) !== hit[0]) return card;
      changed = true;
      return { ...card, am: { t: 'image', u: hit[1] } };
    });
    if (changed) stored[slug] = updated;
  }
}
