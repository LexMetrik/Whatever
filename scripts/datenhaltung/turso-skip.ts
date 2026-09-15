// scripts/datenhaltung/turso-skip.ts
// Tabellen-Skip und Sperr-Erkennung des Turso-Syncs (QS-TURSO-SCHREIBVOLUMEN,
// FAHRPLAN-DATENHALTUNG §17, 15.9.2026).
//
// ANLASS. Mail Turso 15.9.2026 «Writes Blocked» (Organisation ravedave, Gratisplan). Der
// Sync lief bei JEDEM Push auf main mit Korpus-Diff und baute alle fuenf HOT-Tabellen samt
// FTS5-Schatten komplett neu — 171 065 Zeilen je Lauf, 39 Laeufe vom 1.–14.9.2026 ≈ 6,7 Mio
// Zeilen, und Turso zaehlt bei indexierten Tabellen jede betroffene Index-Zeile zusaetzlich
// (turso.tech/pricing, FAQ «rows written», Abruf 15.9.2026).
//
// WARUM EIN EIGENES MODUL (Muster `turso-transport.ts`): `turso-sync.ts` ist ein
// ausfuehrbares Skript — es startet beim Import sofort den echten Prod-Sync. Reine
// Rechenlogik, die ein Unit-Test pruefen soll, darf es darum nicht importieren.
//
// DIE ZWEI ENTSCHEIDUNGEN HIER:
//
//   1. SKIP. Je HOT-Tabelle wird eine SIGNATUR in `sync_meta` (`sig_<tabelle>`) hinterlegt,
//      die alles abdeckt, was den Remote-Inhalt bestimmt: die Ziel-DDL und den Inhalt.
//      Fuer die Basis-Tabellen kommt der Inhalt aus dem committeten `daten-manifest.json`
//      (Inhalts-sha je Tabelle, unabhaengig erzeugt und vom Tor `check:datenhaltung`
//      gehalten); fuer die FTS5-Tabellen trägt das Manifest bewusst KEINE Eintraege
//      (`manifest.ts/tabellen()` klammert die rebuildbare Ableitung aus), darum wird ihre
//      Signatur aus dem LOKALEN Artefakt gerechnet — ueber genau die Schatten-Tabellen, die
//      der Sync auch uebertraegt. Nichts wird erfunden.
//
//      Uebersprungen wird NUR, wenn die Signatur gleich ist UND die Remote-Zeilenzahl dem
//      Soll entspricht. Beide Haelften sind noetig: die Signatur allein saehe den
//      halb-gedroppten Live-Zustand vom 19.7.2026 nicht (remote `artikel` 16 400 von 55 822
//      bei voellig korrekter lokaler Quelle), die Zeilenzahl allein saehe keine
//      Inhalts-Aenderung bei gleicher Zeilenzahl.
//
//      Die DDL steckt ABSICHTLICH in der Signatur: sonst koennte der Skip die Pruefung 0
//      (SCHEMA) von `check-turso-frische.ts` umgehen — eine DDL-Aenderung (wie
//      `fts_artikel` von einer auf sechs Spalten am 31.8.2026) wuerde sonst uebersprungen,
//      die Replika behielte die alte Form, und api/suche.ts antwortete mit 502 auf jede
//      Artikel-Query. DDL-Drift ⇒ andere Signatur ⇒ Neuaufbau.
//
//   2. SPERRE. Ist das Monatskontingent aufgebraucht, antwortet Turso NICHT mit einem
//      HTTP-Status, sondern mit HTTP 200 und je Statement einem Pipeline-Fehler
//      (Antwortform belegt durch die Sonde zum Lauf 34948342923, 15.9.2026). Ohne eigene
//      Erkennung faellt das in denselben Topf wie ein Datenfehler — der Betreiber sucht
//      dann im Korpus nach einer Ursache, die im Abrechnungsmodell liegt. Darum eigener
//      Ausgang: `::error::`-Meldung mit dem Stand, auf dem die Replika stehenbleibt, und
//      Exit 3 (Datenfehler bleiben Exit 1, Erfolg 0).
import { createHash, type Hash } from 'node:crypto';
import type { Wert } from './turso-transport';

/** Exit-Code des Syncs, wenn Turso das Schreiben wegen des Monatskontingents sperrt.
 *  Bewusst NICHT 1: die Sperre ist kein Datenfehler, und wer den Lauf auswertet, soll
 *  beides ohne Log-Lektuere auseinanderhalten koennen. */
export const EXIT_SPERRE = 3;

/** Wortlaut-Kern der Turso-Antwort bei erschoepftem Schreibkontingent. Nur dieser Teil
 *  wird gematcht — die Klammer dahinter («do you need to upgrade your plan?») ist
 *  Marketing-Text und darf sich aendern, ohne die Erkennung zu brechen. */
export const SPERR_TEXT = 'SQL write operations are forbidden';

/** Lokaler Soll-Zustand einer HOT-Tabelle. */
export interface Signatur {
  /** sha256 ueber Ziel-DDL + Inhalt (Manifest-sha bzw. FTS-Schatten). */
  signatur: string;
  /** Zeilenzahl, die remote liegen MUSS, damit uebersprungen werden darf. */
  sollZeilen: number;
}

/** Ergebnis je Tabelle — `grund` wandert ins Log, damit ein Skip nie stumm passiert (§8). */
export interface SkipBefund {
  skip: boolean;
  grund: string;
}

/** Struktur einer FTS5-Schatten-Ladung, wie `turso-fts-index.ts/leseFtsSchatten()` sie
 *  liefert. Hier nur als Form deklariert (kein Import der Lese-Funktion), damit das Modul
 *  seiteneffektfrei und ohne `node:sqlite` testbar bleibt. */
export interface SchattenLadungLese {
  suffix: string;
  spalten: string[];
  werte: Wert[][];
}

/**
 * Traegt der Fehler die Turso-Kontingent-Sperre?
 *
 * Geprueft wird der Text, weil die Sperre genau so ankommt: als stmt-Fehler INNERHALB einer
 * HTTP-200-Antwort. `turso-sync.ts` faltet diese Fehler in seine `Error`-Meldungen
 * (`Turso stmt-Fehler: …` bzw. `Transaktion zurueckgerollt …`), darum wird auf Enthaltensein
 * geprueft und nicht auf Gleichheit.
 */
export function istSchreibsperre(fehler: unknown): boolean {
  const text = fehler instanceof Error ? fehler.message : typeof fehler === 'string' ? fehler : '';
  return text.includes(SPERR_TEXT);
}

/**
 * Die Meldung, die der Sync bei gesperrtem Schreiben ausgibt.
 *
 * Sie nennt drei Dinge, die sonst jede Diagnose kosten: (a) dass die Ursache das
 * Monatskontingent ist und nicht der Korpus, (b) auf welchem Stand die Replika damit
 * stehenbleibt, (c) dass LESEN weiterlaeuft — die Suche ist nicht ausgefallen, sie ist
 * nur nicht mehr frisch (am 15.9.2026 empirisch: `api/suche` lieferte HTTP 200 mit
 * Treffern, waehrend jeder Schreibversuch scheiterte).
 *
 * Ein fehlender Stand wird ausdruecklich «unbekannt» genannt und nie als «null» gedruckt:
 * «nicht ermittelbar» ist eine eigene Aussage, kein Datum (§8).
 */
export function sperrMeldung(stand: string | null): string {
  return (
    '::error::Turso: Schreiben gesperrt — Monatskontingent aufgebraucht; Replika bleibt auf Stand ' +
    `${stand ?? 'unbekannt (keine sync_meta.stand-Marke lesbar)'}, Lesen/Suche laeuft weiter; ` +
    'Reset am 1. des Monats. Kein Datenfehler — der Korpus ist in Ordnung, nur nicht frisch.'
  );
}

/**
 * Ein Feld in den Hash schreiben — LAENGEN-PRAEFIXIERT und typ-getaggt.
 *
 * Ohne beides waere die Signatur nicht injektiv: `['ab','c']` und `['a','bc']` ergaeben
 * denselben Hash (Feldgrenze verloren), ebenso die Zahl 1 und der Text «1», und NULL
 * waere von einem leeren Text nicht zu unterscheiden. Genau solche Verwechslungen wuerden
 * eine echte Aenderung als «unveraendert» durchgehen lassen — der Skip waere dann keine
 * Ersparnis, sondern stiller Datenverlust.
 */
function schreibeWert(h: Hash, v: Wert): void {
  if (v === null) {
    h.update('n;');
  } else if (typeof v === 'number') {
    const b = Buffer.from(String(v), 'utf8');
    h.update(`i${b.length}:`);
    h.update(b);
  } else if (v instanceof Uint8Array) {
    h.update(`b${v.length}:`);
    h.update(v);
  } else {
    const b = Buffer.from(v, 'utf8');
    h.update(`t${b.length}:`);
    h.update(b);
  }
}

/** Signatur einer Basis-Tabelle: Ziel-DDL + Inhalts-sha aus dem committeten Manifest. */
export function signaturBasis(ddl: string, datenSha: string): string {
  const h = createHash('sha256');
  h.update('basis/1\n');
  schreibeWert(h, ddl);
  schreibeWert(h, datenSha);
  return h.digest('hex');
}

/**
 * Signatur einer FTS5-Tabelle: Ziel-DDL + der Inhalt der lokal gebauten Schatten-Tabellen.
 *
 * Das Manifest deckt die FTS-Tabellen nicht ab; gerechnet wird darum ueber genau die
 * Ladungen, die auch uebertragen wuerden. Der lokale Index ist deterministisch (Nullprobe
 * byte-gleich, Kopf von `turso-fts-index.ts`) — zwei Builds derselben Quelle ergeben
 * darum dieselbe Signatur, ein geaenderter Korpus eine andere.
 *
 * `Iterable`, nicht `Array`: `leseFtsSchatten()` ist ein Generator, damit nie alle
 * Schatten-Tabellen zugleich im Heap liegen (`_content` der Entscheide allein ~157 MiB).
 */
export function signaturFts(ddl: string, ladungen: Iterable<SchattenLadungLese>): string {
  const h = createHash('sha256');
  h.update('fts/1\n');
  schreibeWert(h, ddl);
  for (const l of ladungen) {
    h.update(`|${l.suffix}|${l.spalten.join(',')}|${l.werte.length}|`);
    for (const zeile of l.werte) for (const w of zeile) schreibeWert(h, w);
  }
  return h.digest('hex');
}

/**
 * Darf die Tabelle uebersprungen werden?
 *
 * Vier Gruende fuehren zum Neuaufbau, und jeder einzelne ist ein realer Fehlmodus:
 *   · keine Remote-Marke — erster Lauf oder Marken aus einer Vorversion; «unbekannt» ist
 *     nie «unveraendert» (§8).
 *   · Signatur abweichend — neue Daten ODER neue DDL (letzteres haelt Pruefung 0 des
 *     Waechters scharf).
 *   · Remote-Zeilenzahl nicht ermittelbar — nicht geprueft ist nicht in Ordnung.
 *   · Remote-Zeilenzahl ≠ Soll — der halb-gedroppte Zustand vom 19.7.2026.
 *
 * Und eine Tabelle mit 0 Zeilen wird NIE uebersprungen, auch wenn das Soll 0 waere: eine
 * leere HOT-Tabelle ist in diesem Korpus kein gueltiger Zustand, sondern der Befund, den
 * `check-turso-frische.ts` als «Replika unvollstaendig» fuehrt.
 */
export function skipEntscheid(a: {
  lokal: Signatur;
  remoteSignatur?: string | null;
  remoteZeilen: number | null;
}): SkipBefund {
  if (!a.remoteSignatur) return { skip: false, grund: 'keine sig-Marke remote — Neuaufbau' };
  if (a.remoteSignatur !== a.lokal.signatur) {
    return {
      skip: false,
      grund: `Signatur abweichend (remote ${a.remoteSignatur.slice(0, 12)}… · lokal ${a.lokal.signatur.slice(0, 12)}…) — Neuaufbau`,
    };
  }
  if (a.remoteZeilen === null) return { skip: false, grund: 'Remote-Zeilenzahl nicht ermittelbar — Neuaufbau' };
  if (a.remoteZeilen === 0) return { skip: false, grund: 'Remote-Tabelle LEER — Neuaufbau' };
  if (a.remoteZeilen !== a.lokal.sollZeilen) {
    return { skip: false, grund: `Remote-Zeilen ${a.remoteZeilen} ≠ Soll ${a.lokal.sollZeilen} — Neuaufbau` };
  }
  return { skip: true, grund: `unveraendert (Signatur gleich, ${a.remoteZeilen} Zeilen == Soll) — uebersprungen` };
}

/**
 * Skip-Plan ueber alle Tabellen. Die beiden Leser werden EINGESPEIST — das Modul bleibt
 * damit netzfrei und testbar, und der Sync behaelt seine eine Transport-Implementierung.
 *
 * `zaehleRemote` laeuft nur dort, wo die Signatur ueberhaupt passt: bei abweichender
 * Signatur wird ohnehin neu gebaut, und jede Abfrage ist ein Request mehr.
 */
export async function planeSkip(
  lokal: ReadonlyMap<string, Signatur>,
  leseSignaturen: () => Promise<Map<string, string>>,
  zaehleRemote: (tabelle: string) => Promise<number | null>,
): Promise<Map<string, SkipBefund>> {
  const remote = await leseSignaturen();
  const plan = new Map<string, SkipBefund>();
  for (const [tabelle, sig] of lokal) {
    const remoteSignatur = remote.get(tabelle) ?? null;
    const remoteZeilen = remoteSignatur === sig.signatur ? await zaehleRemote(tabelle) : null;
    plan.set(tabelle, skipEntscheid({ lokal: sig, remoteSignatur, remoteZeilen }));
  }
  return plan;
}

// ─── Ziel-Schema der Basis-Tabellen ──────────────────────────────────────────
//
// Liegt HIER und nicht in `turso-sync.ts`, weil die Signatur genau die DDL hashen muss,
// mit der die Tabelle angelegt wird. Zwei Kopien waeren die stille Falle, gegen die der
// ganze Skip gebaut ist: eine DDL-Aenderung ohne Signatur-Aenderung wuerde uebersprungen,
// die Replika behielte die alte Form, und api/suche.ts antwortete 502 (§5).

/** Tabellentyp der Basis-Tabellen. */
export type BasisTabelle = (typeof BASIS)[number];

/** Basis-Tabellen (alles ausser FTS) — dieselbe Reihenfolge wie in SCHATTEN. */
export const BASIS = ['erlasse', 'erlass_fassungen', 'artikel'] as const;

/** DDL der Basis-Tabellen (Teilmenge des §3-Zielschemas — exakt die Spalten, die
 *  SQL_ARTIKEL_TREFFER braucht). Steht seit QS-TURSO-SCHREIBVOLUMEN auf Modulebene statt
 *  inline in Schritt 1: die Skip-Signatur muss dieselbe DDL hashen, die die Tabelle anlegt.
 *  Eine zweite Kopie waere genau die stille Falle, vor der der fts_artikel-Kommentar unten
 *  warnt — nur eine Ebene hoeher (§5). Index erst NACH dem Laden (Schritt 6). */
export const DDL_BASIS: Record<BasisTabelle, (name: string) => string> = {
  erlasse: (n) => `CREATE TABLE ${n} (key TEXT PRIMARY KEY, ebene TEXT NOT NULL, kanton TEXT, sr TEXT,
            abkuerzung TEXT NOT NULL, titel TEXT NOT NULL, rechtsgebiet TEXT, status TEXT)`,
  erlass_fassungen: (n) => `CREATE TABLE ${n} (erlass_key TEXT NOT NULL, fassungs_token TEXT NOT NULL,
            gueltig_von TEXT, gueltig_bis TEXT, stand TEXT, quelle_url TEXT NOT NULL,
            as_fundstelle TEXT, abgerufen TEXT, sha TEXT,
            PRIMARY KEY (erlass_key, fassungs_token))`,
  artikel: (n) => `CREATE TABLE ${n} (erlass_key TEXT NOT NULL, fassungs_token TEXT NOT NULL,
            art_id TEXT NOT NULL, ord INTEGER, artikel TEXT, artikel_label TEXT, marg TEXT,
            grundlage TEXT, quelle_url TEXT, bloecke_json TEXT NOT NULL, sha TEXT,
            PRIMARY KEY (erlass_key, fassungs_token, art_id))`,
};

/** Spaltenlisten == lokale Zieltabellen; `ladeTabelle` liest sie 1:1.
 *  `rowid` bei `artikel` EXPLIZIT — nicht kosmetisch, sondern tragend: api/suche.ts joint
 *  `fts_artikel` (contentless) ueber `a.rowid = fts_artikel.rowid` auf `artikel`. Wuerde die
 *  Ziel-rowid implizit vergeben, hinge die Korrektheit daran, dass die lokalen artikel-rowids
 *  lueckenlos 1..N sind. Das gilt heute zufaellig (frisch gebaute DB ohne DELETE), ist aber
 *  nirgends garantiert — eine einzige Luecke in der Quelle verschiebt alle folgenden Zeilen
 *  und liefert im Betrieb den FALSCHEN Artikel als Suchtreffer (Gegenpruefungs-Befund B2, am
 *  Minimalbeispiel reproduziert). Mit expliziter rowid ist die Kopplung unabhaengig von der
 *  Lueckenlosigkeit korrekt. */
export const SPALTEN_BASIS: Record<BasisTabelle, string[]> = {
  erlasse: ['key', 'ebene', 'kanton', 'sr', 'abkuerzung', 'titel', 'rechtsgebiet', 'status'],
  erlass_fassungen: ['erlass_key', 'fassungs_token', 'gueltig_von', 'gueltig_bis', 'stand',
    'quelle_url', 'as_fundstelle', 'abgerufen', 'sha'],
  artikel: ['rowid', 'erlass_key', 'fassungs_token', 'art_id', 'ord', 'artikel', 'artikel_label',
    'marg', 'grundlage', 'quelle_url', 'bloecke_json', 'sha'],
};

/** Liest die Signatur-Marken in EINER Abfrage — ein Request statt fuenf. `ESCAPE` haelt das
 *  `_` im Praefix literal, sonst waere es ein LIKE-Platzhalter. */
export const SQL_SIG_MARKEN =
  "SELECT group_concat(schluessel || '=' || wert, char(10)) FROM sync_meta WHERE schluessel LIKE 'sig\\_%' ESCAPE '\\'";

/**
 * Zerlegt die Antwort auf `SQL_SIG_MARKEN` in eine Tabelle→Signatur-Karte.
 *
 * `null` (Tabelle `sync_meta` fehlt, erster Lauf oder stmt-Fehler) ergibt eine LEERE Karte —
 * und eine leere Karte heisst in `skipEntscheid()` «Neuaufbau». Ein nicht lesbarer Marken-
 * bestand darf nie als «unveraendert» durchgehen (§8).
 */
export function sigMarkenAusText(roh: string | null): Map<string, string> {
  const marken = new Map<string, string>();
  for (const zeile of (roh ?? '').split('\n')) {
    const i = zeile.indexOf('=');
    if (i > 4 && zeile.startsWith('sig_')) marken.set(zeile.slice(4, i), zeile.slice(i + 1));
  }
  return marken;
}

/**
 * Lokale Soll-Signaturen aller fuenf HOT-Tabellen.
 *
 * Basis-Tabellen: Ziel-DDL + Inhalts-sha aus dem committeten `daten-manifest.json`. Fehlt ein
 * Manifest-Eintrag, wird `''` gehasht — die Signatur weicht dann von jeder frueheren ab und
 * die Tabelle wird neu gebaut (nie uebersprungen).
 * FTS-Tabellen: Ziel-DDL + Inhalt der lokalen Schatten-Tabellen, als `[tabelle, ddl, ladungen]`
 * hereingereicht, damit dieses Modul kein `node:sqlite` braucht.
 */
export function signaturenLokal(
  manifestNormtext: Partial<Record<string, { zeilen: number; sha: string }>>,
  sollZeilen: Record<string, number>,
  fts: Array<[string, string, Iterable<SchattenLadungLese>]>,
): Map<string, Signatur> {
  const sig = new Map<string, Signatur>();
  for (const t of BASIS) {
    sig.set(t, {
      signatur: signaturBasis(DDL_BASIS[t](t), manifestNormtext[t]?.sha ?? ''),
      sollZeilen: sollZeilen[t] ?? -1,
    });
  }
  for (const [tabelle, ddl, ladungen] of fts) {
    sig.set(tabelle, { signatur: signaturFts(ddl, ladungen), sollZeilen: sollZeilen[tabelle] ?? -1 });
  }
  return sig;
}

// ─── Kopplungs-Beweis fuer den TEILBAU ───────────────────────────────────────

/** Probenstellen ueber die ganze rowid-Spannweite, als Anteile.
 *  Der letzte Anteil ist bewusst 1.0 (= letzte Zeile): eine Umsortierung, die erst ganz am
 *  Ende beginnt, entginge einer Streuung, die bei 0,99 aufhoert (Gegenpruefung Runde 3).
 *  Fuenf aufeinanderfolgende rowids aus EINER Region haetten eine Verschiebung, die weiter
 *  hinten beginnt, glatt verpasst (Runde 2, Befund 7). */
export const PROBEN_ANTEILE = [0, 0.17, 0.37, 0.53, 0.71, 0.89, 1] as const;

/** Die konkreten 0-basierten Probenstellen fuer `n` Zeilen (leer bei leerer Tabelle). */
export function probenIndices(n: number): number[] {
  if (n <= 0) return [];
  return [...new Set(PROBEN_ANTEILE.map((a) => Math.min(n - 1, Math.floor(n * a))))];
}

/**
 * Beweist, dass die LIVE-Basistabellen zu der lokalen DB passen, aus der ein FTS-Index
 * gebaut wird — noetig immer dann, wenn `fts_artikel` neu gebaut, `artikel` aber
 * uebersprungen wird (frueher: der Handschalter `--nur-fts`, seit dem 15.9.2026 der
 * regulaere Teilbau des Skip-Plans).
 *
 * WARUM (Gegenpruefungs-Befund B1, schwerster Befund): der FTS-Index ist contentless und
 * haengt ueber `fts_artikel.rowid == artikel.rowid` an der LIVE-Tabelle. Hinkt die hinterher,
 * zeigt die Suche systematisch den FALSCHEN Artikel — und weil Schritt 8 trotzdem die volle
 * Frische-Marke schreibt, waere der Waechter dazu auch noch gruen geworden.
 *
 * Geprueft werden ALLE DREI Basistabellen, nicht nur `artikel`: Schritt 8 stempelt einen
 * manifest_sha, der auch fuer `erlasse`/`erlass_fassungen` gilt (Runde 2, Befund 7). Die
 * Zeilenzahl allein schliesst eine Verschiebung nicht aus (gleich viele, andere Reihenfolge)
 * — darum zusaetzlich die gestreuten rowid-Proben.
 *
 * @returns Befunde; leeres Array heisst «deckungsgleich».
 */
export async function pruefeKopplung(leser: {
  lokalZeilen: (tabelle: BasisTabelle) => number;
  remoteZeilen: (tabelle: BasisTabelle) => Promise<number>;
  lokaleProbe: (index: number) => { rid: number; schluessel: string } | undefined;
  remoteProbe: (rid: number) => Promise<string | null>;
}): Promise<string[]> {
  const befunde: string[] = [];
  for (const t of BASIS) {
    const lokal = leser.lokalZeilen(t);
    const remote = await leser.remoteZeilen(t);
    if (lokal !== remote) {
      befunde.push(
        `live ${t}=${remote}, lokal=${lokal} — der FTS-Index wuerde auf einen fremden ` +
          'Zeilenbestand zeigen (falsche Treffer).',
      );
    }
  }
  if (befunde.length > 0) return befunde;
  for (const i of probenIndices(leser.lokalZeilen('artikel'))) {
    const p = leser.lokaleProbe(i);
    if (!p) continue;
    const ist = await leser.remoteProbe(p.rid);
    if (ist !== p.schluessel) {
      befunde.push(
        `rowid ${p.rid} zeigt live auf «${ist}», lokal auf «${p.schluessel}» — die ` +
          'rowid-Kopplung ist verschoben.',
      );
    }
  }
  return befunde;
}
