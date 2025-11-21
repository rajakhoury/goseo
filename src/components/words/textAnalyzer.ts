import { WordCount, WordAnalysisResult, AnalyzeOptions, WordsError } from './types';

const CHUNK_SIZE = 100000;
const MAX_TEXT_LENGTH = 1000000;
const MIN_WORD_LENGTH = 2;
const MAX_PHRASE_LENGTH = 50;

interface LanguageRules {
  stopWords: Set<string>;
  articles: RegExp;
  validSingleLetters: RegExp;
  commonPhraseEndings: RegExp;
  invalidStarters: RegExp;
  contractions: Map<string, string>;
  compoundWordChars: RegExp;
  wordFrequencies: Map<string, number>;
  multiWordStops: Set<string>;
}

const LANGUAGE_RULES: { [key: string]: LanguageRules } = {
  es: {
    stopWords: new Set([
      'a',
      'al',
      'algo',
      'algunas',
      'algunos',
      'ante',
      'antes',
      'como',
      'con',
      'contra',
      'cual',
      'cuando',
      'de',
      'del',
      'desde',
      'donde',
      'durante',
      'e',
      'el',
      'ella',
      'ellas',
      'ellos',
      'en',
      'entre',
      'era',
      'erais',
      'eran',
      'eras',
      'eres',
      'es',
      'esa',
      'esas',
      'ese',
      'eso',
      'esos',
      'esta',
      'estaba',
      'estado',
      'estais',
      'estamos',
      'estan',
      'estar',
      'estas',
      'este',
      'esto',
      'estos',
      'estoy',
      'etc',
      'fue',
      'fueron',
      'fui',
      'fuimos',
      'ha',
      'habeis',
      'haber',
      'habia',
      'habias',
      'han',
      'has',
      'hasta',
      'hay',
      'he',
      'hemos',
      'hube',
      'hubo',
      'la',
      'las',
      'le',
      'les',
      'lo',
      'los',
      'mas',
      'me',
      'mi',
      'mia',
      'mias',
      'mientras',
      'mio',
      'mios',
      'mis',
      'mucho',
      'muchos',
      'muy',
      'nada',
      'ni',
      'no',
      'nos',
      'nosotras',
      'nosotros',
      'nuestra',
      'nuestras',
      'nuestro',
      'nuestros',
      'o',
      'os',
      'otra',
      'otras',
      'otro',
      'otros',
      'para',
      'pero',
      'por',
      'porque',
      'que',
      'quien',
      'quienes',
      'qué',
      'se',
      'sea',
      'seais',
      'semos',
      'ser',
      'si',
      'sido',
      'siendo',
      'sin',
      'sobre',
      'sois',
      'somos',
      'son',
      'soy',
      'su',
      'sus',
      'suya',
      'suyas',
      'suyo',
      'suyos',
      'sí',
      'también',
      'tanto',
      'te',
      'teneis',
      'tenemos',
      'tener',
      'tengo',
      'ti',
      'tiene',
      'tienen',
      'todo',
      'todos',
      'tu',
      'tus',
      'tuya',
      'tuyas',
      'tuyo',
      'tuyos',
      'tú',
      'un',
      'una',
      'uno',
      'unos',
      'vosotras',
      'vosotros',
      'vuestra',
      'vuestras',
      'vuestro',
      'vuestros',
      'y',
      'ya',
      'yo',
      'él',
      'ésta',
      'éstas',
      'éste',
      'éstos',
    ]),
    articles: /^(el|la|los|las|un|una|unos|unas)$/i,
    validSingleLetters: /^[yaeou]$/i,
    commonPhraseEndings: /^(es|está|son|fueron|ser|estar)$/i,
    invalidStarters: /^(y|o|pero|porque|que|si|no|al|del)$/i,
    contractions: new Map([
      ['al', 'a el'],
      ['del', 'de el'],
      ['desde', 'de desde'],
      ['hasta', 'ha hasta'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['de', 10],
      ['la', 8],
      ['que', 7],
      ['el', 6],
      ['en', 5],
    ]),
    multiWordStops: new Set(['de la', 'en el', 'que es']),
  },
  it: {
    stopWords: new Set([
      'a',
      'ad',
      'al',
      'alla',
      'alle',
      'allo',
      'anche',
      'avere',
      'aveva',
      'avevano',
      'ben',
      'buono',
      'che',
      'chi',
      'cinque',
      'comprare',
      'con',
      'cosa',
      'cui',
      'da',
      'dal',
      'dalla',
      'dalle',
      'dallo',
      'dei',
      'del',
      'della',
      'delle',
      'dello',
      'dentro',
      'deve',
      'devo',
      'di',
      'doppio',
      'due',
      'e',
      'ecco',
      'fare',
      'fine',
      'fino',
      'fra',
      'gente',
      'giu',
      'ha',
      'hai',
      'hanno',
      'ho',
      'il',
      'indietro',
      'invece',
      'io',
      'la',
      'lavoro',
      'le',
      'lei',
      'lo',
      'loro',
      'lui',
      'lungo',
      'ma',
      'me',
      'meglio',
      'molta',
      'molti',
      'molto',
      'nei',
      'nella',
      'no',
      'noi',
      'nome',
      'nostro',
      'nove',
      'nuovi',
      'nuovo',
      'o',
      'oltre',
      'ora',
      'otto',
      'peggio',
      'per',
      'perche',
      'più',
      'poco',
      'primo',
      'qua',
      'quarto',
      'quasi',
      'quattro',
      'quello',
      'questo',
      'qui',
      'quindi',
      'quinto',
      'rispetto',
      'sara',
      'secondo',
      'sei',
      'sembra',
      'sembrava',
      'senza',
      'sette',
      'sia',
      'siamo',
      'siete',
      'solo',
      'sono',
      'sopra',
      'soprattutto',
      'sotto',
      'stati',
      'stato',
      'stesso',
      'su',
      'sua',
      'sue',
      'sui',
      'sul',
      'sulla',
      'sulle',
      'sullo',
      'suo',
      'suoi',
      'tale',
      'tanto',
      'te',
      'tempo',
      'terzo',
      'tra',
      'tre',
      'triplo',
      'ultimo',
      'un',
      'una',
      'uno',
      'va',
      'vai',
      'voi',
      'volte',
      'vostro',
    ]),
    articles: /^(il|lo|la|i|gli|le|un|uno|una)$/i,
    validSingleLetters: /^[aei]$/i,
    commonPhraseEndings: /^(è|sono|era|erano|essere|stato|stata)$/i,
    invalidStarters: /^(e|o|ma|perche|che|se|non|di|da)$/i,
    contractions: new Map([
      ["dell'", 'de la'],
      ["nell'", 'ne la'],
      ["all'", 'a la'],
      ["dall'", 'da la'],
      ["sull'", 'su la'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['di', 10],
      ['il', 8],
      ['che', 7],
      ['la', 6],
      ['per', 5],
      ['un', 5],
      ['è', 4],
    ]),
    multiWordStops: new Set(['di il', 'di la', 'per il', 'per la']),
  },
  pt: {
    stopWords: new Set([
      'a',
      'ao',
      'aos',
      'aquela',
      'aquelas',
      'aquele',
      'aqueles',
      'aquilo',
      'as',
      'até',
      'com',
      'como',
      'da',
      'das',
      'de',
      'dela',
      'delas',
      'dele',
      'deles',
      'depois',
      'do',
      'dos',
      'e',
      'é',
      'ela',
      'elas',
      'ele',
      'eles',
      'em',
      'entre',
      'era',
      'eram',
      'essa',
      'essas',
      'esse',
      'esses',
      'esta',
      'estas',
      'este',
      'estes',
      'eu',
      'foi',
      'fomos',
      'for',
      'foram',
      'ha',
      'havia',
      'isso',
      'isto',
      'já',
      'la',
      'lhe',
      'lhes',
      'lo',
      'mais',
      'mas',
      'me',
      'mesmo',
      'meu',
      'meus',
      'minha',
      'minhas',
      'muito',
      'na',
      'nas',
      'nem',
      'no',
      'nos',
      'nós',
      'nossa',
      'nossas',
      'nosso',
      'nossos',
      'num',
      'numa',
      'não',
      'o',
      'os',
      'ou',
      'para',
      'pela',
      'pelas',
      'pelo',
      'pelos',
      'por',
      'qual',
      'quando',
      'que',
      'quem',
      'se',
      'sem',
      'seu',
      'seus',
      'só',
      'sua',
      'suas',
      'também',
      'te',
      'tem',
      'temos',
      'tenho',
      'ter',
      'teu',
      'teus',
      'ti',
      'tido',
      'tinha',
      'tinham',
      'toda',
      'todas',
      'todo',
      'todos',
      'tu',
      'tua',
      'tuas',
      'tudo',
      'um',
      'uma',
      'umas',
      'uns',
      'vos',
      'vós',
      'vossa',
      'vossas',
      'vosso',
      'vossos',
    ]),
    articles: /^(o|a|os|as|um|uma|uns|umas)$/i,
    validSingleLetters: /^[aeo]$/i,
    commonPhraseEndings: /^(é|são|era|eram|ser|estar|sido)$/i,
    invalidStarters: /^(e|o|mas|porque|que|se|não|de|da|do)$/i,
    contractions: new Map([
      ['do', 'de o'],
      ['da', 'de a'],
      ['dos', 'de os'],
      ['das', 'de as'],
      ['no', 'em o'],
      ['na', 'em a'],
      ['ao', 'a o'],
      ['à', 'a a'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['de', 10],
      ['o', 8],
      ['que', 7],
      ['a', 6],
      ['e', 6],
      ['para', 5],
      ['em', 5],
    ]),
    multiWordStops: new Set(['de o', 'de a', 'para o', 'para a']),
  },
  nl: {
    stopWords: new Set([
      'aan',
      'af',
      'al',
      'als',
      'bij',
      'dan',
      'dat',
      'de',
      'der',
      'deze',
      'die',
      'dit',
      'door',
      'een',
      'en',
      'er',
      'ge',
      'geen',
      'haar',
      'had',
      'hebben',
      'heeft',
      'hem',
      'het',
      'hij',
      'hoe',
      'hun',
      'ik',
      'in',
      'is',
      'je',
      'kan',
      'me',
      'meer',
      'men',
      'met',
      'mij',
      'mijn',
      'moet',
      'na',
      'naar',
      'niet',
      'nog',
      'nu',
      'of',
      'om',
      'omdat',
      'ons',
      'onze',
      'ook',
      'op',
      'over',
      'reeds',
      'te',
      'tegen',
      'toch',
      'toen',
      'tot',
      'u',
      'uit',
      'uw',
      'van',
      'veel',
      'voor',
      'want',
      'waren',
      'was',
      'wat',
      'we',
      'wel',
      'werd',
      'wezen',
      'wie',
      'wij',
      'wil',
      'worden',
      'wordt',
      'zal',
      'ze',
      'zei',
      'zelf',
      'zich',
      'zij',
      'zijn',
      'zo',
      'zonder',
      'zou',
    ]),
    articles: /^(de|het|een)$/i,
    validSingleLetters: /^[u]$/i,
    commonPhraseEndings: /^(is|zijn|was|waren|worden|geweest)$/i,
    invalidStarters: /^(en|of|maar|omdat|dat|als|niet|van|voor)$/i,
    contractions: new Map([
      ["'t", 'het'],
      ["'s", 'des'],
      ["'n", 'een'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['de', 10],
      ['het', 8],
      ['van', 7],
      ['een', 6],
      ['en', 6],
      ['in', 5],
    ]),
    multiWordStops: new Set(['van de', 'van het', 'in de', 'op de']),
  },
  pl: {
    stopWords: new Set([
      'a',
      'aby',
      'ah',
      'ale',
      'bardzo',
      'bez',
      'bo',
      'być',
      'ci',
      'cię',
      'ciebie',
      'co',
      'czy',
      'daleko',
      'dla',
      'do',
      'dobrze',
      'dokąd',
      'dość',
      'dużo',
      'dwa',
      'dwaj',
      'dwie',
      'dwoje',
      'dziś',
      'dzisiaj',
      'gdyby',
      'gdzie',
      'go',
      'godz',
      'ich',
      'ile',
      'im',
      'inna',
      'inne',
      'inny',
      'innych',
      'i',
      'ja',
      'ją',
      'jak',
      'jakby',
      'jaki',
      'je',
      'jeden',
      'jedna',
      'jedno',
      'jego',
      'jej',
      'jemu',
      'jest',
      'jestem',
      'jeśli',
      'jeżeli',
      'już',
      'każdy',
      'kiedy',
      'kilka',
      'kimś',
      'kto',
      'ktoś',
      'która',
      'które',
      'którego',
      'której',
      'który',
      'których',
      'którym',
      'którzy',
      'lat',
      'lecz',
      'lub',
      'ma',
      'mają',
      'mało',
      'mam',
      'mi',
      'mimo',
      'między',
      'mnie',
      'mogą',
      'moi',
      'może',
      'można',
      'mój',
      'mu',
      'musi',
      'my',
      'na',
      'nad',
      'nam',
      'nami',
      'nas',
      'nasi',
      'nasz',
      'nasza',
      'nasze',
      'naszego',
      'naszych',
      'natychmiast',
      'nawet',
      'nic',
      'nich',
      'nie',
      'niego',
      'niej',
      'niemu',
      'nigdy',
      'nim',
      'nimi',
      'niż',
      'no',
      'o',
      'obok',
      'od',
      'około',
      'on',
      'ona',
      'one',
      'oni',
      'ono',
      'oraz',
      'po',
      'pod',
      'podczas',
      'pomimo',
      'ponad',
      'ponieważ',
      'powinien',
      'powinna',
      'powinni',
      'powinno',
      'poza',
      'prawie',
      'przecież',
      'przed',
      'przede',
      'przedtem',
      'przez',
      'przy',
      'roku',
      'również',
      'sam',
      'są',
      'się',
      'skąd',
      'sobie',
      'sobą',
      'sposób',
      'swoje',
      'ta',
      'tak',
      'taki',
      'tam',
      'te',
      'tego',
      'tej',
      'temu',
      'ten',
      'teraz',
      'też',
      'to',
      'tobą',
      'tobie',
      'toteż',
      'totobą',
      'trzeba',
      'tu',
      'tutaj',
      'twoi',
      'twoja',
      'twoje',
      'twój',
      'twym',
      'ty',
      'tych',
      'tylko',
      'tym',
      'u',
      'w',
      'wam',
      'wami',
      'was',
      'wasi',
      'wasz',
      'wasza',
      'wasze',
      'we',
      'według',
      'wiele',
      'wielu',
      'więc',
      'więcej',
      'wszyscy',
      'wszystkich',
      'wszystkie',
      'wszystkim',
      'wszystko',
      'właśnie',
      'wte',
      'wy',
      'z',
      'za',
      'zapewne',
      'zawsze',
      'ze',
      'zeznowu',
      'znowu',
      'znów',
      'został',
      'żaden',
      'żadna',
      'żadne',
      'żadnych',
      'że',
      'żeby',
    ]),
    articles: /^$/i,
    validSingleLetters: /^[aiwoz]$/i,
    commonPhraseEndings: /^(jest|są|był|była|było|byli|być)$/i,
    invalidStarters: /^(a|i|ale|bo|czy|że|lub|oraz|do|z|w)$/i,
    contractions: new Map([]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['w', 10],
      ['i', 8],
      ['na', 7],
      ['z', 6],
      ['do', 5],
      ['się', 5],
    ]),
    multiWordStops: new Set(['w tym', 'na to', 'z tego']),
  },
  en: {
    stopWords: new Set([
      'a',
      'an',
      'and',
      'are',
      'as',
      'at',
      'be',
      'by',
      'for',
      'from',
      'has',
      'he',
      'in',
      'is',
      'it',
      'its',
      'of',
      'on',
      'that',
      'the',
      'to',
      'was',
      'were',
      'will',
      'with',
      'the',
      'this',
      'but',
      'they',
      'have',
      'had',
      'what',
      'when',
      'where',
      'who',
      'which',
      'why',
      'how',
      'all',
      'any',
      'both',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'no',
      'nor',
      'not',
      'only',
      'own',
      'same',
      'so',
      'than',
      'too',
      'very',
      'can',
      'cannot',
      'could',
      'would',
      'should',
      'may',
      'might',
      'must',
      'need',
      'shall',
      'want',
      'every',
      'if',
      'then',
      'else',
      'thus',
      'into',
      'about',
      'against',
      'between',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'up',
      'down',
      'out',
      'off',
      'over',
      'under',
      'again',
      'further',
      'then',
      'once',
      'here',
      'there',
      'when',
      'where',
      'why',
      'how',
      'any',
      'both',
      'each',
      'few',
      'more',
      'most',
      'other',
      'some',
      'such',
      'click',
      'link',
      'page',
      'site',
      'website',
      'online',
      'email',
      'contact',
      'information',
      'info',
      'details',
      'privacy',
      'policy',
      'terms',
      'conditions',
      'menu',
      'navigation',
      'search',
      'button',
      'submit',
      'form',
      'content',
    ]),
    articles: /^(a|an|the)$/i,
    validSingleLetters: /^[ai]$/i,
    commonPhraseEndings: /^(is|are|was|were|be|been|being)$/i,
    invalidStarters: /^(and|or|but|because|that|if|no|to|of)$/i,
    contractions: new Map([
      ["'s", ' is'],
      ["'d", ' would'],
      ["'ll", ' will'],
      ["'m", ' am'],
      ["'ve", ' have'],
      ["'re", ' are'],
      ["n't", ' not'],
      ["'t", ' not'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['the', 10],
      ['and', 8],
      ['to', 7],
      ['of', 6],
      ['a', 6],
      ['in', 5],
      ['that', 5],
      ['is', 5],
      ['for', 4],
      ['it', 4],
      ['with', 4],
      ['as', 4],
      ['was', 4],
      ['on', 3],
      ['this', 3],
      ['have', 3],
      ['by', 3],
      ['at', 3],
      ['be', 3],
      ['they', 2],
    ]),
    multiWordStops: new Set([
      'in the',
      'of the',
      'to the',
      'on the',
      'for the',
      'at the',
      'in a',
      'to be',
      'as well as',
      'due to',
    ]),
  },
  fr: {
    stopWords: new Set([
      'le',
      'la',
      'les',
      'un',
      'une',
      'des',
      'du',
      'de',
      'à',
      'au',
      'aux',
      'et',
      'ou',
      'mais',
      'donc',
      'car',
      'ce',
      'cet',
      'cette',
      'ces',
      'mon',
      'ton',
      'son',
      'ma',
      'ta',
      'sa',
      'mes',
      'tes',
      'ses',
      'notre',
      'votre',
      'leur',
      'nos',
      'vos',
      'leurs',
      'je',
      'tu',
      'il',
      'elle',
      'nous',
      'vous',
      'ils',
      'elles',
      'en',
      'y',
      'qui',
      'que',
      'quoi',
      'dont',
      'où',
      'quand',
      'comment',
      'pourquoi',
      'quel',
      'quelle',
      'quels',
      'quelles',
      'avec',
      'sans',
      'par',
      'pour',
      'dans',
      'sur',
      'sous',
      'entre',
      'derrière',
      'devant',
      'être',
      'avoir',
      'faire',
      'dire',
      'aller',
      'voir',
      'venir',
      'devoir',
      'vouloir',
      'pouvoir',
      'falloir',
    ]),
    articles: /^(le|la|les|un|une|des)$/i,
    validSingleLetters: /^[ay]$/i,
    commonPhraseEndings: /^(est|sont|était|étaient|être)$/i,
    invalidStarters: /^(et|ou|mais|donc|car|que|si|non|à|de)$/i,
    contractions: new Map([
      ["l'", 'le'],
      ["d'", 'de'],
      ["j'", 'je'],
      ["m'", 'me'],
      ["t'", 'te'],
      ["s'", 'se'],
      ["n'", 'ne'],
      ["c'", 'ce'],
      ["qu'", 'que'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['de', 10],
      ['la', 8],
      ['le', 7],
      ['et', 6],
      ['un', 5],
    ]),
    multiWordStops: new Set(['de la', 'le le', 'et le']),
  },
  de: {
    stopWords: new Set([
      'der',
      'die',
      'das',
      'den',
      'dem',
      'des',
      'ein',
      'eine',
      'einer',
      'eines',
      'einem',
      'einen',
      'und',
      'oder',
      'aber',
      'wenn',
      'weil',
      'dass',
      'daß',
      'ob',
      'seit',
      'von',
      'aus',
      'nach',
      'bei',
      'seit',
      'zum',
      'zur',
      'zum',
      'ich',
      'du',
      'er',
      'sie',
      'es',
      'wir',
      'ihr',
      'sie',
      'mein',
      'dein',
      'sein',
      'unser',
      'euer',
      'ihr',
      'nicht',
      'nur',
      'noch',
      'schon',
      'auch',
      'bis',
      'gegen',
      'durch',
      'um',
      'am',
      'im',
      'in',
      'auf',
      'zu',
      'zur',
      'für',
      'mit',
      'bei',
      'seit',
      'vor',
      'nach',
      'während',
      'durch',
      'über',
    ]),
    articles: /^(der|die|das|den|dem|des|ein|eine|einer|eines|einem|einen)$/i,
    validSingleLetters: /^[a]$/i,
    commonPhraseEndings: /^(ist|sind|war|waren|sein)$/i,
    invalidStarters: /^(und|oder|aber|wenn|weil|dass|ob|von|zu)$/i,
    contractions: new Map([
      ["'s", ' ist'],
      ["'m", ' bin'],
      ["'re", ' sind'],
      ["'t", ' nicht'],
      ["'ll", ' werden'],
      ["'d", ' würde'],
    ]),
    compoundWordChars: /-/g,
    wordFrequencies: new Map([
      ['der', 10],
      ['die', 8],
      ['und', 7],
      ['ein', 6],
      ['von', 5],
    ]),
    multiWordStops: new Set(['der die', 'und der', 'ein von']),
  },
};

interface ExtractedContent {
  title: string;
  headings: string[];
  body: string;
}

function extractHtmlContent(text: string): ExtractedContent {
  const titleMatch = text.match(/<title[^>]*>(.*?)<\/title>/i);
  const headingsMatch = text.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi);

  return {
    title: titleMatch ? titleMatch[1] : '',
    headings: headingsMatch ? headingsMatch.map((h) => h.replace(/<[^>]+>/g, '')) : [],
    body: text
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  };
}

function detectLanguage(text: string): { language: string; confidence: number } {
  const scores: { [key: string]: number } = {
    es: 0,
    it: 0,
    pt: 0,
    nl: 0,
    pl: 0,
    fr: 0,
    de: 0,
    en: 0,
  };

  const spanishPatterns = /[áéíóúñ¿¡]/gi;
  const italianPatterns = /[àèéìòù]/gi;
  const portuguesePatterns = /[ãõçáéíóúâêôàü]/gi;
  const dutchPatterns = /\bij\b|ij[a-z]/gi;
  const polishPatterns = /[ąćęłńóśźż]/gi;
  const frenchPatterns = /[éèêëàâçîïôûùüÿœæ]/gi;
  const germanPatterns = /[äöüß]/gi;
  const englishPatterns = /['']s\b|n['']t\b|['']ve\b|['']re\b|['']ll\b|['']d\b|ing\b|ed\b/gi;

  scores.es += (text.match(spanishPatterns) || []).length * 2;
  scores.it += (text.match(italianPatterns) || []).length * 2;
  scores.pt += (text.match(portuguesePatterns) || []).length * 2;
  scores.nl += (text.match(dutchPatterns) || []).length * 2;
  scores.pl += (text.match(polishPatterns) || []).length * 2;
  scores.fr += (text.match(frenchPatterns) || []).length * 2;
  scores.de += (text.match(germanPatterns) || []).length * 2;
  scores.en += (text.match(englishPatterns) || []).length * 1.5;

  const words = text.toLowerCase().split(/\s+/);
  words.forEach((word) => {
    Object.entries(LANGUAGE_RULES).forEach(([lang, rules]) => {
      if (rules.wordFrequencies.has(word)) {
        scores[lang] += rules.wordFrequencies.get(word)! * 1.5;
      }
    });
  });

  const hasSpecialChars = /[áéíóúñ¿¡àèéìòùãõçâêôąćęłńóśźżéèêëàâçîïôûùüÿœæäöüß]/gi.test(text);
  if (!hasSpecialChars) {
    scores.en += words.length * 0.5;
  }

  const [[language, maxScore]] = Object.entries(scores).sort(([, a], [, b]) => b - a);

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.25;

  return { language, confidence };
}

function normalizeText(text: string, language: string, caseSensitive: boolean = false): string {
  const rules = LANGUAGE_RULES[language];
  let normalized = caseSensitive ? text.normalize('NFD') : text.toLowerCase().normalize('NFD');

  rules.contractions.forEach((full, contraction) => {
    const regex = new RegExp(contraction, caseSensitive ? 'g' : 'gi');
    normalized = normalized.replace(regex, full);
  });

  if (language === 'de') {
    normalized = normalized.replace(rules.compoundWordChars, '');
  }

  return normalized;
}

function tokenizeText(
  text: string,
  caseSensitive: boolean = false,
  keepStopWords: boolean = false
): string[] {
  const { language } = detectLanguage(text);
  const rules = LANGUAGE_RULES[language];

  const normalizedText = normalizeText(text, language, caseSensitive);

  const words = normalizedText
    .replace(/[¿¡""]/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/(?<![a-z0-9])[-.,:;'"()[\]{}]+|[-.,:;'"()[\]{}]+(?![a-z0-9])/g, ' ')
    .replace(/[\s\u00A0\u200B]+/g, ' ')
    .trim()
    .split(/\s+/);

  if (keepStopWords) {
    return words.filter((word) => {
      if (word.length < MIN_WORD_LENGTH || word.length > MAX_PHRASE_LENGTH || /^\d+$/.test(word)) {
        return false;
      }
      return true;
    });
  }

  return words.filter((word) => {
    const compareWord = caseSensitive ? word : word.toLowerCase();

    if (word.length < MIN_WORD_LENGTH || word.length > MAX_PHRASE_LENGTH || /^\d+$/.test(word)) {
      return false;
    }

    if (word.length === 1) {
      return rules.validSingleLetters.test(compareWord);
    }

    return !rules.stopWords.has(compareWord) || word.length > 3;
  });
}

function extractNGrams(words: string[], groupSize: number): { [key: string]: number } {
  const ngrams: { [key: string]: number } = {};

  if (groupSize < 1 || words.length === 0) {
    return ngrams;
  }

  for (let i = 0; i < words.length; i += CHUNK_SIZE) {
    const chunk = words.slice(i, Math.min(i + CHUNK_SIZE, words.length));

    for (let j = 0; j <= chunk.length - groupSize; j++) {
      const phraseWords = chunk.slice(j, j + groupSize);
      const phrase = phraseWords.join(' ');
      ngrams[phrase] = (ngrams[phrase] || 0) + 1;
    }
  }

  return ngrams;
}

function filterInvalidNGrams(
  ngrams: { [key: string]: number },
  groupSize: number,
  language: string,
  caseSensitive: boolean = false
): { [key: string]: number } {
  const rules = LANGUAGE_RULES[language] || LANGUAGE_RULES.en;
  const filtered: { [key: string]: number } = {};

  for (const [phrase, count] of Object.entries(ngrams)) {
    const words = phrase.split(' ');

    if (words.length !== groupSize) {
      continue;
    }

    let isValid = true;

    if (groupSize === 1) {
      const word = words[0];
      const compareWord = caseSensitive ? word : word.toLowerCase();

      if (rules.stopWords.has(compareWord) && word.length <= 3) {
        isValid = false;
      }

      if (word.length === 1 && !rules.validSingleLetters.test(compareWord)) {
        isValid = false;
      }
    } else {
      const allStopWords = words.every((w) => {
        const compareWord = caseSensitive ? w : w.toLowerCase();
        return rules.stopWords.has(compareWord);
      });

      if (allStopWords) {
        isValid = false;
      }

      for (let i = 0; i < words.length - 1; i++) {
        const currentWord = caseSensitive ? words[i] : words[i].toLowerCase();
        const nextWord = caseSensitive ? words[i + 1] : words[i + 1].toLowerCase();

        if (rules.stopWords.has(currentWord) && rules.stopWords.has(nextWord)) {
          isValid = false;
          break;
        }

        if (i === 0 && rules.invalidStarters.test(currentWord)) {
          isValid = false;
          break;
        }

        if (i === words.length - 2 && rules.commonPhraseEndings.test(nextWord)) {
          isValid = false;
          break;
        }

        if (currentWord === nextWord) {
          isValid = false;
          break;
        }

        if (rules.articles.test(currentWord) && rules.articles.test(nextWord)) {
          isValid = false;
          break;
        }
      }

      const phraseKey = caseSensitive ? phrase : phrase.toLowerCase();
      if (rules.multiWordStops.has(phraseKey)) {
        isValid = false;
      }
    }

    if (isValid) {
      filtered[phrase] = count;
    }
  }

  return filtered;
}

function validateInput(text: string, options: AnalyzeOptions): void {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new WordsError(
      'TEXT_ANALYSIS_ERROR',
      `Input text is too large (max ${MAX_TEXT_LENGTH} characters)`
    );
  }
  if (options.groupSize < 1 || options.groupSize > 5) {
    throw new WordsError('TEXT_ANALYSIS_ERROR', 'Group size must be between 1 and 5');
  }
  if (options.minCount <= 0) {
    throw new WordsError('TEXT_ANALYSIS_ERROR', 'Minimum count must be greater than 0');
  }
}

export function analyzeText(
  text: string,
  options: AnalyzeOptions,
  textHtmlRatio: number
): WordAnalysisResult {
  try {
    if (!text || text.trim().length === 0) {
      return {
        words: [],
        totalWords: 0,
        uniqueWords: 0,
        avgWordLength: 0,
        readingTime: 0,
        textHtmlRatio,
      };
    }

    validateInput(text, options);

    const { body } = extractHtmlContent(text);

    const { language } = detectLanguage(body);

    const allWords = tokenizeText(body, options.caseSensitive, true);

    if (allWords.length === 0) {
      return {
        words: [],
        totalWords: 0,
        uniqueWords: 0,
        avgWordLength: 0,
        readingTime: 0,
        textHtmlRatio,
      };
    }

    const totalWords = allWords.length;
    const avgWordLength = allWords.reduce((sum, word) => sum + word.length, 0) / totalWords;
    const readingTime = Math.ceil(totalWords / 200);

    const allNGrams = extractNGrams(allWords, options.groupSize);

    const validNGrams = filterInvalidNGrams(
      allNGrams,
      options.groupSize,
      language,
      options.caseSensitive
    );

    const wordsForUniqueCount = tokenizeText(body, options.caseSensitive, false);
    const uniqueWords = new Set(wordsForUniqueCount).size;

    const totalPossibleNGrams = Math.max(1, totalWords - options.groupSize + 1);

    const wordCounts: WordCount[] = Object.entries(validNGrams)
      .filter(([_, count]) => count >= options.minCount)
      .map(([text, count]) => ({
        text,
        count,
        density: Number(((count / totalPossibleNGrams) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count);

    return {
      words: wordCounts,
      totalWords,
      uniqueWords,
      avgWordLength: Number(avgWordLength.toFixed(2)),
      readingTime,
      textHtmlRatio,
    };
  } catch (error) {
    if (error instanceof WordsError) {
      throw error;
    }
    throw new WordsError(
      'TEXT_ANALYSIS_ERROR',
      'Failed to analyze text: ' + (error as Error).message
    );
  }
}
