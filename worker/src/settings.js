// Store settings the owner changes from the admin panel (⚙️ إعدادات المتجر).
import { getDoc } from './catalog.js';

export const DEFAULT_SETTINGS = {
  announce_on: 0, announce_text: '', announce_link: '',
  signup_bonus: 0,          // credits given to every new account
  free_trials: 1,           // one free play of every paid game per account
  support_whatsapp: '',     // digits with country code, e.g. 9665xxxxxxxx
  install_banner: 1,        // "install the app" bar on the home page
  creator_reward_halalas: 25,      // «العب واكسب»: paid to a category's creator per game session that plays it
  creator_min_payout_halalas: 5000 // smallest withdrawal
};

export async function getSettings(env) {
  const doc = (await getDoc(env, 'settings')) || {};
  return { ...DEFAULT_SETTINGS, ...doc };
}

// What the store page may see (all of it is public by nature).
export function publicSettings(s) {
  return {
    announce: s.announce_on && s.announce_text ? { text: s.announce_text, link: s.announce_link || '' } : null,
    signup_bonus: Number(s.signup_bonus) || 0,
    free_trials: !!s.free_trials,
    support_whatsapp: s.support_whatsapp || '',
    install_banner: !!s.install_banner,
    creator_reward_halalas: Number(s.creator_reward_halalas) || 0,
    creator_min_payout_halalas: Number(s.creator_min_payout_halalas) || 0
  };
}
