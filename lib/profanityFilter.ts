// Profanity and harmful words filter for English and Tagalog
// This list contains common inappropriate terms that should be blocked

const HARMFUL_WORDS_ENGLISH = [
  // Profanity
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'shitty',
  'bitch', 'bitches', 'asshole', 'bastard', 'damn', 'hell',
  'crap', 'piss', 'dick', 'cock', 'cocksucker', 'pussy',
  'whore', 'slut', 'hoe', 'jackass', 'dumbass',

  // Obfuscated / misspellings
  'fck', 'fuk', 'fuq', 'f*ck', 'f**k', 'sh*t', 'sht',
  'b*tch', 'biatch', 'a$$', 'a$$hole', '@ss', '@sshole',
  'pu$$y', 'p*ssy', 'd1ck', 'c0ck',

  // Sexual / explicit
  'sex', 'sexual', 'porn', 'porno', 'pornhub', 'nude', 'naked',
  'boobs', 'tits', 'tit', 'ass', 'butt', 'booty',
  'anal', 'oral', 'blowjob', 'handjob', 'rimjob',
  'masturbate', 'masturbation', 'jerk off', 'cum', 'cumming',
  'horny', 'sexy', 'seduce', 'seduction', 'orgasm',
  'rape', 'rapist', 'molest', 'molestation',

  // Hate speech / derogatory
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'gay', 'lesbian', 'tranny', 'homo', 'queer',
  'chink', 'spic', 'kike', 'cracker',

  // Violence / threats
  'kill', 'killing', 'murder', 'die', 'death', 'dead',
  'suicide', 'self harm', 'harm', 'hurt', 'attack',
  'beat', 'stab', 'shoot', 'bomb', 'terrorist',

  // Drugs
  'cocaine', 'coke', 'heroin', 'meth', 'shabu', 'weed',
  'marijuana', 'pot', 'drug', 'drugs', 'dealer',
  'get high', 'stoned',

  // Scam / fraud
  'send money', 'send cash', 'cash app', 'venmo me', 'paypal me',
  'gcash me', 'paymaya me', 'buy nudes', 'selling nudes',
  'sugar daddy', 'sugar baby', 'scam', 'fraud', 'hack',
];


const HARMFUL_WORDS_TAGALOG = [
  // Profanity
  'putang ina', 'putangina', 'puta', 'gago', 'gaga', 'tanga',
  'tangina', 'tarantado', 'ulol', 'bobo', 'gunggong',
  'hayop', 'hinayupak', 'kingina', 'peste', 'animal',
  'punyeta', 'leche', 'yawa', 'pakyu', 'lintik',
  'bwisit', 'badtrip', 'sira ulo', 'buang', 'loko',

  // Obfuscated / variations
  'p u t a', 'p*ta', 'p*tang ina', 'g@go', 't@nga',
  'put@ng in@', 'tang ina', 'puking ina', 'put@', 'g@g0',
  't@ngina', 'pu+ang ina',

  // Sexual / explicit
  'kantot', 'kantutan', 'tamod', 'titi', 'puke', 'bilat',
  'jakol', 'chupa', 'tsupa', 'libog', 'malibog',
  'tite', 'oten', 'burat', 'bayag', 'iyot', 'iyutan',
  'kadyot', 'kadyotan', 'kantotero', 'kantotera',

  // Derogatory / insults
  'bakla', 'bading', 'bayot', 'tomboy',
  'walang hiya', 'walang kwenta', 'basura', 'demonyo',
  'unggoy', 'baboy', 'aso', 'kampon ni satanas',
  'salot', 'perwisyo', 'pabigat', 'palamunin',

  // Violence / threats
  'patayin', 'papatayin', 'saksak', 'barilin', 'bugbugin',
  'patay', 'mamamatay', 'sunugin', 'gulpi', 'sakalin',

  // Drugs (Tagalog/PH slang)
  'shabu', 'droga', 'adik', 'adik sa droga', 'pusher',
  'tulak', 'bangag', 'sabog',

  // Scam / fraud (Tagalog context)
  'padala ng pera', 'send gcash', 'send paymaya',
  'magpadala ng pera', 'hingi pera', 'utang', 'budol',
  'scammer', 'loko', 'modus',
];


// Combined list with all harmful words
const ALL_HARMFUL_WORDS = [
  ...HARMFUL_WORDS_ENGLISH,
  ...HARMFUL_WORDS_TAGALOG,
].map(word => word.toLowerCase());

/**
 * Checks if text contains any harmful words
 * @param text - The text to check
 * @returns Object with isClean boolean and found words array
 */
export function checkProfanity(text: string): { 
  isClean: boolean; 
  foundWords: string[];
} {
  if (!text || typeof text !== 'string') {
    return { isClean: true, foundWords: [] };
  }

  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];

  // Check each harmful word
  for (const word of ALL_HARMFUL_WORDS) {
    // Escape special regex characters in the word
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Use word boundaries to match whole words only (avoids false positives like "hello" matching "hell")
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
    
    if (regex.test(lowerText)) {
      foundWords.push(word);
    }
  }

  return {
    isClean: foundWords.length === 0,
    foundWords: foundWords,
  };
}

/**
 * Validates text and returns user-friendly error message
 * @param text - The text to validate
 * @param fieldName - Name of the field being validated (for error message)
 * @returns Error message if invalid, null if valid
 */
export function validateText(text: string, fieldName: string = 'Text'): string | null {
  const result = checkProfanity(text);
  
  if (!result.isClean) {
    return `${fieldName} contains inappropriate language. Please keep your content respectful.`;
  }
  
  return null;
}

/**
 * Validates multiple text fields (for profile creation)
 * @param fields - Object with field names as keys and text as values
 * @returns Error message if any field is invalid, null if all valid
 */
export function validateMultipleFields(fields: Record<string, string>): string | null {
  for (const [fieldName, text] of Object.entries(fields)) {
    const error = validateText(text, fieldName);
    if (error) {
      return error;
    }
  }
  
  return null;
}
