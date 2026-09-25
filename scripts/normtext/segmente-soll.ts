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

export interface SollDatei {
  pin: SollPin;
  segmenterVersion: number;
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
  befund: string; // 'normtext-treue-01' | '02' | '03' | '10' | 'unklassiert-…'
}

export interface BasislinienAbgleich<T> {
  bekannt: BasislinienEintrag[]; // heute noch gefunden, grandfathered (kein Rot)
  neu: T[]; // NICHT in Basislinie ⇒ rot (behält alle Felder des Aufrufers, z.B. `auszug`)
  veraltet: BasislinienEintrag[]; // in Basislinie, aber heute NICHT mehr gefunden ⇒ rot (Eintrag entfernen)
  uebersprungen: BasislinienEintrag[]; // B10: Erlass diesen Lauf gar nicht geprüft (kein/veraltetes Soll) ⇒ weder bekannt noch veraltet
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
 */
export function gleicheBasislinieAb<T extends { erlass: string; eId: string; hash: string }>(
  heutigeFunde: readonly T[],
  basislinie: readonly BasislinienEintrag[],
  geprueftErlasse?: ReadonlySet<string>,
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
  const nichtGefunden = basislinie.filter((e) => !fundSchluessel.has(schluessel(e)));
  const veraltet = geprueftErlasse ? nichtGefunden.filter((e) => geprueftErlasse.has(e.erlass)) : nichtGefunden;
  const uebersprungen = geprueftErlasse ? nichtGefunden.filter((e) => !geprueftErlasse.has(e.erlass)) : [];
  return { bekannt, neu, veraltet, uebersprungen };
}
