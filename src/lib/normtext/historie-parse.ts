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
}

/** Ereignistyp einer amtlichen Änderungs-Fussnote. */
export type HistorieTyp =
  | 'eingefuegt' // «Eingefügt durch …»
  | 'fassung' // «Fassung gemäss/des …» (Neufassung)
  | 'aufgehoben' // «Aufgehoben durch/in …, mit Wirkung seit …»
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
  const text = normalisiere(fn.text ?? '');
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
      const dat = datumAusSegment(segment);
      ereignisse.push({
        typ,
        datum: dat?.datum ?? null,
        wirkung: dat?.wirkung ?? false,
        quellen: quellenAusSegment(segment, links),
        absatz,
        item,
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
    // Ganz-Artikel-Aufhebung: Aufhebungs-Ereignis auf Artikelebene (kein Absatz-/Item-Skopus).
    if (e.typ === 'aufgehoben' && e.datum && e.absatz == null && e.item == null) {
      if (!aufgehobenSeit || e.datum > aufgehobenSeit) aufgehobenSeit = e.datum;
    }
  }

  const historie: ArtikelHistorie = { giltSeit, ereignisse };
  if (aufgehobenSeit) historie.aufgehobenSeit = aufgehobenSeit;
  return { historie, unparsed, refCount, ereignisFnCount };
}
