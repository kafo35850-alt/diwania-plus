import COVERAGE from './eight_question_media.json';
import PICS from './pictures.json';
import { cleanMedia } from './media.js';

const media = COVERAGE.media.map(([t, u]) => cleanMedia({ t, u }));
const excluded = new Set(['custom_1795086658817', 'custom_cars']);
const reviews = Object.entries(COVERAGE.questions)
  .filter(([slug]) => !excluded.has(slug))
  .map(([slug, cards]) => [
    slug,
    new Map(cards.map(([uid, digest, question, answer, fixedText]) =>
      [uid, { digest, question, answer, fixedText }]))
  ]);

function fingerprint(question, answer) {
  const text = String(question || '') + '\0' + String(answer || '');
  let digest = 2166136261;
  for (let i = 0; i < text.length; i++) {
    digest = Math.imul(digest ^ text.charCodeAt(i), 16777619);
  }
  return digest >>> 0;
}

export function addShippedQuestionMedia(stored, rawQuestions) {
  for (const [slug, byId] of reviews) {
    const cards = Object.hasOwn(stored, slug) ? stored[slug] : rawQuestions(slug);
    if (!Array.isArray(cards) || !cards.length) continue;

    let changed = false;
    const updated = cards.map((card) => {
      const review = byId.get(card?.uid);
      if (!review || fingerprint(card.q, card.a) !== review.digest) return card;

      const seeded = Object.hasOwn(PICS, card.uid) ? PICS[card.uid] : [];
      const qm = !card.qm && !card.img && !card.video && !seeded[0] && media[review.question];
      const am = !card.am && !seeded[1] && media[review.answer];
      if (!qm && !am && !review.fixedText) return card;

      changed = true;
      return {
        ...card,
        ...(review.fixedText ? { q: review.fixedText } : {}),
        ...(qm ? { qm: { ...qm } } : {}),
        ...(am ? { am: { ...am } } : {})
      };
    });
    if (changed) stored[slug] = updated;
  }
}
