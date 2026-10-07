// ─── Client-Schicht der Rubrik «Rechtsprechung» ─────────────────────────────
//
// Lädt das Entscheid-Manifest (public/rechtsprechung/register.json) und die
// einzelnen Entscheid-Dateien lazy, plus reine Gruppier-/Filter-Helfer.
// Reine Ladeschicht (§3) — kein Inhalt erzeugt.

import type { EntscheidManifest, BrowseEntscheid, RichterRegister } from './register';
import type { EntscheidSnapshot, EntscheidSnapshotDatei, Gerichtstyp } from './typen';
import { ERLASS_REGISTER, GEBIETE, GEBIET_LABEL, gebieteFuerFilter, type Rechtsgebiet } from '../normtext/register';
import { ladeJson, pruefeFelder } from '../ladeJson';

const MANIFEST_PRUEFER = pruefeFelder('rechtsprechung/register.json', { entscheide: 'array' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { MANIFEST_PRUEFER as RSPR_MANIFEST_PRUEFER };
const RICHTER_PRUEFER = pruefeFelder('rechtsprechung/richter.json', { richter: 'objekt' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { RICHTER_PRUEFER as RSPR_RICHTER_PRUEFER };
const DATEI_PRUEFER = pruefeFelder('rechtsprechung/<Entscheid>.json', { eintraege: 'array' });
/** Für den Voll-/Stichprobenlauf gegen public/ (src/tests/ladeJson-public.test.ts). */
export { DATEI_PRUEFER as RSPR_DATEI_PRUEFER };

// ── Manifest (einmal, gecacht als laufende Promise) ──────────────────────────
let manifestPromise: Promise<EntscheidManifest | null> | null = null;

export async function ladeEntscheidManifest(): Promise<EntscheidManifest | null> {
  if (!manifestPromise) {
    manifestPromise = (async () => {
      try {
        return await ladeJson<EntscheidManifest>('/rechtsprechung/register.json', MANIFEST_PRUEFER);
      } catch {
        return null;
      }
    })();
  }
  return manifestPromise;
}

// ── Richter-Register (Slug → Anzeigename, eigene schlanke Projektion) ────────
//
// Bewusst NICHT im Manifest: der Name stünde sonst bis zu ~700× dupliziert (§15).
// Eigener Lazy-Load nach demselben Muster wie das Manifest; die Facette braucht
// ihn nur für Labels — Filtern/Zählen läuft über die Slugs im Manifest.
let richterPromise: Promise<RichterRegister | null> | null = null;

export async function ladeRichterRegister(): Promise<RichterRegister | null> {
  if (!richterPromise) {
    richterPromise = (async () => {
      try {
        return await ladeJson<RichterRegister>('/rechtsprechung/richter.json', RICHTER_PRUEFER);
      } catch {
        return null;
      }
    })();
  }
  return richterPromise;
}

/** Manifest-Eintrag eines Schlüssels. */
export async function ladeEntscheidEintrag(key: string): Promise<BrowseEntscheid | null> {
  const m = await ladeEntscheidManifest();
  return m?.entscheide.find((e) => e.key === key) ?? null;
}

// ── Volltext-Datei eines Entscheids (lazy, gecacht) ──────────────────────────
const dateiCache = new Map<string, Promise<EntscheidSnapshot | null>>();

/** Lädt den Snapshot eines Entscheids (BrowseEntscheid.datei). */
export function ladeEntscheid(datei: string): Promise<EntscheidSnapshot | null> {
  let p = dateiCache.get(datei);
  if (!p) {
    p = (async () => {
      try {
        const d = await ladeJson<EntscheidSnapshotDatei>(`/rechtsprechung/${datei}`, DATEI_PRUEFER);
        return d?.eintraege[0] ?? null;
      } catch {
        return null;
      }
    })();
    dateiCache.set(datei, p);
  }
  return p;
}

// ── Gruppieren / Filtern (rein, testbar) ─────────────────────────────────────

export interface EntscheidFilterWerte {
  q?: string;
  sachgebiet?: Rechtsgebiet | null;
  gericht?: string | null;
  /** Instanz-Achse (Batch 3): gerichtstyp — Bundesgericht/BVGer/BStGer/BPatGer/kantonal. */
  gerichtstyp?: Gerichtstyp | null;
  kanton?: string | null;
  sprache?: string | null;
  nurLeitentscheide?: boolean;
  /** Nur amtlich in der BGE-Sammlung publizierte Entscheide (höchste Autorität). */
  nurBge?: boolean;
  datumVon?: string | null;
  datumBis?: string | null;
  /** Angewandter Erlass (normKeys-Eintrag, z.B. 'OR'); zweite Navigationsachse (?norm=). */
  norm?: string | null;
  /** Ebene Bund (kanton 'CH') vs. Kantone — klare Trennung (Auftrag David). */
  ebene?: 'bund' | 'kanton' | null;
  /**
   * Spruchkörper-Achse (?richter=): Kanon-Slug einer mitwirkenden Person.
   * Trifft NUR richterliche Mitwirkung (Vorsitz/Mitglied) — Gerichtsschreiber:innen
   * sind erfasst, aber keine Richter:innen und bilden hier keinen Treffer.
   */
  richter?: string | null;
}

// ── Thema-Scent (Leitelement statt wertlosem Aktenzeichen, 0/75 BGE-Ref) ─────
//
// Reine Helfer (§3): die Karte/Zeile führt mit dem THEMA. Fehlt die amtliche
// Regeste (26/75), baut synthThema eine deterministische Sachzeile NUR aus
// echten Strukturfeldern — KEIN gefakter Regestentext (§8). istSynth() lässt die
// Darstellung den Ersatz visuell kenntlich machen (andere Schrift + Marker).

/** true, wenn der Entscheid amtlich in der BGE-Sammlung publiziert ist (höchste Autorität). */
export function istBge(e: BrowseEntscheid): boolean {
  return !!e.bgeReferenz;
}

/**
 * Haupt-Identität (der scanbare/zitierbare Anker): die amtliche BGE-Referenz
 * ('BGE 150 III 137'), sonst das Aktenzeichen. Anwältinnen erkennen und zitieren
 * die BGE-Nummer — sie ist, wo vorhanden, wertvoller als das Aktenzeichen.
 */
export function hauptIdentitaet(e: BrowseEntscheid): string {
  return e.bgeReferenz ? `BGE ${e.bgeReferenz}` : e.nummer;
}

// ── Anzeige-Kürzel: Register-key → amtliche Schreibweise (LM-102/LM-106) ─────
//
// Die normKeys entstehen build-time VERSAL (zitat-extraktion.ts: `lawRaw
// .toUpperCase()`), weil sie Schlüssel sind — nicht Anzeigetext. Ungemappt
// erschienen sie am Chip als «SCHKG», «STGB», «VWVG», «LUGUE»; das ist keine
// amtliche Abkürzung mehr (der Umlaut von LugÜ ging dabei ganz verloren).
// Gemappt wird ausschliesslich auf das `kuerzel` des ERLASS_REGISTER — dort
// steht die amtliche Schreibweise genau einmal (§5). KEINE zweite Kürzel-
// Tabelle, und kein Eingriff in die Extraktion (Risiko-Pfad): Key und URL
// bleiben unverändert versal, nur die Darstellung wird amtlich.
//
// §7-Verifikation der Schreibweisen, Abruf 02.08.2026 gegen Fedlex-SPARQL
// (https://fedlex.data.admin.ch/sparqlendpoint, jolux:titleShort am deutschen
// Ausdruck der ConsolidationAbstract je skos:notation = SR-Nummer):
//   SchKG 281.1 · StGB 311.0 · StPO 312.0 · JStPO 312.1 · StHG 642.14 ·
//   BetmG 812.121 · AsylG 142.31 · BewG 211.412.41 · BGerR 173.110.131 ·
//   StBOG 173.71 · VStrR 313.0 · VStG 642.21 · MStG 321.0 · ParlG 171.10 ·
//   HRegV 221.411 · GwG 955.0 · PatG 232.14 · VwVG 172.021 · LugÜ 0.275.12
// Alle 19 amtlich bestätigt und identisch mit dem Register-`kuerzel`. Zwei
// SR-Nummern tragen zusätzlich das Kürzel des AUFGEHOBENEN Vorgänger-Erlasses
// (173.71 «SGG» = Strafgerichtsgesetz 2002; 312.0 «BStP» = Bundesstrafrechts-
// pflege 1934) — massgeblich ist der geltende Erlass, also StBOG bzw. StPO.
// Massgeblich bleibt stets die amtliche Fassung, nicht dieser Kommentar (§7).
const ANZEIGE_KUERZEL: ReadonlyMap<string, string> =
  new Map(ERLASS_REGISTER.map((e) => [e.key, e.kuerzel]));

/**
 * Erlass-/Norm-Key lesbar machen: 'SCHKG' → 'SchKG', 'LUGUE' → 'LugÜ',
 * 'OR-336' → 'OR Art. 336'. Rein, kein Normtext. Ein Key ohne Register-Eintrag
 * wird unverändert gezeigt (§8: nie eine Schreibweise erfinden).
 */
export function normLabel(key: string): string {
  const direkt = ANZEIGE_KUERZEL.get(key);
  if (direkt) return direkt;
  const m = /^([A-Za-zÄÖÜäöü]+)[-_](\d+\w*)$/.exec(key);
  if (!m) return key;
  return `${ANZEIGE_KUERZEL.get(m[1]) ?? m[1]} Art. ${m[2]}`;
}

function jahr(iso: string): string {
  return /^(\d{4})/.exec(iso)?.[1] ?? iso;
}

/** true, wenn keine amtliche Regeste vorliegt → Darstellung zeigt Ersatz-Optik + Marker. */
export function istSynth(e: BrowseEntscheid): boolean {
  return !e.regesteKurz;
}

/**
 * true, wenn `regesteKurz` KEINE Regeste trägt, sondern den amtlichen
 * Betreff/Titel der Quelle (BS-Tranche: regesteKurz = Trefferlisten-Titel des
 * Portals, regesteVorhanden bleibt false — Bauplan §3.4 «Titel ist Betreff,
 * KEINE Regeste»). Quellen-agnostisch über die Feld-Kombination, damit künftige
 * Findinfo-Kantone (F6) das Verhalten erben. §8: ein Betreff wird nie als
 * Regeste etikettiert oder leitsatz-gestrippt.
 */
export function istBetreff(e: BrowseEntscheid): boolean {
  return !!e.regesteKurz && !e.regesteVorhanden;
}

/**
 * Schmales Feld-Set für die Thema-Synthese — erfüllt von BrowseEntscheid (Übersicht)
 * UND EntscheidSnapshot (Reader-Kopf). So bleibt synthThema die alleinige SSoT (§5),
 * ohne dass der Reader casten oder eine zweite Kaskade pflegen müsste.
 */
export interface ThemaFelder {
  sachgebiet: Rechtsgebiet;
  gerichtName: string;
  normKeys: string[];
  datum: string;
}

/**
 * Deterministische Sachzeile als Regeste-Ersatz — NUR aus echten Feldern.
 * Kaskade: (Normen vorhanden) Gebiet — Gericht · angewandt: A, B, C
 *          (sonst)            Gebiet — Gericht, Jahr
 * Nennt nie etwas, das nicht im Datensatz steht (§8).
 */
export function synthThema(e: ThemaFelder): string {
  const gebiet = GEBIET_LABEL[e.sachgebiet];
  if (e.normKeys.length > 0) {
    const normen = e.normKeys.slice(0, 3).map(normLabel).join(', ');
    return `${gebiet} — ${e.gerichtName} · angewandt: ${normen}`;
  }
  return `${gebiet} — ${e.gerichtName}, ${jahr(e.datum)}`;
}

// Ein Segment, das mit einem Norm-Zitat beginnt („Art. …", „§ …", „a Art. …").
// Solche Segmente trägt der Norm-Chip schon; sie verraten nicht das Thema.
const NORM_SEGMENT = /^\s*(?:a\s+)?(?:a?Art|§|Ziff|lit|Bst|Buchst)\.?\s*\d|^\s*(?:a\s+)?(?:a?Art|§)\b/;
// Abkürzungen, deren Punkt KEIN Satzende ist (sonst bräche der Leitsatz mittendrin ab).
const ABK_ENDE = /\b(?:a?Art|Abs|lit|Ziff|Bst|ff|f|al|vgl|Ingress|i\.V\.m|cpv|cons|Cost|cp|bzw|sog|inkl|Nr|Ziffer)\.?$/i;

/** Erster echter Satz (Abkürzungs-Punkte sind kein Satzende). */
function ersterSatz(s: string): string {
  const re = /([.!?])(?=\s+[A-ZÄÖÜ]|\s*$)/g;
  for (let m; (m = re.exec(s)); ) {
    const vor = s.slice(0, m.index);
    if (ABK_ENDE.test(vor)) continue; // Punkt gehört zu einer Abkürzung → weiter
    return s.slice(0, m.index + 1).trim();
  }
  return s.trim();
}

/**
 * Leitsatz/Thema einer amtlichen Regeste — die Sachaussage OHNE den vorangestellten
 * Artikel-Block. Grenze Norm-Block → Leitsatz = das erste „<Gesetzeskürzel>[.;] "
 * (ein Token, das auf einem Grossbuchstaben endet: ZPO/SchKG/FusG/BV …), dem KEIN
 * weiteres Zitat folgt — danach beginnt die Sachaussage. Abkürzungen wie „Art.",
 * „Abs.", „lit.", „ff." enden klein → keine Grenze. KONSERVATIV (§1/§8): bleibt das
 * Ergebnis fragwürdig (zu kurz, beginnt selbst mit Art./§, endet auf einer Abkürzung,
 * Trunkierungs-Krümel) ODER ist keine klare Grenze erkennbar, wird die VOLLE Regeste
 * zurückgegeben — ehrlich, nie ein verstümmeltes Fragment. Rein (§3).
 */
export function regesteLeitsatz(regesteKurz: string): string {
  const voll = regesteKurz.trim();
  const segmente = voll.split(';').map((s) => s.trim());
  // 1) Führende reine Zitat-Segmente überspringen („Art. … ZGB"; „Ziff. 1.2 …").
  let i = 0;
  while (i < segmente.length && NORM_SEGMENT.test(segmente[i])) i++;
  let rest = i < segmente.length ? segmente.slice(i).join('; ') : '';
  // 2) Sonst (alles Zitate, oder der Rest beginnt doch mit Zitat): im letzten Zitat-
  //    Segment nach „<Gesetzeskürzel>. <Grossbuchstabe>" trennen — Punkt statt Semikolon
  //    als Grenze (z.B. „… Art. 22c FZG. Vorsorgeausgleich …"). Abkürzungen enden klein.
  if (!rest || NORM_SEGMENT.test(rest)) {
    const kand = segmente[Math.min(i, segmente.length - 1)] ?? '';
    const pm = /[A-Za-zÄÖÜ]*[A-ZÄÖÜ]\.\s+(?=[A-ZÄÖÜ])/.exec(kand);
    rest = pm ? kand.slice(pm.index + pm[0].length) : '';
  }
  if (!rest) return voll;
  // 3) Erster echter Satz; degeneriert → ehrlich die volle Regeste statt Schrott.
  const satz = ersterSatz(rest);
  if (satz.length < 6 || NORM_SEGMENT.test(satz)) return voll;
  if (ABK_ENDE.test(satz.replace(/[.…]+$/, ''))) return voll;
  if (/…$/.test(satz) && satz.length < 24) return voll; // Trunkierungs-Krümel
  // Leitsätze beginnen in der Regeste oft klein (nach dem Artikel-Block) — als
  // Bezeichnung gross schreiben, damit es nicht wie ein zerstückelter Halbsatz wirkt.
  return satz.charAt(0).toLocaleUpperCase('de-DE') + satz.slice(1);
}

// Memo auf die Datenreferenz (§15.4-Muster WeakMap, React Compiler AUS): die
// Manifest-Einträge sind stabil/unveränderlich; themaText läuft in Filter-Suche
// (heu je Eintrag) UND Render — mit ~6'300 Einträgen (BS-Tranche) lohnt der
// Cache. Rein: Ergebnis hängt nur von Feldern des Eintrags ab (§2).
const themaCache = new WeakMap<BrowseEntscheid, string>();

/** Leitelement-Text für Karte und Liste: Leitsatz der Regeste; amtlicher
 *  Betreff (istBetreff) verbatim — nie leitsatz-gestrippt (§8); sonst synthThema. */
export function themaText(e: BrowseEntscheid): string {
  let t = themaCache.get(e);
  if (t === undefined) {
    t = e.regesteKurz
      ? (e.regesteVorhanden ? regesteLeitsatz(e.regesteKurz) : e.regesteKurz)
      : synthThema(e);
    themaCache.set(e, t);
  }
  return t;
}

/** Filter über das Manifest (Client, deterministisch, kein FTS). Leere Werte → kein Filter. */
export function filterEntscheide(liste: BrowseEntscheid[], f: EntscheidFilterWerte): BrowseEntscheid[] {
  const q = (f.q ?? '').trim().toLowerCase();
  return liste.filter((e) => {
    // W2-TRENNUNG (29.8.2026): Der Filterwert kann ein ABGELÖSTES Gebiet sein —
    // eine Alt-URL `?rg=sozial-abgaben` aus Lesezeichen/Index. `gebieteFuerFilter`
    // löst ihn in seine Nachfolger auf (register.ts, ALT_GEBIET_ALIAS); die
    // Trefferliste bleibt dann exakt die von vor der Trennung. Für jeden
    // GÜLTIGEN Wert ist das die einelementige Menge, also unverändertes
    // Verhalten (Golden byte-gleich, §6).
    if (f.sachgebiet && !gebieteFuerFilter(f.sachgebiet).includes(e.sachgebiet)) return false;
    if (f.gericht && e.gericht !== f.gericht) return false;
    if (f.gerichtstyp && e.gerichtstyp !== f.gerichtstyp) return false;
    if (f.kanton && e.kanton !== f.kanton) return false;
    if (f.sprache && e.sprache !== f.sprache) return false;
    if (f.norm && !e.normKeys.includes(f.norm)) return false;
    // Spruchkörper: nur richterliche Mitwirkung zählt (GS ausgenommen). Entscheide
    // ohne erfassbare Besetzung tragen kein `richter`-Feld (§8) → nie ein Treffer,
    // nie eine erfundene Zuordnung.
    if (f.richter && !e.richter?.some((r) => r.s === f.richter && r.r !== 'gerichtsschreiber')) return false;
    if (f.ebene === 'bund' && e.kanton !== 'CH') return false;
    if (f.ebene === 'kanton' && e.kanton === 'CH') return false;
    if (f.nurLeitentscheide && e.leitcharakter !== 'leitentscheid') return false;
    // F4 (JETZT-MACHEN §5): die UI führt «nur Leitentscheide»/«nur BGE» zu EINEM
    // Filter zusammen (heute deckungsgleich, 272=272). Dieses Prädikat bleibt als
    // latente Grundlage erhalten, falls amtliche-BGE ⟂ Leitentscheid später getrennt wird.
    if (f.nurBge && !e.bgeReferenz) return false;
    if (f.datumVon && e.datum < f.datumVon) return false;
    if (f.datumBis && e.datum > f.datumBis) return false;
    if (q) {
      // Suche über das THEMA (inkl. Synth-Zeile) + Identität + Normen + Gericht.
      const heu = `${themaText(e)} ${e.nummer} ${e.bgeReferenz ?? ''} ${e.zitierung} ${e.gerichtName} ${e.normKeys.join(' ')}`.toLowerCase();
      if (!heu.includes(q)) return false;
    }
    return true;
  });
}

/** Bequemer Spezialfall für den ?norm-Einstieg (zweite Navigationsachse). */
export function filterNachNorm(liste: BrowseEntscheid[], normKey: string): BrowseEntscheid[] {
  return liste.filter((e) => e.normKeys.includes(normKey));
}

// ── Sortierung (rein, total geordnet, key als stabiler Tiebreaker) ───────────
//
// Determinismus (§2): gleiche Eingabe → gleiche Reihenfolge. Jeder Vergleich
// endet auf `key`, damit die Sortierung auch bei Gleichstand stabil ist.

export type SortModus = 'relevanz' | 'neu' | 'alt' | 'gericht';

function cmpKey(a: BrowseEntscheid, b: BrowseEntscheid): number {
  return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
}
function cmpDatum(a: BrowseEntscheid, b: BrowseEntscheid): number {
  return a.datum < b.datum ? -1 : a.datum > b.datum ? 1 : 0;
}

/** Default: Leitentscheide → amtlich publiziert (BGE) → neueste → key. Autorität zuerst. */
export function nachRelevanz(liste: BrowseEntscheid[]): BrowseEntscheid[] {
  const leit = (e: BrowseEntscheid) => (e.leitcharakter === 'leitentscheid' ? 0 : 1);
  const bge = (e: BrowseEntscheid) => (e.bgeReferenz ? 0 : 1);
  return [...liste].sort((a, b) =>
    leit(a) - leit(b) || bge(a) - bge(b) || -cmpDatum(a, b) || cmpKey(a, b));
}

/** Nach Datum (Default absteigend = neueste zuerst), key-Tiebreak. */
export function nachDatum(liste: BrowseEntscheid[], richtung: 'asc' | 'desc' = 'desc'): BrowseEntscheid[] {
  const r = richtung === 'asc' ? 1 : -1;
  return [...liste].sort((a, b) => r * cmpDatum(a, b) || cmpKey(a, b));
}

/** Bund (CH) vor Kantonen, dann neueste zuerst, key-Tiebreak. */
export function nachGericht(liste: BrowseEntscheid[]): BrowseEntscheid[] {
  const ebene = (e: BrowseEntscheid) => (e.kanton === 'CH' ? 0 : 1);
  return [...liste].sort((a, b) =>
    ebene(a) - ebene(b) || -cmpDatum(a, b) || cmpKey(a, b));
}

/** EIN Einstiegspunkt für die Toolbar — dispatcht auf die reinen Sortierer. */
export function sortiere(liste: BrowseEntscheid[], modus: SortModus): BrowseEntscheid[] {
  switch (modus) {
    case 'neu': return nachDatum(liste, 'desc');
    case 'alt': return nachDatum(liste, 'asc');
    case 'gericht': return nachGericht(liste);
    case 'relevanz':
    default: return nachRelevanz(liste);
  }
}

/** Verweis-Eintrag = das vollständige Urteil zu einem BGE (eigene Karte, Deep-Link). */
export const istVolltextVerweis = (e: BrowseEntscheid): boolean => !!e.verweis;

/** Drei Sektionen fürs Default-Layout: amtliche Leitentscheide, die zugehörigen
 *  vollständigen Urteile (getrennte Einträge, Auftrag David 26.6.), übrige Entscheide. */
export function gruppiereNachLeit(liste: BrowseEntscheid[]): {
  leitentscheide: BrowseEntscheid[];
  volltexte: BrowseEntscheid[];
  weitere: BrowseEntscheid[];
} {
  return {
    leitentscheide: liste.filter((e) => !istVolltextVerweis(e) && e.leitcharakter === 'leitentscheid'),
    volltexte: liste.filter((e) => istVolltextVerweis(e)),
    weitere: liste.filter((e) => !istVolltextVerweis(e) && e.leitcharakter !== 'leitentscheid'),
  };
}

/** Feste Instanz-Reihenfolge + Labels (Übersichts-Gruppierung A3-Regel 5 UND
 *  Instanz-Facette Batch 3). `kurz` = Chip-Label, `label` = volle a11y-Bezeichnung. */
export const INSTANZ_ORDNUNG: { typ: Gerichtstyp; label: string; kurz: string }[] = [
  { typ: 'bundesgericht', label: 'Bundesgericht', kurz: 'BGer' },
  { typ: 'bundesverwaltungsgericht', label: 'Bundesverwaltungsgericht', kurz: 'BVGer' },
  { typ: 'bundesstrafgericht', label: 'Bundesstrafgericht', kurz: 'BStGer' },
  { typ: 'bundespatentgericht', label: 'Bundespatentgericht', kurz: 'BPatGer' },
  { typ: 'kantonal', label: 'Kantonale Gerichte', kurz: 'Kantone' },
];

/**
 * A3-Regel 5: nicht amtlich publizierte Urteile nach ihrer INSTANZ (gerichtstyp)
 * gruppieren — feste Reihenfolge (Bund vor Kanton), nur belegte Gruppen, stabile
 * Eingangsreihenfolge je Gruppe. Reine Anordnung (§3), keine Filterlogik.
 */
export function gruppiereNachInstanz(liste: BrowseEntscheid[]): {
  typ: Gerichtstyp; label: string; liste: BrowseEntscheid[];
}[] {
  return INSTANZ_ORDNUNG
    .map(({ typ, label }) => ({ typ, label, liste: liste.filter((e) => e.gerichtstyp === typ) }))
    .filter((g) => g.liste.length > 0);
}

// ── Aggregate für die Navigation (Rail-Zähler, Norm-Häufigkeit) ──────────────

export interface SachgebietZaehler {
  sachgebiet: Rechtsgebiet;
  label: string;
  count: number;
}

/** Sachgebiet-Zähler in GEBIETE-Reihenfolge, nur belegte Gebiete (Rail). Verweis-
 *  Einträge (vollständige Urteile) ausgenommen — sonst zählt jeder BGE doppelt. */
export function zaehleSachgebiete(liste: BrowseEntscheid[]): SachgebietZaehler[] {
  const echte = liste.filter((e) => !istVolltextVerweis(e));
  return GEBIETE
    .map((g) => ({ sachgebiet: g.id, label: g.label, count: echte.filter((e) => e.sachgebiet === g.id).length }))
    .filter((g) => g.count > 0);
}

export interface NormZaehler {
  normKey: string;
  count: number;
}

export interface RichterZaehler {
  slug: string;
  /** Anzeigename aus dem Richter-Register; fehlt er, ehrlich der Slug (§8, nie erfunden). */
  name: string;
  count: number;
}

/**
 * Häufigkeit der mitwirkenden Richter:innen über eine (cross-gefilterte) Liste —
 * absteigend, slug-stabil (§2). Grundlage der Richter-Facette; die Zahl ist die
 * ECHTE Resttreffer-Zahl im aktuellen Filterzustand (R15), nicht der Korpus-Wert
 * aus dem Register.
 *
 * Drei Ehrlichkeits-Regeln (§8):
 * 1. Gerichtsschreiber:innen zählen nicht als Richter:in (Rolle ausgenommen) —
 *    sie sind erfasst, gehören aber nicht in diese Achse.
 * 2. Je Entscheid zählt eine Person höchstens EINMAL (dieselbe Person kann im
 *    selben Entscheid als Mitglied UND Gerichtsschreiber:in auftreten).
 * 3. Verweis-Einträge (vollständige Urteile zu einem BGE) bleiben aussen vor —
 *    symmetrisch zu zaehleSachgebiete/normHaeufigkeit, sonst zählt ein BGE doppelt.
 */
export function richterHaeufigkeit(
  liste: BrowseEntscheid[],
  register: RichterRegister | null,
): RichterZaehler[] {
  const zahl = new Map<string, number>();
  for (const e of liste) {
    if (istVolltextVerweis(e) || !e.richter) continue;
    const gesehen = new Set<string>();
    for (const r of e.richter) {
      if (r.r === 'gerichtsschreiber' || gesehen.has(r.s)) continue;
      gesehen.add(r.s);
      zahl.set(r.s, (zahl.get(r.s) ?? 0) + 1);
    }
  }
  return [...zahl.entries()]
    .map(([slug, count]) => ({ slug, name: register?.richter[slug]?.name ?? slug, count }))
    .sort((a, b) => b.count - a.count || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
}

/** Häufigkeit der angewandten Erlasse, absteigend, key-stabil (Top-Normen-Leiste). */
export function normHaeufigkeit(liste: BrowseEntscheid[]): NormZaehler[] {
  const zahl = new Map<string, number>();
  // Verweis-Einträge ausgenommen (Drift-Schutz, symmetrisch zu zaehleSachgebiete).
  for (const e of liste) if (!istVolltextVerweis(e)) for (const k of e.normKeys) zahl.set(k, (zahl.get(k) ?? 0) + 1);
  return [...zahl.entries()]
    .map(([normKey, count]) => ({ normKey, count }))
    .sort((a, b) => b.count - a.count || (a.normKey < b.normKey ? -1 : a.normKey > b.normKey ? 1 : 0));
}
