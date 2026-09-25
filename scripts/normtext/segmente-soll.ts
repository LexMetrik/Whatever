/**
 * scripts/normtext/segmente-soll.ts — reine Soll-/Basislinien-Logik für
 * `check:segmente` (QS-KORPUS). Ausgelagert aus `segmente-logik.ts` (Runde 3,
 * 25.9.2026 — §6.6 Datei-Schlankheit), dort re-exportiert. Kein DOM, keine I/O.
 */

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
