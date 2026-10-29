/**
 * Generates common English morphological inflections for a word or phrasal chunk
 * to ensure flexible matching in learner writing (e.g., 'depend on' matches 'depends on', 'depended on').
 */
export function extractTargetWordTokens(word: string): string[] {
  const clean = word.trim().toLowerCase();
  if (!clean) return [];

  const tokens = new Set<string>();
  tokens.add(clean);

  // If multi-word chunk (e.g. 'depend on', 'look forward to', 'agree with')
  if (clean.includes(' ')) {
    const parts = clean.split(/\s+/);
    const mainVerb = parts[0];
    const rest = parts.slice(1).join(' ');

    const verbInflections = getSingleWordInflections(mainVerb);
    for (const v of verbInflections) {
      tokens.add(`${v} ${rest}`);
    }
    return Array.from(tokens);
  }

  // Single word inflections
  const singleInflections = getSingleWordInflections(clean);
  for (const inf of singleInflections) {
    tokens.add(inf);
  }

  return Array.from(tokens);
}

// Common English irregular verbs and their inflected forms
const COMMON_IRREGULAR_VERBS: Record<string, string[]> = {
  be: ['am', 'is', 'are', 'was', 'were', 'been', 'being'],
  have: ['has', 'had', 'having'],
  do: ['does', 'did', 'done', 'doing'],
  go: ['goes', 'went', 'gone', 'going'],
  say: ['says', 'said', 'saying'],
  make: ['makes', 'made', 'making'],
  take: ['takes', 'took', 'taken', 'taking'],
  come: ['comes', 'came', 'coming'],
  see: ['sees', 'saw', 'seen', 'seeing'],
  know: ['knows', 'knew', 'known', 'knowing'],
  get: ['gets', 'got', 'gotten', 'getting'],
  give: ['gives', 'gave', 'given', 'giving'],
  find: ['finds', 'found', 'finding'],
  think: ['thinks', 'thought', 'thinking'],
  tell: ['tells', 'told', 'telling'],
  become: ['becomes', 'became', 'becoming'],
  leave: ['leaves', 'left', 'leaving'],
  feel: ['feels', 'felt', 'feeling'],
  put: ['puts', 'putting'],
  bring: ['brings', 'brought', 'bringing'],
  begin: ['begins', 'began', 'begun', 'beginning'],
  keep: ['keeps', 'kept', 'keeping'],
  hold: ['holds', 'held', 'holding'],
  write: ['writes', 'wrote', 'written', 'writing'],
  stand: ['stands', 'stood', 'standing'],
  hear: ['hears', 'heard', 'hearing'],
  let: ['lets', 'letting'],
  mean: ['means', 'meant', 'meaning'],
  set: ['sets', 'setting'],
  meet: ['meets', 'met', 'meeting'],
  run: ['runs', 'ran', 'running'],
  pay: ['pays', 'paid', 'paying'],
  sit: ['sits', 'sat', 'sitting'],
  speak: ['speaks', 'spoke', 'spoken', 'speaking'],
  lie: ['lies', 'lay', 'lain', 'lying'],
  lead: ['leads', 'led', 'leading'],
  read: ['reads', 'reading'],
  grow: ['grows', 'grew', 'grown', 'growing'],
  lose: ['loses', 'lost', 'losing'],
  fall: ['falls', 'fell', 'fallen', 'falling'],
  send: ['sends', 'sent', 'sending'],
  build: ['builds', 'built', 'building'],
  understand: ['understands', 'understood', 'understanding'],
  draw: ['draws', 'drew', 'drawn', 'drawing'],
  break: ['breaks', 'broke', 'broken', 'breaking'],
  spend: ['spends', 'spent', 'spending'],
  cut: ['cuts', 'cutting'],
  rise: ['rises', 'rose', 'risen', 'rising'],
  drive: ['drives', 'drove', 'driven', 'driving'],
  buy: ['buys', 'bought', 'buying'],
  wear: ['wears', 'wore', 'worn', 'wearing'],
  choose: ['chooses', 'chose', 'chosen', 'choosing'],
  seek: ['seeks', 'sought', 'seeking'],
  throw: ['throws', 'threw', 'thrown', 'throwing'],
  catch: ['catches', 'caught', 'catching'],
  deal: ['deals', 'dealt', 'dealing'],
  win: ['wins', 'won', 'winning'],
  forget: ['forgets', 'forgot', 'forgotten', 'forgetting'],
  sell: ['sells', 'sold', 'selling'],
  fight: ['fights', 'fought', 'fighting'],
  teach: ['teaches', 'taught', 'teaching'],
  eat: ['eats', 'ate', 'eaten', 'eating'],
  sing: ['sings', 'sang', 'sung', 'singing'],
  drink: ['drinks', 'drank', 'drunk', 'drinking'],
  swim: ['swims', 'swam', 'swum', 'swimming'],
  fly: ['flies', 'flew', 'flown', 'flying'],
  sleep: ['sleeps', 'slept', 'sleeping'],
  hide: ['hides', 'hid', 'hidden', 'hiding'],
  cost: ['costs', 'costing'],
  hit: ['hits', 'hitting'],
  hurt: ['hurts', 'hurting'],
  shut: ['shuts', 'shutting'],
  spread: ['spreads', 'spreading'],
  bear: ['bears', 'bore', 'born', 'borne', 'bearing'],
  strike: ['strikes', 'struck', 'striking'],
  shake: ['shakes', 'shook', 'shaken', 'shaking'],
  ride: ['rides', 'rode', 'ridden', 'riding'],
  wake: ['wakes', 'woke', 'woken', 'waking'],
  bite: ['bites', 'bit', 'bitten', 'biting'],
  blow: ['blows', 'blew', 'blown', 'blowing'],
  tear: ['tears', 'tore', 'torn', 'tearing'],
  freeze: ['freezes', 'froze', 'frozen', 'freezing'],
  steal: ['steals', 'stole', 'stolen', 'stealing'],
};

function getSingleWordInflections(base: string): string[] {
  const forms = new Set<string>();
  forms.add(base);

  // If irregular verb, add known irregular inflections and avoid spurious regular past endings like "taked"
  const irregularForms = COMMON_IRREGULAR_VERBS[base];
  if (irregularForms) {
    for (const f of irregularForms) {
      forms.add(f);
    }
    return Array.from(forms);
  }

  // Suffixes: -s, -es
  if (base.endsWith('y') && !/[aeiou]y$/.test(base)) {
    forms.add(base.slice(0, -1) + 'ies'); // try -> tries
    forms.add(base.slice(0, -1) + 'ied'); // try -> tried
  } else if (base.endsWith('s') || base.endsWith('sh') || base.endsWith('ch') || base.endsWith('x') || base.endsWith('z')) {
    forms.add(base + 'es'); // miss -> misses, watch -> watches
  } else {
    forms.add(base + 's'); // walk -> walks, book -> books
  }

  // Past: -ed, -d
  if (base.endsWith('e')) {
    forms.add(base + 'd'); // live -> lived
  } else if (!base.endsWith('y')) {
    forms.add(base + 'ed'); // walk -> walked
  }

  // Gerund: -ing
  if (base.endsWith('e') && !base.endsWith('ee')) {
    forms.add(base.slice(0, -1) + 'ing'); // write -> writing
  } else {
    forms.add(base + 'ing'); // walk -> walking
  }

  return Array.from(forms);
}

/**
 * Checks whether a target vocabulary word or any of its inflections
 * is present in the learner's draft text using regex word boundaries.
 */
export function isTargetWordUsedInText(targetWord: string, text: string): boolean {
  if (!targetWord.trim() || !text.trim()) return false;

  const inflections = extractTargetWordTokens(targetWord);
  const normalizedText = text.toLowerCase();

  for (const token of inflections) {
    // Escape regex characters
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(normalizedText)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks which target vocabulary terms were used productively in the learner's text (RF-VOC-10).
 */
export function checkProductiveVocabUsage(
  vocabWords: string[],
  text: string,
): { usedWords: string[]; missingWords: string[] } {
  const usedWords: string[] = [];
  const missingWords: string[] = [];

  for (const word of vocabWords) {
    if (isTargetWordUsedInText(word, text)) {
      usedWords.push(word);
    } else {
      missingWords.push(word);
    }
  }

  return { usedWords, missingWords };
}

