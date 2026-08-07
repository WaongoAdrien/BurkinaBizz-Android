// lib/profanityFilter.ts — basic French/English profanity check for user-submitted text
//
// Two match modes:
//  - STRICT: whole word only. Used for short/ambiguous words that are prefixes of
//    legitimate words (e.g. "con" inside "contact", "piss" inside "pissenlit").
//  - STEM: matches as a word-start prefix so common conjugations/suffixes are
//    caught too (e.g. "fuck" also catches "fucking", "fucked", "fucker").
//
// Words intentionally excluded because they collide with everyday French usage
// in a business-review context: "retard" (late/delay), "douche" (shower),
// "ordure" (garbage/trash), "bâtard" (a type of bread loaf).

const ENGLISH_STRICT = ['dick', 'cock', 'piss'];

const ENGLISH_STEM = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'slut', 'whore',
  'faggot', 'nigger', 'nigga', 'motherfucker', 'pussy', 'twat', 'wanker',
  'bollocks', 'jackass', 'dumbass', 'cocksucker', 'dipshit', 'douchebag',
];

const FRENCH_STRICT = ['con', 'conne', 'connard', 'connasse', 'connerie', 'pute'];

const FRENCH_STEM = [
  'merde', 'putain', 'salope', 'salaud', 'enculé', 'encule', 'enculer',
  'nique', 'niquer', 'bite', 'couille', 'couilles', 'chier', 'branler',
  'branleur', 'abruti', 'imbécile', 'imbecile', 'crétin', 'cretin',
  'debile', 'débile',
];

const DIACRITIC_START = String.fromCharCode(0x0300);
const DIACRITIC_END = String.fromCharCode(0x036f);
const DIACRITIC_PATTERN = new RegExp(`[${DIACRITIC_START}-${DIACRITIC_END}]`, 'g');

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITIC_PATTERN, '');
}

const BAD_WORD_PATTERNS = [
  ...[...ENGLISH_STRICT, ...FRENCH_STRICT].map(
    word => new RegExp(`\\b${normalize(word)}\\b`, 'i')
  ),
  ...[...ENGLISH_STEM, ...FRENCH_STEM].map(
    word => new RegExp(`\\b${normalize(word)}`, 'i')
  ),
];

export function containsProfanity(text: string | null | undefined): boolean {
  if (!text) return false;
  const normalized = normalize(text);
  return BAD_WORD_PATTERNS.some(pattern => pattern.test(normalized));
}
