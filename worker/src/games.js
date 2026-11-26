// Private game files, bundled into the Worker. They are never served as public static files;
// players only receive them through /play/<slug> after a paid or free-trial launch, or as guests of a live room.
import alibi_court from '../../games/alibi_court.html';
import chancellor from '../../games/chancellor.html';
import dakhil from '../../games/dakhil.html';
import diwaniya_auction from '../../games/diwaniya_auction.html';
import draw_guess from '../../games/draw_guess.html';
import draw_classic from '../../games/draw_classic.html';
import eight from '../../games/eight.html';
import fake_artist from '../../games/fake_artist.html';
import fortune_wheel from '../../games/fortune_wheel.html';
import fooq_rasak from '../../games/fooq_rasak.html';
import friends_court from '../../games/friends_court.html';
import golden_vault from '../../games/golden_vault.html';
import harf from '../../games/harf.html';
import how_much_price from '../../games/how_much_price.html';
import last_one_standing from '../../games/last_one_standing.html';
import liars_table from '../../games/liars_table.html';
import mafia from '../../games/mafia.html';
import mazad30 from '../../games/mazad30.html';
import mystery_button from '../../games/mystery_button.html';
import pressure_seat from '../../games/pressure_seat.html';
import qaddirha from '../../games/qaddirha.html';
import qaftah from '../../games/qaftah.html';
import radar_guess from '../../games/radar_guess.html';
import shifra from '../../games/shifra.html';
import silent_library from '../../games/silent_library.html';
import stadium_esports from '../../games/stadium_esports.html';
import vault50 from '../../games/vault50.html';
import who_knows_friend from '../../games/who_knows_friend.html';

export const GAMES = {
  alibi_court,
  chancellor,
  dakhil,
  diwaniya_auction,
  draw_guess,
  draw_classic,
  eight,
  fake_artist,
  fortune_wheel,
  fooq_rasak,
  friends_court,
  golden_vault,
  harf,
  how_much_price,
  last_one_standing,
  liars_table,
  mafia,
  mazad30,
  mystery_button,
  pressure_seat,
  qaddirha,
  qaftah,
  radar_guess,
  shifra,
  silent_library,
  stadium_esports,
  vault50,
  who_knows_friend,
};

// The built-in questions of a category exactly as the game stores them (photos and all).
export function eightRawQuestions(catSlug) {
  const html = eight;
  const marker = 'id="m8_cat_' + catSlug + '"';
  const pos = html.indexOf(marker);
  if (pos === -1) return [];
  const gt = html.indexOf('>', pos);
  const lt = html.indexOf('</script>', gt);
  if (gt === -1 || lt === -1) return [];
  try {
    const arr = JSON.parse(html.slice(gt + 1, lt).trim());
    return Array.isArray(arr) ? arr.map((q, i) => ({ ...q, uid: q.uid || (catSlug + '_q' + (i + 1) + '_' + (q.points || 200)) })) : [];
  } catch (e) { return []; }
}
