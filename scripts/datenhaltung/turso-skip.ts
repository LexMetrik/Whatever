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
