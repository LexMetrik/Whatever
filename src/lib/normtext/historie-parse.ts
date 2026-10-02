// ─── G-HIST · Artikel-genaue In-Kraft-/Änderungshistorie aus Fussnoten-Prosa ──
//
// Infonutzungs-Recherche 17.7.2026 (bibliothek/normen/informations-nutzung-
// gesetze-2026-07-17.md, Kandidat G-HIST): Das konsolidierte Fedlex-XML trägt
// KEINE strukturierte Ereignis-Historie (`<lifecycle>`/`<temporalGroup>` fehlen).
// Die ARTIKEL-genauen In-Kraft-/Aufhebungs-Daten stehen ausschliesslich als
// Fussnoten-Prosa in `<authorialNote>` — «Eingefügt durch …, in Kraft seit 1.
// Juli 1991» / «Fassung gemäss …, in Kraft seit …» / «Aufgehoben durch …, mit
// Wirkung seit …». Diese Prosa speichern wir bereits (fussnoten-extrahiere.ts,
// 227/227 Struktur-Sidecars); dieser Parser leitet daraus deterministisch eine
// strukturierte Per-Artikel-Timeline ab.
//
// §2-Determinismus: reine Regex-/Grammatik-Extraktion, KEINE Heuristik-Raterei,
// KEIN `new Date(string)` (Zeitzonen-Falle, CLAUDE-Lektion — nur lokale ISO-
// Strings). §8-Ehrlichkeit: was nicht sicher parsebar ist, kommt als `unparsed`-
// Residuum mit Roh-Text zurück — NIE stilles Weglassen, NIE erfundene Daten.
// §5-EIN-Ort: Datums- und Token-Kanonisierung werden aus dem bestehenden
// Revisions-Extrakt WIEDERVERWENDET (nicht neu implementiert).
//
// Reine, testbare Datenschicht: dieselben Funktionen speisen den Build-Generator
// (scripts/normtext/historie-generieren.ts) UND die Unit-Tests.

import { parseDeutschesRevisionsdatum } from '../verzahnung/revisionen-extrakt';

/** Fundstelle (AS/BBl-Label + amtlicher ELI-Deep-Link), wie im Sidecar gespeichert. */
interface FnLink {
  label: string;
  url: string;
}

/** Fussnote, soweit für den Historie-Parser relevant (Teilmenge des Sidecar-Schemas). */
export interface FnEingang {
  nr?: string;
  text?: string;
  links?: FnLink[];
  absatz?: string | null;
  item?: string | null;
  /** Anker-Ort (Sidecar, fussnoten-extrahiere.ts A31a): gesetzt, wenn der Marker in
   *  einem absatzlosen KÖRPER-Block steht (z. B. «2–3 …», Ziffer «1.» ohne Absatz-
   *  <sup>) — also NICHT im Artikelkopf (<h6>: Nummer/Sachüberschrift). */
  absatzIndex?: number | null;
  /** Wortgenaue Marker-Position (fussnoten-offsets.ts) — wird NUR für Marker im
   *  Artikel-KÖRPER berechnet (Zuschnitt ohne Kopf-<h6>); gesetzt ⇒ Körper-Anker. */
  pos?: unknown;
  /** Gesetzt, wenn die Fussnote an einem GLIEDERUNGS-Titel vor dem Artikel hängt
   *  («section-heading-footnote», fussnoten-extrahiere.ts) — nicht am Artikel selbst. */
  sektion?: string | null;
}

/** Ereignistyp einer amtlichen Änderungs-Fussnote. */
export type HistorieTyp =
  | 'eingefuegt' // «Eingefügt durch …»
  | 'fassung' // «Fassung gemäss/des …» (Neufassung)
  | 'aufgehoben' // «Aufgehoben durch/in …, mit Wirkung seit …»
  | 'gegenstandslos' // «Gegenstandslos [gemäss …, mit Wirkung seit …]» — EIGENE Kategorie, nie «aufgehoben» (§1)
  | 'ausdruck' // «Ausdruck gemäss …» (Begriff im ganzen Text ersetzt)
  | 'bezeichnung' // «Bezeichnung gemäss …» / «Die Bezeichnung …»
  | 'angenommen' // «Angenommen in der Volksabstimmung vom …» (BV)
  | 'betrag' // «Betrag/Beträge gemäss …» (angepasster Geldbetrag)
  | 'nummerierung' // «Nummerierung gemäss …» / «Neu nummeriert …»
  | 'bereinigt' // «Bereinigt gemäss/durch …»
  | 'berichtigt' // «Berichtigt durch/von … / Berichtigung …» (Redaktionskorrektur)
  | 'inkraft' // datierte In-Kraft-Klausel OHNE erkennbaren Änderungs-Verb-Kopf
  | 'urspruenglich'; // «Ursprünglich Art. X» (Ur-Nummerierung, undatiert)

/** Ein strukturiertes Historie-Ereignis (aus genau einem Prosa-Segment). */
export interface HistorieEreignis {
  typ: HistorieTyp;
  /** ISO «YYYY-MM-DD» des In-Kraft-/Wirkungs-Datums; null, wenn im Segment keins steht. */
  datum: string | null;
  /** true = «mit Wirkung seit» (Aufhebung), false = «in Kraft seit». */
  wirkung: boolean;
  /** AS-/BBl-Fundstellen des Segments (Label + amtlicher Link, aus den Fussnoten-Links aufgelöst). */
  quellen: FnLink[];
  /** Skopus der Quell-Fussnote: Absatz-Nr bzw. null = Artikelebene. */
  absatz: string | null;
  /** Skopus der Quell-Fussnote: lit./Ziff.-Marke innerhalb des Absatzes bzw. null. */
  item: string | null;
  /** NUR bei typ 'urspruenglich' (P7 #11): die ALTE Bezeichnung im Wortlaut der Fussnote («Art. 29bis», «Bst. cbis, dann cter»,
   *  «vor Art. 56»). Fehlt, wenn die Fussnote nach «Ursprünglich» nichts nennt. Ein Datum gehört NICHT dazu — die
   *  Fussnote datiert nur das folgende Ereignis, nie die Ur-Bezeichnung (§7). */
  frueher?: string;
}

/** Klassifikation + Ergebnis EINER Fussnote. */
export interface FussnoteHistorie {
  /** 'ereignis' = ≥1 Historie-Ereignis; 'referenz' = Nicht-Ereignis (SR-/Siehe-/
   *  redaktioneller Verweis); 'unparsed' = Residuum (§8, Roh-Text erhalten). */
  klasse: 'ereignis' | 'referenz' | 'unparsed';
  ereignisse: HistorieEreignis[];
  /** nur bei klasse='unparsed': normalisierter Roh-Text (nie stilles Weglassen). */
  roh?: string;
}

// ── Bausteine der Grammatik (empirisch am 227-Erlass-Korpus kalibriert, 17.7.) ──

// Swiss-Datum «1. Jan. 2017» / «1. Januar 2017» — Tag, Monat(-Abk.), Jahr.
const DATUM_RE = /(\d{1,2})\.\s*([A-Za-zäöü]+)\.?\s*(\d{4})/;

// In-Kraft-/Wirkungs-Klausel-Kopf, tolerant gegen belegte Fedlex-Tippfehler:
// «in Kraft seit», «mit Wirkung seit», «in Kraft» (ohne «seit»), «Kraft seit»
// (ohne «in»), Doppel-«seit seit» (BVG 34a), «seit.» (AVIV 99), «seit dem».
const TRIGGER_RE = /(in Kraft|mit Wirkung)\s+(?:seit\.?\s+)?(?:seit\s+)?(?:dem\s+)?|Kraft\s+seit\.?\s+/gi;
// Wie weit hinter dem Trigger das Datum noch als «zu dieser Klausel gehörig» gilt.
const DATUM_FENSTER = 30;

// Änderungs-Verb-Köpfe (Segment-Anker). Reihenfolge = Klassifikations-Priorität
// innerhalb eines Segments. Muster am Segment-ANFANG geankert (`^`-Semantik über
// verbAmAnfang), zusätzlich die belegten mittelständigen Klein-Formen
// («… eingefügt durch», «… aufgehoben durch»).
const VERBEN: ReadonlyArray<readonly [HistorieTyp, RegExp]> = [
  ['aufgehoben', /^(?:Aufgehoben (?:durch|in|gemäss)|aufgehoben durch)/],
  // W2·27-BUND-FERTIG (1.10.2026): «Gegenstandslos gemäss Ziff. IV 1 …, mit Wirkung seit 1. Jan. 2018» (StGB 67f),
  // «Gegenstandslos.» (OR SchlT 6). Nur das GANZE Wort am Segment-Anfang — dieselbe Regel wie
  // `fussnoteGegenstandslos` (scripts/normtext/aufhebung-signal.ts): «Gegenstandslose UeB.», «Dritter Satz
  // gegenstandslos», «… ist heute gegenstandslos» sind Teil-Skopus und bleiben ausserhalb.
  ['gegenstandslos', /^Gegenstandslos(?=[\s.,;:]|$)/],
  ['eingefuegt', /^(?:Eingefügt (?:durch|Ziff)|eingefügt (?:durch|Ziff))/],
  ['fassung', /^Fassung (?:gemäss|des|von|dieser|dieses|zweiter|erster|Abs)/],
  ['ausdruck', /^Ausdruck gemäss/],
  ['bezeichnung', /^(?:Bezeichnung gemäss|Die Bezeichnung)/],
  ['angenommen', /^Angenommen in/],
  ['nummerierung', /^(?:Nummerierung gemäss|Neu nummeriert)/],
  ['bereinigt', /^Bereinigt (?:gemäss|durch)/],
  ['betrag', /^(?:Betrag|Beträge|Haftungshöchstbetrag) gemäss/],
  ['berichtigt', /^(?:Berichtigt (?:durch|von|gemäss)|Berichtigung (?:vom|gemäss|von|der))/],
  ['urspruenglich', /^Ursprünglich/],
];
// Vereinigung aller Verb-Köpfe → findet die Segment-Grenzen im Fussnotentext.
const VERB_ANKER = new RegExp(
  VERBEN.map(([, rx]) => `(?:${rx.source.replace(/^\^/, '')})`).join('|'),
  'g',
);

// Nicht-Ereignis-Fussnoten (reine Verweise / redaktionelle Notizen): kein
// Änderungs-Verb-Kopf UND keine datierte In-Kraft-Klausel. Bewusst konservativ —
// diese Prüfung läuft NACH Verb- und Datums-Erkennung, kann also nie ein echtes
// Ereignis verschlucken.
const REFERENZ_RE = new RegExp(
  '^(?:' +
    [
      'SR\\s',
      'Siehe\\b',
      '\\[',
      'AS\\s',
      'BBl\\s',
      'BRB vom',
      'Heute\\b',
      'Verordnung \\(E',
      'Richtlinie \\(E',
      'Der (?:CRE|MAR|CAP|LEX|Titel|Ausdruck|Verweis|Begriff)',
      'Die (?:Verweise|Änderung|Änderungen|Berichtigung|Vereinbarung|Abk)',
      'Diese (?:Änd|Abk|Abkommen)',
      'Das Dokument',
      'Amtliche',
      'Mit Übergangsbestimmung',
      'Für die',
      'Im \\w+ (?:Text|Sinne)',
      'Im Sinne',
      'www\\.',
      'https?:',
      'Dieser Artikel',
      'Weil es sich',
      'Infolge',
      'Noch nicht',
      'Tritt (?:in|nach|zu)',
      'Fassung nie',
      'Gemäss Ziff',
      'Nicht\\b',
      'Gilt\\b',
      'Vgl\\.',
      'Redaktionell',
      'Seit dem',
      'DE:',
      'Begriff:',
      'Österreich',
      'Hinsichtlich',
      'Da die',
      'Strafdrohungen',
      'Nummerierung dieses',
    ].join('|') +
    ')',
);

/** <b>/<i>-Auszeichnungen und Mehrfach-Whitespace entfernen (Vergleichs-Normalform). */
function normalisiere(text: string): string {
  return text
    .replace(/<\/?[bi]>/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Ersten passenden Verb-Kopf eines Segments bestimmen (Prioritäts-Reihenfolge). */
function verbTyp(segment: string): HistorieTyp | null {
  for (const [typ, rx] of VERBEN) {
    if (rx.test(segment)) return typ;
  }
  return null;
}

/** AS-/BBl-Citation-Strings im Segment (Reihenfolge = Vorkommen). Beispiel:
 *  «AS 2016 4651», «BBl 2014 1001» (auch mehrteilige BBl-Bände «BBl 1967 II 241»). */
const CITATION_RE = /\b(AS|BBl)\s+(\d{4}(?:\s+(?:[IVX]+|\d+))+)/g;

/** Tag-freies Label eines Fussnoten-Links (für den Abgleich Segment↔Link). */
function labelNormal(label: string): string {
  return label.replace(/<\/?[bi]>/gi, '').replace(/\s+/g, ' ').trim();
}

/**
 * Fundstellen eines Segments: die im Segment-Text zitierten AS/BBl-Strings, je
 * mit aufgelöstem amtlichem Link aus der Fussnoten-Link-Liste (Abgleich über das
 * tag-freie Label). Nicht auflösbare Zitate behalten ihr Label mit leerem Link
 * (§8 — Fundstelle nie verschweigen).
 */
function quellenAusSegment(segment: string, links: ReadonlyArray<FnLink>): FnLink[] {
  const quellen: FnLink[] = [];
  const gesehen = new Set<string>();
  let m: RegExpExecArray | null;
  CITATION_RE.lastIndex = 0;
  while ((m = CITATION_RE.exec(segment)) !== null) {
    const label = `${m[1]} ${m[2].replace(/\s+/g, ' ')}`.trim();
    if (gesehen.has(label)) continue;
    gesehen.add(label);
    const treffer = links.find((l) => labelNormal(l.label) === label);
    quellen.push({ label, url: treffer?.url ?? '' });
  }
  return quellen;
}

/**
 * W3-11 (W2·27-BUND-FERTIG, 30.9.2026): «Berichtigt von der Redaktionskommission der BVers
 * (Art. 33 GVG – AS 1974 1051)» nennt die RECHTSGRUNDLAGE der Berichtigung samt deren Fundstelle,
 * nicht die Fundstelle der Berichtigung (die Fussnote nennt keine). oc/1974/1051_1051_1051 ist
 * «Geschäftsverkehrsgesetz, Änderung» (SPARQL 30.9.2026; ausser Kraft 2003-12-01), Art. 58 ParlG
 * (SR 171.10) seine heutige Entsprechung — dieselbe Fussnotenform schreibt dort «(Art. 58 Abs. 1
 * ParlG; SR 171.10)» und lieferte nie eine Quelle. 10 Ereignisse trugen «AS 1974 1051» als Quelle
 * der Berichtigung (ATSG 47, AVIG 43a, BETMG 17, DESG 36, OR 328/336c/685d/716a, STG 29, STGB
 * 305bis). Eng: nur die Klammer «(Art. N [Abs. M] GVG|ParlG – AS …)» (runde oder eckige Klammer);
 * jede andere Fundstelle im Segment bleibt Quelle.
 */
const RECHTSGRUNDLAGE_RE = /[([]\s*Art\.\s*\d+[a-z]*(?:\s+Abs\.\s*\d+)?\s+(?:GVG|ParlG)\s*[–—;,-]\s*AS\b[^()[\]]*[)\]]/g;

/** «Ursprünglich» als GANZES Wort am Segment-Anfang (nicht «Ursprünglicher Abs. 3 …»); Doppelpunkt optional. */
const URSPRUNG_KOPF_RE = /^Ursprünglich(?::|(?=\s|$))/;

/**
 * P7 #11 (1.10.2026): Ur-Bezeichnung eines «Ursprünglich»-Segments. `kopf` = der Teil, der zur Ur-Bezeichnung gehört —
 * bis zum ersten «;»: «Ursprünglich Tit. vor Art. 27; hierher versetzt gemäss …, in Kraft seit 1. Jan. 1966 (AS …)»
 * (AHVV 28/31) datiert die VERSETZUNG, nicht die Ur-Bezeichnung; Datum und Fundstelle daraus würden ihr fälschlich
 * zugeschrieben (§7). `frueher` = der Wortlaut hinter «Ursprünglich[:]» ohne Schlusspunkt und ohne Klammer-Fundstellen
 * («(AS 2005 5257)» bleibt Quelle, nicht Text); null, wenn dort nichts steht oder das Wort nicht «Ursprünglich» ist.
 */
function ursprungAusSegment(segment: string): { kopf: string; frueher: string | null } {
  const kopf = segment.split(';')[0];
  if (!URSPRUNG_KOPF_RE.test(kopf)) return { kopf, frueher: null };
  const text = kopf
    .replace(URSPRUNG_KOPF_RE, '')
    .replace(/\s*\((?:AS|BBl)\b[^)]*\)/g, '')
    .trim();
  // Satz-Punkt weg, Abkürzungs-Punkt bleibt («3. Kap.», «2. Abschn.», «Tit.»): an der Ur-Bezeichnung ist ein
  // Schluss-Punkt nach einer dieser Abkürzungen Teil des Wortes, sonst endet damit der Satz.
  const frueher = /\b(?:Abschn|Kap|Tit|Art|Abs|Bst|Ziff|Anh|Abt)\.$/.test(text) ? text : text.replace(/\.+$/, '').trim();
  return { kopf, frueher: frueher || null };
}

/** Datiertes In-Kraft-/Wirkungs-Ergebnis eines Segments: {datum,wirkung} oder null. */
function datumAusSegment(segment: string): { datum: string | null; wirkung: boolean } | null {
  TRIGGER_RE.lastIndex = 0;
  const tm = TRIGGER_RE.exec(segment);
  if (!tm) return null;
  const nach = tm.index + tm[0].length;
  const rest = segment.slice(nach, nach + DATUM_FENSTER);
  const dm = DATUM_RE.exec(rest);
  const datum = dm ? parseDeutschesRevisionsdatum(dm[1], dm[2], dm[3]) : null;
  const wirkung = /Wirkung/.test(segment.slice(Math.max(0, tm.index - 14), tm.index + tm[0].length + 2));
  return { datum, wirkung };
}

/**
 * Eine Fussnote → Klassifikation + Ereignisliste (§2 deterministisch, §8 ehrlich).
 *
 * Reihenfolge (jede Stufe kann eine echte Historie nur GEWINNEN, nie verlieren):
 *  1. Verb-verankerte Segmente → typisierte Ereignisse (Mehrfach-Ereignisse je Fussnote).
 *  2. sonst: datierte In-Kraft-Klausel ohne Verb-Kopf → generisches `inkraft`-Ereignis.
 *  3. sonst: reiner Verweis / redaktionelle Notiz → 'referenz'.
 *  4. sonst: 'unparsed' (Roh-Text erhalten).
 */
export function parseFussnoteHistorie(fn: FnEingang): FussnoteHistorie {
  // P7 #53 (1.10.2026): «Aufgehobn durch …» ist der amtliche Fedlex-Tippfehler von BKV Art. 8 («mit Wirkung seit 1. Jan.
  // 2016»; Filestore BKV 20260101) — nur am TEXT-ANFANG und nur exakt dieses Wort mit folgendem «durch» (Mitte-Satz-Formen
  // bleiben unerkannt, wie in `fussnoteHebtAuf`). Bis dahin lief die Fussnote über den generischen In-Kraft-Fall: die
  // Historie zeigte «Gilt seit 2016», der Normtext «Aufgehoben». Die Grammatik bleibt EINE Quelle (§5).
  const text = normalisiere(fn.text ?? '').replace(/^Aufgehobn durch(?=\s)/, 'Aufgehoben durch');
  const links = fn.links ?? [];
  const absatz = fn.absatz ?? null;
  const item = fn.item ?? null;

  // 1) Verb-Anker finden → Segmentgrenzen.
  VERB_ANKER.lastIndex = 0;
  const anker: number[] = [];
  let am: RegExpExecArray | null;
  while ((am = VERB_ANKER.exec(text)) !== null) {
    anker.push(am.index);
    if (VERB_ANKER.lastIndex === am.index) VERB_ANKER.lastIndex++; // Leer-Match-Schutz
  }
  const einzigartig = [...new Set(anker)].sort((a, b) => a - b);
  const ereignisse: HistorieEreignis[] = [];
  if (einzigartig.length > 0) {
    const grenzen = [...einzigartig, text.length];
    for (let i = 0; i < einzigartig.length; i++) {
      const segment = text.slice(einzigartig[i], grenzen[i + 1]);
      const typ = verbTyp(segment);
      if (!typ) continue;
      const ur = typ === 'urspruenglich' ? ursprungAusSegment(segment) : null;
      const rumpf = ur ? ur.kopf : segment; // Datum/Fundstellen: bei «Ursprünglich» nur der Ur-Teil (s. ursprungAusSegment)
      const dat = datumAusSegment(rumpf);
      ereignisse.push({
        typ,
        datum: dat?.datum ?? null,
        wirkung: dat?.wirkung ?? false,
        quellen: quellenAusSegment(typ === 'berichtigt' ? rumpf.replace(RECHTSGRUNDLAGE_RE, ' ') : rumpf, links),
        absatz,
        item,
        ...(ur?.frueher ? { frueher: ur.frueher } : {}),
      });
    }
    if (ereignisse.length > 0) return { klasse: 'ereignis', ereignisse };
  }

  // 2) Datierte Klausel ohne Verb-Kopf → generisches Ereignis.
  const nurDatum = datumAusSegment(text);
  if (nurDatum && nurDatum.datum) {
    return {
      klasse: 'ereignis',
      ereignisse: [
        {
          typ: 'inkraft',
          datum: nurDatum.datum,
          wirkung: nurDatum.wirkung,
          quellen: quellenAusSegment(text, links),
          absatz,
          item,
        },
      ],
    };
  }

  // 3) Reiner Verweis / redaktionelle Notiz.
  if (REFERENZ_RE.test(text)) return { klasse: 'referenz', ereignisse: [] };

  // 4) Residuum — Roh-Text erhalten (§8).
  return { klasse: 'unparsed', ereignisse: [], roh: text };
}

/** Ereignis-Typen, die den «giltSeit»-Stand eines Artikels vorrücken (Text-treffend). */
const GILT_TYPEN: ReadonlySet<HistorieTyp> = new Set<HistorieTyp>([
  'eingefuegt', 'fassung', 'ausdruck', 'bezeichnung', 'angenommen', 'betrag', 'nummerierung', 'bereinigt', 'inkraft',
]);

/** Per-Artikel-Projektion. */
export interface ArtikelHistorie {
  /** Jüngstes datiertes Textänderungs-Ereignis (Absatz- ODER Artikelebene); null = kein
   *  datierter Beleg → Konsument fällt auf das Erlass-Ur-Inkrafttreten zurück (inkrafttreten.json). */
  giltSeit: string | null;
  /** Nur wenn der GANZE Artikel aufgehoben ist (Aufhebungs-Fussnote auf Artikelebene): ISO-Wirkungsdatum. */
  aufgehobenSeit?: string;
  /** Nur wenn der GANZE Artikel amtlich «gegenstandslos» ist (Vermerk auf Artikelebene, StGB 67f, OR SchlT 6).
   *  EIGENE Kategorie neben `aufgehobenSeit` (§1: nicht durch Aufhebungsakt gestrichen). `seit` = ISO-Wirkungsdatum
   *  aus der amtlichen Klausel, `null` = Fedlex nennt keins (nie geschätzt, §2). Deckt sich mit
   *  `NormSnapshot.gegenstandslos` (W2·27, #1183) — Test `normtext-historie-gegenstandslos`. */
  gegenstandslos?: { seit: string | null };
  /** Alle Ereignisse in amtlicher Dokumentreihenfolge (Fedlex: ältester Eingriff je Fussnote zuerst). */
  ereignisse: HistorieEreignis[];
}

/**
 * Alle Fussnoten eines Artikels → Per-Artikel-Historie. Die Ereignisse behalten
 * die DOKUMENTREIHENFOLGE der Quelle: Fedlex listet die Änderungshinweise EINER
 * Fussnote amtlich chronologisch (ältester Eingriff zuerst) — «Eingefügt durch …
 * (2004). Fassung gemäss …, in Kraft seit … (2017)». Diese authoritative Ordnung
 * bleibt erhalten (kein Date-Sort, der undatierte Einfüge-Ereignisse ans Ende
 * verschöbe und die Chronologie invertierte). «giltSeit»/«aufgehobenSeit» werden
 * unabhängig als Maximum über die datierten Ereignisse abgeleitet.
 */
export function baueArtikelHistorie(
  fussnoten: ReadonlyArray<FnEingang> | undefined,
  opts: {
    /** true = der Text-Shard (amtliche konsolidierte Fassung) trägt lebenden
     *  Normtext im Artikel-KÖRPER (Kriterium: scripts/normtext/historie-
     *  aufgehoben-lebend.ts). undefined = unbekannt (kein Text-Eintrag). */
    koerperLebend?: boolean;
    /** true = der Text-Shard führt den Artikel amtlich als aufgehoben (`NormSnapshot.aufgehoben`, aufhebung-
     *  signal.ts). Dann trägt die Historie KEIN «Gilt seit» (P7 #53), es sei denn sie nennt selbst das datierte
     *  `aufgehobenSeit`. undefined/false = unverändert. */
    snapshotAufgehoben?: boolean;
  } = {},
): { historie: ArtikelHistorie | null; unparsed: FnEingang[]; refCount: number; ereignisFnCount: number } {
  const ereignisse: HistorieEreignis[] = [];
  const unparsed: FnEingang[] = [];
  let refCount = 0;
  let ereignisFnCount = 0;
  for (const fn of fussnoten ?? []) {
    const res = parseFussnoteHistorie(fn);
    if (res.klasse === 'ereignis') { ereignisse.push(...res.ereignisse); ereignisFnCount++; }
    else if (res.klasse === 'referenz') refCount++;
    else unparsed.push(fn);
  }
  if (ereignisse.length === 0) return { historie: null, unparsed, refCount, ereignisFnCount };

  // Dokumentreihenfolge bleibt erhalten (siehe Funktions-Doc). «giltSeit»/
  // «aufgehobenSeit» als Maximum über die datierten Ereignisse ableiten.
  let giltSeit: string | null = null;
  let aufgehobenSeit: string | undefined;
  for (const e of ereignisse) {
    if (e.datum && GILT_TYPEN.has(e.typ)) {
      if (!giltSeit || e.datum > giltSeit) giltSeit = e.datum;
    }
  }
  // Ganz-Artikel-Aufhebung (RL-11, Befund R2-01): nur Aufhebungs-Ereignisse aus
  // Fussnoten, deren Marker im Artikelkopf steht und deren Prosa keinen Teil-Skopus
  // nennt (artikelAufhebungMoeglich).
  for (const fn of fussnoten ?? []) {
    if (!artikelAufhebungMoeglich(fn)) continue;
    for (const e of parseFussnoteHistorie(fn).ereignisse) {
      if (e.typ === 'aufgehoben' && e.datum && (!aufgehobenSeit || e.datum > aufgehobenSeit)) aufgehobenSeit = e.datum;
    }
  }
  // Spätere (oder gleichtägige) Textänderung irgendwo im Artikel widerlegt die
  // Ganzaufhebung: ein aufgehobener Artikel trägt keinen Text, der danach neu
  // gefasst oder eingefügt werden könnte. Fälle: Aufhebung der Sachüberschrift «…»
  // (Marker im <h6> hinter dem Titel, im Sidecar nicht vom Nummern-Marker
  // unterscheidbar) mit Neufassung der Absätze — AVIG Art. 60, EOG Art. 1a,
  // BBV Art. 66 — sowie Wiedereinfügung nach Aufhebung.
  // Massgeblich sind nur Fussnoten des Artikels selbst — nicht die eines
  // vorangehenden Gliederungs-Titels (`sektion`, z. B. OR Art. 858: «Ausdruck
  // gemäss … 2023» am Titel «III. Allfällige Rechte …» vor dem 2013 aufgehobenen Artikel).
  if (aufgehobenSeit) {
    for (const fn of fussnoten ?? []) {
      if (fn.sektion) continue;
      for (const e of parseFussnoteHistorie(fn).ereignisse) {
        if (e.datum && GILT_TYPEN.has(e.typ) && e.datum >= aufgehobenSeit) { aufgehobenSeit = undefined; break; }
      }
      if (!aufgehobenSeit) break;
    }
  }
  // Rest-Mehrdeutigkeit des Kopf-Ankers: «<b>Art. 55</b> …[Fn]» (Sachüberschrift
  // aufgehoben) und «<b>Art. 48</b>[Fn]» (Artikel aufgehoben) stehen beide im <h6>;
  // das Struktur-Sidecar hält den Unter-Ort (Nummer vs. Sachüberschrift) nicht fest.
  // Trägt der Artikel-Körper der amtlichen Fassung lebenden Normtext, kann die
  // Kopf-Fussnote nur die Sachüberschrift betreffen (PARLG Art. 55, BPV Art. 113,
  // AIG Art. 112, VTS Art. 124 — Fedlex-HTML 23.9.2026). Wurzel-Fix (Sidecar-
  // Feld für den Kopf-Unter-Ort) siehe ROADMAP RL-11-Nachzug.
  if (aufgehobenSeit && opts.koerperLebend === true) aufgehobenSeit = undefined;

  // Ganz-Artikel-«gegenstandslos» (W2·27, 1.10.2026): dieselben Skopus-Regeln wie die Ganzaufhebung
  // (Artikelkopf, kein Teil-Skopus, nicht am Gliederungstitel), dieselben beiden Widerlegungen
  // (lebender Körper ⇒ Kopf-Anker betrifft die Sachüberschrift; spätere Textänderung ⇒ Artikel lebt).
  let gegenstandslos: { seit: string | null } | undefined;
  for (const fn of fussnoten ?? []) {
    if (!artikelAufhebungMoeglich(fn)) continue;
    const evs = parseFussnoteHistorie(fn).ereignisse;
    for (let i = 0; i < evs.length; i++) {
      const e = evs[i];
      if (e.typ !== 'gegenstandslos') continue;
      // P7 #27 (1.10.2026): ein UNDATIERTES «Gegenstandslos» lässt sich nicht per Datum widerlegen (s. u.). Die Fussnote
      // ordnet ihre Eingriffe amtlich chronologisch (ältester zuerst): folgt dem Vermerk in DERSELBEN Fussnote eine
      // Neufassung/Einfügung, lebt der Artikel wieder. Über Fussnoten hinweg gibt es keine Reihenfolge — dort bleibt er.
      if (!e.datum && evs.slice(i + 1).some((v) => GILT_TYPEN.has(v.typ))) continue;
      if (!gegenstandslos || (e.datum && (!gegenstandslos.seit || e.datum > gegenstandslos.seit))) gegenstandslos = { seit: e.datum };
    }
  }
  if (gegenstandslos?.seit) {
    const seit = gegenstandslos.seit;
    const widerlegt = (fussnoten ?? []).some(
      (fn) => !fn.sektion && parseFussnoteHistorie(fn).ereignisse.some((e) => e.datum && GILT_TYPEN.has(e.typ) && e.datum >= seit),
    );
    if (widerlegt) gegenstandslos = undefined;
  }
  if (gegenstandslos && opts.koerperLebend === true) gegenstandslos = undefined;

  // P7 #53 (§8): ein amtlich aufgehobener Artikel (Text-Shard: Wortlaut «Aufgehoben»/«…» mit Vermerk) GILT nicht
  // «seit» irgendeiner Einfügung/Fassung — Fälle: Fussnote am Gliederungstitel (ASYLV2 65, HREGV 162–163, ZSTV 75a–m),
  // Einfügungs-Fussnote ohne Aufhebungsdatum (AVO 22a–c, 50b–f), befristete Fassung (AIG 72). Ohne datiertes
  // `aufgehobenSeit` bleibt der Stand ehrlich leer (Anzeige: «Fassungshistorie»), die Ereignisse bleiben als Chronik.
  if (opts.snapshotAufgehoben === true && !aufgehobenSeit) giltSeit = null;

  const historie: ArtikelHistorie = { giltSeit, ereignisse };
  if (aufgehobenSeit) historie.aufgehobenSeit = aufgehobenSeit;
  if (gegenstandslos) historie.gegenstandslos = gegenstandslos;
  return { historie, unparsed, refCount, ereignisFnCount };
}

/**
 * Kann diese Fussnote eine GANZ-Artikel-Aufhebung tragen? (RL-11, Befund R2-01)
 *
 * Nein, wenn ihr Anker-Ort im Artikel-KÖRPER liegt — nummerierter Absatz
 * (`absatz`), lit./Ziff.-Item (`item`) oder absatzloser Körper-Block
 * (`absatzIndex`, z. B. AVIG Art. 45 «2–3 …», MStG Art. 145 Ziff. 2) bzw. eine
 * Körper-Position (`pos`, z. B. HRegV Art. 171 «a. und b. …» in einer Liste
 * ohne Marke) —, wenn sie an einem vorangehenden Gliederungs-Titel hängt
 * (`sektion`), oder wenn
 * die Prosa die Aufhebung selbst auf einen Teil beschränkt («Gliederungstitel/
 * Satz/Satzteil/Zweiter Absatz/Note … aufgehoben durch»). Die klein geschriebene
 * Mittelform «… aufgehoben durch/in/gemäss» tritt im Bund-Korpus ausschliesslich
 * mit einem solchen Skopus-Subjekt davor auf (gemessen 23.9.2026: 66 von 66
 * Fussnoten, jq über public/normtext/struktur/bund/*.json); die Ganzaufhebung
 * lautet amtlich stets «Aufgehoben durch …».
 */
function artikelAufhebungMoeglich(fn: FnEingang): boolean {
  if (fn.absatz != null || fn.item != null || fn.absatzIndex != null || fn.pos != null || fn.sektion) return false;
  return !/\baufgehoben (?:durch|in|gemäss)\b/.test(normalisiere(fn.text ?? ''));
}
