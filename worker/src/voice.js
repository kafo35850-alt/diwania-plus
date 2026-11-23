// The owner's own narrator recordings. Lines live in content/voice_lines.json; "{}" marks a name or number that the
// device voice says. Every other piece of a line is one recording, kept in the 'voice' document as { lineId: [url, ...] }.
import LINES from '../../content/voice_lines.json';
import PACK from '../../content/narration_pack.json';
import { HttpError } from './util.js';
import { getDoc, putDoc } from './catalog.js';
import { MEDIA_RE } from './media.js';

const SPOKEN = /[\p{L}\p{N}]/u;
const FEMALE_NARRATOR_GAMES = new Set(['dakhil', 'draw_guess', 'qaftah']);
export function voiceTokensForGame(slug) {
  return FEMALE_NARRATOR_GAMES.has(slug) ? PACK.femaleTokens : PACK.tokens;
}
export function voicePieces(text) {
  return String(text).replace(/\s+/g, ' ').trim().split('{}').filter((s) => SPOKEN.test(s)).map((s) => s.trim());
}
export const VOICE_LINES = LINES.map((l) => ({ ...l, pieces: voicePieces(l.text) }));

// Complete recordings from the owner take priority over the bundled narrator.
export async function voiceForGame(env, slug) {
  const lines = VOICE_LINES.filter((line) => line.games.includes(slug) ||
    (line.id === 'screen_code' && PACK.codeGames.includes(slug)));
  const extra = PACK.extra.filter((line) => line.games.includes(slug));
  if (!lines.length && !extra.length) return [];
  const recordings = (await getDoc(env, 'voice')) || {};
  return [
    ...lines.map((line) => {
      const custom = recordings[line.id];
      const need = line.pieces.length;
      const parts = Array.isArray(custom) && custom.length >= need && custom.slice(0, need).every(Boolean)
        ? custom : PACK.clips[line.id];
      return { text: line.text, parts };
    }),
    ...extra.map(({ text, parts }) => ({ text, parts }))
  ];
}

export async function voiceAdminData(env) {
  return { lines: VOICE_LINES, rec: (await getDoc(env, 'voice')) || {} };
}

export async function saveVoicePiece(env, payload, remove) {
  const line = VOICE_LINES.find((l) => l.id === payload.lineId);
  if (!line) throw new HttpError(404, 'الجملة غير موجودة.');
  const idx = Number(payload.part);
  if (!Number.isInteger(idx) || idx < 0 || idx >= line.pieces.length) throw new HttpError(400, 'جزء غير صحيح.');
  const url = String(payload.url || '');
  if (!remove && !MEDIA_RE.test(url)) throw new HttpError(400, 'ارفع التسجيل أول.');
  const rec = (await getDoc(env, 'voice')) || {};
  const parts = (rec[line.id] || []).slice(0, line.pieces.length);
  while (parts.length < line.pieces.length) parts.push(null);
  parts[idx] = remove ? null : url;
  if (parts.some(Boolean)) rec[line.id] = parts; else delete rec[line.id];
  await putDoc(env, 'voice', rec);
  return { ok: true, message: remove ? 'انحذف التسجيل، والجملة رجعت للصوت الحالي.' : 'انحفظ تسجيلك 🎙️' };
}
