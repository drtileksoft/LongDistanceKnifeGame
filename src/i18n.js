// All UI texts in one dictionary. To add a language (de, fr, it, ru …) copy the `en` block,
// translate it and add the code to LANGS. Keys ending in _knife/_axe depend on the tool
// (Czech verbs agree with the grammatical gender: nůž = he, sekera = she).
// Plural entries are objects keyed by Intl.PluralRules categories.

export const LANGS = ['cs', 'en'];

export const STRINGS = {
  cs: {
    langName: 'Čeština',
    decimal: ',',
    pageTitle: 'Dlouhá vzdálenost – simulátor pravidel',
    brandSub: 'simulátor pravidel',
    title: 'Dlouhá vzdálenost',
    introLead:
      'Vyzkoušej si, jak na soutěžích Blade Throwers z. s. funguje disciplína dlouhá vzdálenost. ' +
      'Odehraješ jednoho vrhače: před každým hodem zvolíš vzdálenost a rozhodneš, jestli se hod zasekl. ' +
      'Hra hlídá pravidla, ukazuje, odkud smíš házet, a na konci spočítá výsledek.',
    introPick: 'Vyber nástroj',
    tool_nospin: 'Nůž · no-spin',
    tool_spin: 'Nůž · spin',
    tool_axe: 'Sekera',
    desc_nospin: 'Sektory po 3 m od 4 m (4–7, 7–10 …). Nůž letí hrotem vpřed, rotace nejvýše 170°.',
    desc_spin: 'Sektory po 3 m od 7 m (7–10, 10–13 …). Nůž rotuje, otočí se o víc než 180°.',
    desc_axe: 'Stejné sektory jako spin (od 7 m). Rotace se neposuzuje, platí jen sekera zaseknutá čepelí.',
    rulesHead: 'Pravidla v kostce',
    rulesList: [
      'Začínáš se 3 hody v zásobě, zkušební hody nejsou.',
      'Dokud nemáš zásek, házíš odkudkoli z prvního sektoru.',
      'Po záseku musíš jít dál než poslední zásek, nejvýše do konce následujícího sektoru – sektor nelze přeskočit.',
      'Zásek: změří se vzdálenost a zásoba se vrací na 3 hody. Neúspěch: o hod méně, při nule soutěž končí.',
      'Výsledek je nejdelší změřený zásek. Vzdálenost = špička přední nohy při odhodu, měří se na 1 cm.',
    ],
    tileReserve: 'hody v zásobě',
    tileSector: 'šířka sektoru',
    tilePrecision: 'přesnost měření',
    target1: 'TERČ ⌀ 1 m',
    target2: 'střed {a}–{b} m',
    etc: 'atd.',
    allowedTag: 'Odsud smí házet',
    logHead: 'Průběh',
    exampleHead: 'Příklad',
    rowThrow: '{n}. hod',
    reserveHead: 'Hody v zásobě',
    note_reset: 'zpět na 3',
    note_minus: '−1',
    note_end: 'konec',
    resultTag: 'Výsledek {d} m',
    noResultTag: 'Bez výsledku',
    legend: 'odkud se smí házet: dál než poslední zásek, nejvýše do konce následujícího sektoru',
    barResult: 'Výsledek = nejdelší změřený zásek',
    barSkip: 'Sektor nelze přeskočit',
    barFoot: 'Vzdálenost = špička přední nohy při odhodu',
    barRot_spin: 'Rotace více než 180°',
    barRot_nospin: 'Rotace nejvýše 170°',
    barRot_axe: 'Platí jen zásek čepelí',
    badgeStuck: 'Zásek ✓',
    badgeMiss_knife: 'Nezasekl se ✗',
    badgeMiss_axe: 'Nezasekla se ✗',
    btnStuck_knife: 'Zasekl se ✓',
    btnStuck_axe: 'Zasekla se ✓',
    btnMiss_knife: 'Nezasekl se ✗',
    btnMiss_axe: 'Nezasekla se ✗',
    btnUndo: 'Vrátit hod',
    btnNew: 'Nový závod',
    btnTool: 'Změnit nástroj',
    btnDemo: 'Přehrát ukázku',
    btnDemoStop: 'Zastavit ukázku',
    btnAgain: 'Hrát znovu',
    distLabel: 'Vzdálenost hodu',
    keysHint: 'Šipky ±1 cm · PageUp/PageDown ±10 cm · Home/End na kraj povoleného úseku',
    farther: 'dál',
    closer: 'blíž',
    r_beforeFirst: 'Před prvním sektorem, nejblíž {min} m',
    r_outsideFirst: 'Bez záseku jen z prvního sektoru, nejvýše {max} m',
    r_notFarther: 'Musí být dál než poslední zásek ({L} m)',
    r_skipSector: 'Sektor nelze přeskočit, nejvýše {max} m',
    r_over: 'Zásoba je vyčerpaná, soutěž pro vrhače skončila',
    r_invalid: 'Neplatná vzdálenost',
    ok_first: 'Povoleno: první sektor {a}–{b} m',
    ok_after: 'Povoleno: dál než {L} m, nejvýše {max} m',
    c_throw: '{n}. hod z {d} m',
    c_ruleFirst: 'Bez záseku: odkudkoli z prvního sektoru ({a}–{b} m)',
    c_ruleAfter: 'Dál než poslední zásek ({L} m), nejvýše do konce následujícího sektoru ({max} m)',
    c_stuck1: 'Zásek! Měří se: {d} m',
    c_stuck2: 'Zásoba se vrací na 3 hody',
    c_miss1_knife: 'Nezasekl se',
    c_miss1_axe: 'Nezasekla se',
    c_miss2: 'O hod méně: v zásobě {throws}',
    c_missCloser: ' – po neúspěchu lze jít i blíž',
    c_missLast: 'O hod méně: zásoba je prázdná, soutěž končí',
    c_end1: 'Výsledek: {d} m',
    c_end2: 'Platí nejdelší změřený zásek',
    c_endNone1: 'Bez výsledku',
    c_endNone2: 'Žádný zásek – vrhač nemá výsledek',
    sumTitle: 'Konec závodu',
    sumResult: 'Výsledek',
    sumNone: 'bez výsledku',
    throws: { one: '{n} hod', few: '{n} hody', many: '{n} hodu', other: '{n} hodů' },
    sticks: { one: '{n} zásek', few: '{n} záseky', many: '{n} záseku', other: '{n} záseků' },
    colNo: '#',
    colDist: 'Vzdálenost',
    colRange: 'Povolený úsek',
    colStuck: 'Hod',
    colReserve: 'Zásoba',
    footer: 'Pravidla disciplíny dlouhá vzdálenost podle Blade Throwers z. s.',
    clubLink: 'Blade Throwers z. s. – web klubu (otevře se v novém okně)',
    clubMore: 'Klub, soutěže a oficiální pravidla:',
    sceneLabel: 'Scéna: pohled z boku na dráhu, terč a vrhače',
    langLabel: 'Jazyk',
  },
  en: {
    langName: 'English',
    decimal: '.',
    pageTitle: 'Long Distance – rules simulator',
    brandSub: 'rules simulator',
    title: 'Long distance',
    introLead:
      'Try out how the long distance discipline works at Blade Throwers z. s. competitions. ' +
      'You play one thrower: before every throw you choose the distance and decide whether the throw stuck. ' +
      'The game enforces the rules, shows where you may throw from and calculates the result.',
    introPick: 'Choose your tool',
    tool_nospin: 'Knife · no-spin',
    tool_spin: 'Knife · spin',
    tool_axe: 'Axe',
    desc_nospin: 'Sectors 3 m wide from 4 m (4–7, 7–10 …). The knife flies point first, rotation at most 170°.',
    desc_spin: 'Sectors 3 m wide from 7 m (7–10, 10–13 …). The knife spins, rotating more than 180°.',
    desc_axe: 'Same sectors as spin (from 7 m). Rotation is not judged; only an axe stuck with its blade counts.',
    rulesHead: 'Rules in a nutshell',
    rulesList: [
      'You start with 3 throws in hand, no practice throws.',
      'Until your first stick you may throw from anywhere in the first sector.',
      'After a stick you must go farther than the last stick, at most to the end of the next sector – no sector may be skipped.',
      'A stick: the distance is measured and you are back to 3 throws. A miss: one throw less, at zero the event ends.',
      'Your result is the longest measured stick. Distance = toe of the front foot at release, measured to 1 cm.',
    ],
    tileReserve: 'throws in hand',
    tileSector: 'sector width',
    tilePrecision: 'measured to',
    target1: 'TARGET ⌀ 1 m',
    target2: 'centre {a}–{b} m',
    etc: 'etc.',
    allowedTag: 'Throw from here',
    logHead: 'Progress',
    exampleHead: 'Example',
    rowThrow: 'Throw {n}',
    reserveHead: 'Throws in hand',
    note_reset: 'back to 3',
    note_minus: '−1',
    note_end: 'end',
    resultTag: 'Result {d} m',
    noResultTag: 'No result',
    legend: 'where the throw may be taken from: farther than the last stick, at most to the end of the next sector',
    barResult: 'Result = the longest measured stick',
    barSkip: 'No sector may be skipped',
    barFoot: 'Distance = toe of the front foot at release',
    barRot_spin: 'Rotation more than 180°',
    barRot_nospin: 'Rotation at most 170°',
    barRot_axe: 'Only a blade stick counts',
    badgeStuck: 'Stick ✓',
    badgeMiss_knife: 'No stick ✗',
    badgeMiss_axe: 'No stick ✗',
    btnStuck_knife: 'Stuck ✓',
    btnStuck_axe: 'Stuck ✓',
    btnMiss_knife: 'No stick ✗',
    btnMiss_axe: 'No stick ✗',
    btnUndo: 'Undo throw',
    btnNew: 'New event',
    btnTool: 'Change tool',
    btnDemo: 'Play example',
    btnDemoStop: 'Stop example',
    btnAgain: 'Play again',
    distLabel: 'Throw distance',
    keysHint: 'Arrows ±1 cm · PageUp/PageDown ±10 cm · Home/End to the edge of the allowed range',
    farther: 'farther',
    closer: 'closer',
    r_beforeFirst: 'In front of the first sector, no closer than {min} m',
    r_outsideFirst: 'Without a stick only from the first sector, at most {max} m',
    r_notFarther: 'Must be farther than the last stick ({L} m)',
    r_skipSector: 'No sector may be skipped, at most {max} m',
    r_over: 'No throws left, the event is over for this thrower',
    r_invalid: 'Invalid distance',
    ok_first: 'Allowed: first sector {a}–{b} m',
    ok_after: 'Allowed: farther than {L} m, at most {max} m',
    c_throw: 'Throw {n} from {d} m',
    c_ruleFirst: 'No stick yet: anywhere in the first sector ({a}–{b} m)',
    c_ruleAfter: 'Farther than the last stick ({L} m), at most to the end of the next sector ({max} m)',
    c_stuck1: 'Stick! Measured: {d} m',
    c_stuck2: 'Back to 3 throws in hand',
    c_miss1_knife: 'No stick',
    c_miss1_axe: 'No stick',
    c_miss2: 'One throw less: {throws} in hand',
    c_missCloser: ' – after a miss you may also move closer',
    c_missLast: 'One throw less: no throws left, the event ends',
    c_end1: 'Result: {d} m',
    c_end2: 'The longest measured stick counts',
    c_endNone1: 'No result',
    c_endNone2: 'No stick – the thrower has no result',
    sumTitle: 'Event over',
    sumResult: 'Result',
    sumNone: 'no result',
    throws: { one: '{n} throw', other: '{n} throws' },
    sticks: { one: '{n} stick', other: '{n} sticks' },
    colNo: '#',
    colDist: 'Distance',
    colRange: 'Allowed',
    colStuck: 'Throw',
    colReserve: 'In hand',
    footer: 'Long distance discipline rules of Blade Throwers z. s.',
    clubLink: 'Blade Throwers z. s. – club website (opens in a new window)',
    clubMore: 'Club, competitions and official rules:',
    sceneLabel: 'Scene: side view of the range, target and thrower',
    langLabel: 'Language',
  },
};

/** Picks the default language from the browser: cs/sk → Czech, anything else → English. */
export function detectLang(languages = []) {
  for (const l of languages) {
    const code = String(l).toLowerCase().slice(0, 2);
    if (code === 'cs' || code === 'sk') return 'cs';
    if (LANGS.includes(code)) return code;
  }
  return 'en';
}

/** Metres with two decimals and the language's decimal separator: 1160 → "11,60". */
export function formatCm(cm, lang) {
  const s = (cm / 100).toFixed(2);
  return s.replace('.', STRINGS[lang]?.decimal ?? '.');
}

/** Sector boundary in whole metres when possible: 1300 → "13", 1250 → "12,50". */
export function formatBound(cm, lang) {
  return cm % 100 === 0 ? String(cm / 100) : formatCm(cm, lang);
}

export function createT(lang) {
  const dict = STRINGS[lang] ?? STRINGS.en;
  const plural = new Intl.PluralRules(lang);
  const fill = (s, params) => s.replace(/\{(\w+)\}/g, (m, k) => (k in params ? params[k] : m));
  function t(key, params = {}) {
    const s = dict[key] ?? STRINGS.en[key];
    if (s === undefined) return key;
    if (typeof s === 'string') return fill(s, params);
    return s;
  }
  t.plural = (key, n) => {
    const forms = dict[key] ?? STRINGS.en[key];
    return fill(forms[plural.select(n)] ?? forms.other, { n });
  };
  t.cm = (cm) => formatCm(cm, lang);
  t.bound = (cm) => formatBound(cm, lang);
  t.lang = lang;
  return t;
}
