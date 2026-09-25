/**
 * scripts/normtext/segmente-soll.ts — reine Soll-/Basislinien-Logik für
 * `check:segmente` (QS-KORPUS). Ausgelagert aus `segmente-logik.ts` (Runde 3,
 * 25.9.2026 — §6.6 Datei-Schlankheit), dort re-exportiert. Kein DOM, keine I/O:
 * alles hier ist über In-Memory-Werte testbar (G4: «Einheitstests für B6 und B9»).
 */
import { createHash } from 'node:crypto';

export interface Fingerabdruck {
  laenge: number;
  hash: string; // "hashA.hashB", beide Werte base36
}

// ── Soll-Datei (NACHTRAG: committetes, klartextfreies Ist-Soll je Erlass) ──

export interface SollPin {
  eli: string;
  konsolidierung: string;
  htmlN: number;
}

/**
 * G1 (Runde 3): Zeilen ohne Zeilen-Fingerabdruck, je Grund — in der Soll-Datei
 * mitgeführt, damit auch Modus B (ohne HTML) die Zahl in JEDEM Lauf ausgeben
 * kann. Rein aus der HTML abgeleitet (deterministisch), Teil des Soll-Inhalts.
 */
export interface ZeilenStatistik {
  tabellen: number;
  tabellenOhneZeilenFp: number; // Tabellen, in denen KEINE Zeile einen Zeilen-Fingerabdruck trägt
  zeilen: number; // Zeilen mit mindestens einer td/th-Zelle
  mitFingerabdruck: number;
  ungeschuetzt: number; // Zeilen ohne Zeilen-Fingerabdruck UND ohne Zelle ≥ SEGMENT_MINDESTLAENGE — Inhalt gar nicht geprüft
  ohne: {
    kopf: number; // <thead> oder nur <th>-Zellen (Projektion fasst Köpfe spaltenweise zusammen, G2)
    einzelzelle: number; // höchstens EINE nicht-leere Zelle — die Zeile IST die Zelle (Zellregel greift)
    marken: number; // ≥ 2 nicht-leere Zellen, aber jede Nachbarschaft durch eine Listenmarke (<dt>) getrennt
    bild: number; // wie «marken», getrennt durch eine Bildzelle (Projektion: bildKacheln, Bild-Metadaten zwischen den Zellen)
  };
}

export function leereZeilenStatistik(): ZeilenStatistik {
  return { tabellen: 0, tabellenOhneZeilenFp: 0, zeilen: 0, mitFingerabdruck: 0, ungeschuetzt: 0, ohne: { kopf: 0, einzelzelle: 0, marken: 0, bild: 0 } };
}

export function addiereZeilenStatistik(ziel: ZeilenStatistik, quelle: ZeilenStatistik): void {
  ziel.tabellen += quelle.tabellen;
  ziel.tabellenOhneZeilenFp += quelle.tabellenOhneZeilenFp;
  ziel.ungeschuetzt += quelle.ungeschuetzt;
  ziel.zeilen += quelle.zeilen;
  ziel.mitFingerabdruck += quelle.mitFingerabdruck;
  ziel.ohne.kopf += quelle.ohne.kopf;
  ziel.ohne.einzelzelle += quelle.ohne.einzelzelle;
  ziel.ohne.marken += quelle.ohne.marken;
  ziel.ohne.bild += quelle.ohne.bild;
}

export function zeilenStatistikGleich(a: ZeilenStatistik | undefined, b: ZeilenStatistik | undefined): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export interface SollDatei {
  pin: SollPin;
  segmenterVersion: number;
  zeilenStatistik?: ZeilenStatistik; // ab SEGMENTER_VERSION 3 (G1)
  artikel: Record<string, [number, string][]>; // eId -> [[laenge, hash], …] (kompakt statt Objekt je Eintrag)
}

export function fingerabdrueckeZuSoll(fps: Fingerabdruck[]): [number, string][] {
  return fps.map((fp) => [fp.laenge, fp.hash]);
}

export function sollZuFingerabdruecke(paare: [number, string][]): Fingerabdruck[] {
  return paare.map(([laenge, hash]) => ({ laenge, hash }));
}

export function pinIdentGleich(a: SollPin, b: SollPin): boolean {
  return a.eli === b.eli && a.konsolidierung === b.konsolidierung && a.htmlN === b.htmlN;
}

/** Inhalts-Gleichheit (Mengen je eId, Reihenfolge egal) — Grundlage für «Soll veraltet» (C) und B6. */
export function sollInhaltGleich(
  a: Record<string, [number, string][]>,
  b: Record<string, [number, string][]>,
): boolean {
  const schluesselA = Object.keys(a).sort();
  const schluesselB = Object.keys(b).sort();
  if (schluesselA.length !== schluesselB.length) return false;
  for (let i = 0; i < schluesselA.length; i++) if (schluesselA[i] !== schluesselB[i]) return false;
  for (const eId of schluesselA) {
    const sa = new Set(a[eId].map(([l, h]) => `${l}:${h}`));
    const sb = new Set(b[eId].map(([l, h]) => `${l}:${h}`));
    if (sa.size !== sb.size) return false;
    for (const v of sa) if (!sb.has(v)) return false;
  }
  return true;
}

// ── B6 (G4, Runde 3): Soll-Änderung im committeten Bereich klassieren ───────

export type SollAenderung =
  | 'unveraendert' // Inhalt gleich (nur Formatierung o.ä.)
  | 'pinwechsel' // Pin gewandert — Inhaltswechsel belegt (Frische-Arm/Kaskade)
  | 'neu' // Datei in der Basis nicht vorhanden — ohne Vergleichsbasis
  | 'versionswechsel' // segmenterVersion ≠ Basis — ohne Vergleichsbasis
  | 'geloescht' // Modus B meldet «kein Soll» selbst rot
  | 'unlesbar' // nicht parsebar ⇒ Verstoss (früher still übersprungen)
  | 'verstoss'; // Inhalt/Statistik geändert OHNE Pin-/Versionswechsel

/** Klassiert EINE geänderte Soll-Datei; `alt`/`neu` = Dateiinhalt oder `null` (fehlt). */
export function klassiereSollAenderung(alt: string | null, neu: string | null): SollAenderung {
  if (neu === null) return 'geloescht';
  if (alt === null) return 'neu';
  let altSoll: SollDatei;
  let neuSoll: SollDatei;
  try {
    altSoll = JSON.parse(alt) as SollDatei;
    neuSoll = JSON.parse(neu) as SollDatei;
  } catch {
    return 'unlesbar';
  }
  if (!altSoll?.pin || !neuSoll?.pin || !altSoll.artikel || !neuSoll.artikel) return 'unlesbar';
  if (altSoll.segmenterVersion !== neuSoll.segmenterVersion) return 'versionswechsel';
  if (!pinIdentGleich(altSoll.pin, neuSoll.pin)) return 'pinwechsel';
  const gleich =
    sollInhaltGleich(altSoll.artikel, neuSoll.artikel) &&
    zeilenStatistikGleich(altSoll.zeilenStatistik, neuSoll.zeilenStatistik);
  return gleich ? 'unveraendert' : 'verstoss';
}

// ── Modus-C-Beleg (G4b): Reibung, keine Kryptografie ────────────────────────
//
// Jede Soll-Datei OHNE Vergleichsbasis (neu oder Versionswechsel) ist für B6
// blind — Modus B kann ihren Inhalt nicht gegen einen früheren Stand prüfen.
// Dann verlangt Modus B einen committeten Beleg, dass die Soll-Dateien aus der
// HTML erzeugt wurden: `--schreiben` (die einzige Ableitung HTML → Soll)
// schreibt ihn, mit Hash über ALLE Soll-Dateien. Eine Hand-Änderung danach
// (P6 im PR-Stand) passt nicht mehr zum Hash ⇒ rot. Muster wie `anhebungen` in
// messwerte/steuerflaeche.json: kein Schutz gegen Vorsatz, sondern gegen das
// stille Durchrutschen. Ein SHA-256 statt eines eigenen Rolling-Hashes, weil
// der Beleg ganze Dateien deckt und `node:crypto` ohnehin da ist.

export const BELEG_DATEINAME = '_modus-c-beleg.json';

export interface ModusCBeleg {
  segmenterVersion: number;
  sollHash: string; // sha256 über alle Soll-Dateien (Name + Inhalt, nach Name sortiert)
  dateien: number;
  datum: string; // YYYY-MM-DD des Schreibens — bleibt bei unverändertem Hash stehen (byte-gleiche Wiederholung)
}

export function sollBelegHash(dateien: ReadonlyArray<{ name: string; inhalt: string }>): string {
  const h = createHash('sha256');
  for (const d of [...dateien].sort((x, y) => (x.name < y.name ? -1 : x.name > y.name ? 1 : 0))) {
    h.update(d.name, 'utf8');
    h.update('\u0000', 'utf8');
    h.update(d.inhalt, 'utf8');
    h.update('\u0000', 'utf8');
  }
  return h.digest('hex');
}

export function pruefeBeleg(
  beleg: ModusCBeleg | null,
  erwartet: { segmenterVersion: number; sollHash: string },
): { ok: true } | { ok: false; grund: string } {
  if (!beleg) return { ok: false, grund: `kein ${BELEG_DATEINAME}` };
  if (beleg.segmenterVersion !== erwartet.segmenterVersion) {
    return { ok: false, grund: `Beleg-Version ${beleg.segmenterVersion} ≠ SEGMENTER_VERSION ${erwartet.segmenterVersion}` };
  }
  if (beleg.sollHash !== erwartet.sollHash) {
    return { ok: false, grund: 'Beleg-Hash passt nicht zu den Soll-Dateien (Soll nach --schreiben geändert?)' };
  }
  return { ok: true };
}

export interface B6Urteil {
  verstoss: string[]; // Pfade: Inhaltswechsel ohne Pin-/Versionswechsel oder unlesbar
  ohneBasisNeu: string[];
  ohneBasisVersion: string[];
  belegPflicht: boolean;
  belegFehler?: string; // gesetzt ⇔ belegPflicht und Beleg ungültig
}

/**
 * Gesamturteil B6 aus den klassierten Änderungen. `beleg` wird nur gebraucht,
 * wenn mindestens eine Datei ohne Vergleichsbasis ist (neu/Versionswechsel).
 */
export function urteileB6(
  aenderungen: ReadonlyArray<{ pfad: string; art: SollAenderung }>,
  beleg: () => { ok: true } | { ok: false; grund: string },
): B6Urteil {
  const verstoss = aenderungen.filter((a) => a.art === 'verstoss' || a.art === 'unlesbar').map((a) => a.pfad);
  const ohneBasisNeu = aenderungen.filter((a) => a.art === 'neu').map((a) => a.pfad);
  const ohneBasisVersion = aenderungen.filter((a) => a.art === 'versionswechsel').map((a) => a.pfad);
  const belegPflicht = ohneBasisNeu.length + ohneBasisVersion.length > 0;
  const urteil: B6Urteil = { verstoss, ohneBasisNeu, ohneBasisVersion, belegPflicht };
  if (belegPflicht) {
    const b = beleg();
    if (!b.ok) urteil.belegFehler = b.grund;
  }
  return urteil;
}

// ── B9: --schreiben ohne vollständigen Cache ────────────────────────────────

/**
 * Welche Soll-Dateien sind gegenüber dem DEKLARIERTEN Pin (fedlex-cache.sh) +
 * heutiger Segmenter-Version nicht aktuell? Leer ⇒ `--schreiben` darf ohne
 * Cache überspringen (nichts zu tun); sonst ⇒ FEHLER (Update nötig, ohne HTML
 * unmöglich). Reiner String-Vergleich, keine HTML.
 */
export function sollAktualitaet(
  eintraege: ReadonlyArray<{ name: string } & SollPin>,
  liesSoll: (name: string) => SollDatei | null,
  segmenterVersion: number,
): { fehlend: string[]; veraltet: string[] } {
  const fehlend: string[] = [];
  const veraltet: string[] = [];
  for (const e of eintraege) {
    const soll = liesSoll(e.name);
    if (!soll) {
      fehlend.push(e.name);
      continue;
    }
    const pin: SollPin = { eli: e.eli, konsolidierung: e.konsolidierung, htmlN: e.htmlN };
    if (!pinIdentGleich(soll.pin, pin) || soll.segmenterVersion !== segmenterVersion) veraltet.push(e.name);
  }
  return { fehlend, veraltet };
}

// ── Basislinie (§ Architektur Ziff. 7 / NACHTRAG Punkt E) ──────────────────

export interface BasislinienEintrag {
  erlass: string; // Projektions-KEY, z.B. "STHG"
  eId: string; // z.B. "art_56"
  hash: string; // Fingerabdruck.hash — DER Schlüssel-Teil (NACHTRAG E: "Segment-Hash")
  laenge: number; // Fingerabdruck.laenge — Zusatzangabe für Lesbarkeit/Kollisionsschutz
  auszug: string; // ≤ 80 Zeichen Klartext, NUR hier erlaubt (kurzer Bug-Beleg, keine Korpus-Kopie)
  befund: string; // 'normtext-treue-01' | '-02' | '-03' | '-10' | '-tabellenkopf' | … (G8: stets «normtext-treue-…», Einheitstest)
}

export interface BasislinienAbgleich<T> {
  bekannt: BasislinienEintrag[]; // heute noch gefunden, grandfathered (kein Rot)
  neu: T[]; // NICHT in Basislinie ⇒ rot (behält alle Felder des Aufrufers, z.B. `auszug`)
  veraltet: BasislinienEintrag[]; // in Basislinie, aber heute NICHT mehr gefunden ⇒ rot (Eintrag entfernen)
  uebersprungen: BasislinienEintrag[]; // B10/G7: Erlass bzw. Artikel diesen Lauf gar nicht geprüft ⇒ weder bekannt noch veraltet
}

/**
 * Gleicht die HEUTE gefundenen fehlenden Segmente (Schlüssel erlass+eId+hash)
 * gegen die committete Basislinie ab. Rein — keine I/O, keine Exit-Codes.
 * Generisch über `T`, damit Aufrufer-Zusatzfelder (z.B. ein Modus-C-`auszug`)
 * in `neu` erhalten bleiben, ohne sie hier zu kennen.
 *
 * @param geprueftErlasse B10 (Gegenprüfung 25.9.2026): die Erlass-KEYs, die
 *   DIESEN Lauf tatsächlich geprüft wurden. Ohne dieses Argument (ältere
 *   Aufrufer/Tests) unverändertes Verhalten — JEDER nicht mehr gefundene
 *   Eintrag gilt als veraltet. MIT Argument gilt ein Basislinien-Eintrag eines
 *   Erlasses, das gar nicht geprüft wurde (fehlendes/veraltetes Soll — der
 *   Erlass wird übersprungen, s. check-segmente.ts), als `uebersprungen`
 *   statt `veraltet`: das Tor riet zuvor fälschlich «Eintrag entfernen», obwohl
 *   der Erlass schlicht nicht geprüft wurde (P8/P9/P12 der Gegenprüfung).
 * @param ungepruefteArtikel G7 (Runde 3): `"<ERLASS>\u0000<eId>"` der Artikel
 *   OHNE Projektions-Eintrag — nicht geprüft (eigener Rückschritt-Fehler im
 *   Aufrufer); ihre Basislinien-Einträge sind `uebersprungen`, nicht «veraltet
 *   — Eintrag entfernen» (P10 der Gegenprüfung 2).
 */
export function gleicheBasislinieAb<T extends { erlass: string; eId: string; hash: string }>(
  heutigeFunde: readonly T[],
  basislinie: readonly BasislinienEintrag[],
  geprueftErlasse?: ReadonlySet<string>,
  ungepruefteArtikel?: ReadonlySet<string>,
): BasislinienAbgleich<T> {
  const schluessel = (e: { erlass: string; eId: string; hash: string }): string =>
    `${e.erlass}\u0000${e.eId}\u0000${e.hash}`;
  const basisMap = new Map(basislinie.map((e) => [schluessel(e), e]));
  const fundSchluessel = new Set(heutigeFunde.map(schluessel));

  const bekannt: BasislinienEintrag[] = [];
  const neu: T[] = [];
  for (const fund of heutigeFunde) {
    const eintrag = basisMap.get(schluessel(fund));
    if (eintrag) bekannt.push(eintrag);
    else neu.push(fund);
  }
  const geprueft = (e: BasislinienEintrag): boolean =>
    (!geprueftErlasse || geprueftErlasse.has(e.erlass)) &&
    !(ungepruefteArtikel && ungepruefteArtikel.has(`${e.erlass}\u0000${e.eId}`));
  const nichtGefunden = basislinie.filter((e) => !fundSchluessel.has(schluessel(e)));
  const veraltet = nichtGefunden.filter(geprueft);
  const uebersprungen = nichtGefunden.filter((e) => !geprueft(e));
  return { bekannt, neu, veraltet, uebersprungen };
}
