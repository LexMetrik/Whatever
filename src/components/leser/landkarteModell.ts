// ─── W2·28-TREFFER-LANDKARTE · L-1 · Die reine Massstabs-Rechnung ────────────
//
// Diese Datei kennt weder React noch DOM. Sie beantwortet EINE Frage: wo im
// Dokument liegt ein Baustein — anteilig, zwischen 0 (Dokumentanfang) und 1
// (Dokumentende). Alles Sichtbare (SVG, Farbe, Klick) steht in
// `./TrefferLandkarte.tsx`; §3 Schichtentrennung, §2 rein und deterministisch.
//
// ── WARUM AUS DEN DATEN UND NICHT AUS DEM DOM (§15) ─────────────────────────
// Der Gesetz-Leser trägt beim OR 1686 Artikel in EINER Lesespalte. Eine
// Landkarte, die ihre Marken aus gemessenen `getBoundingClientRect()` ableitet,
// müsste bei jedem Scroll, jedem Aufklapp, jeder Schriftgrösse und jedem
// Fussnoten-Schalter neu messen — 1686 Layout-Anfragen in einem Scroll-Handler
// ist genau das Layout-Thrashing, das der Skill `perf` verbietet. Der Massstab
// hier kommt darum aus dem UMFANG der Bausteine (Zeichenzahl des amtlichen
// Textes), den die geladenen Daten ohnehin tragen. Er ist eine Näherung an die
// gerenderte Höhe und wird als solche benannt (§8): die Landkarte sagt «etwa
// hier», nicht «genau hier» — für «genau hier» gibt es den Sprung selbst, der
// unverändert über die bestehende Treffer-Navigation läuft.
//
// ── EINE TREFFERQUELLE (§5) ─────────────────────────────────────────────────
// `landkarteMarken` ZÄHLT NICHTS. Es bekommt die fertigen Treffer der
// Dokumentsuche (Gesetz: `LeserTreffer[]` aus `leserSuche.ts`; Entscheid:
// `SuchTreffer[]` aus `entscheidLeserRegeln.ts`) und ordnet ihnen nur ihre Lage
// zu. Eine Marke je Treffer-Eintrag, in Eingangsreihenfolge — daher gilt
// `marken.length === treffer.length`, solange jeder Treffer einen Baustein der
// Spur trifft. Trifft er keinen (Datenlage ausserhalb der Spur), wird die Marke
// WEGGELASSEN statt geraten (§8); `src/tests/leser-landkarte-w228.test.ts` hält
// beides fest.

/** Ein Dokument-Baustein in Dokument-Reihenfolge (Artikel, Erwägung, Block). */
export interface LandkarteEinheit {
  /** Schlüssel des Sprungziels (Artikel-Token bzw. Anker-Id). Leer = kein Ziel. */
  id: string;
  /** Beschriftung für den zugänglichen Namen («Art. 12», «E. 4.4»). */
  label: string;
  /** Umfang im Dokument, in Zeichen des amtlichen Textes. Nie negativ. */
  umfang: number;
  /** Abschnitts-Etikett (oberste Gliederungsstufe bzw. Entscheid-Abschnitt). */
  abschnitt: string | null;
}

/** Ein Baustein samt seiner anteiligen Lage im Dokument (0 ≤ von ≤ bis ≤ 1). */
export interface LandkarteFeld extends LandkarteEinheit {
  von: number;
  bis: number;
}

/** Eine Treffer-Marke auf der Landkarte. */
export interface LandkarteMarke {
  id: string;
  label: string;
  /** Fundstellen in diesem Baustein — durchgereicht, nie nachgezählt (§5). */
  anzahl: number;
  von: number;
  bis: number;
}

/** Ein zusammenhängender Abschnitt (Etikett am Rand der Landkarte). */
export interface LandkarteBand {
  label: string;
  von: number;
  bis: number;
}

/** Mindestumfang eines Bausteins. Ein aufgehobener Artikel trägt null Zeichen;
 *  ohne diesen Boden hätte er die Höhe 0 und wäre weder sicht- noch anklickbar.
 *  Der Wert verschiebt die Proportionen des Dokuments nicht messbar. */
const MINDEST_UMFANG = 1;

/**
 * Bausteine → anteilige Lagen. Die Summe der Umfänge ist der Massstab; jedes
 * Feld belegt seinen Anteil daran, lückenlos und in Reihenfolge.
 *
 * Leere Eingabe ⇒ leere Spur (kein Streifen, §8: nichts behaupten).
 */
export function landkarteSpur(einheiten: readonly LandkarteEinheit[]): LandkarteFeld[] {
  if (einheiten.length === 0) return [];
  const masse = einheiten.map((e) => Math.max(MINDEST_UMFANG, Math.round(e.umfang)));
  const gesamt = masse.reduce((a, b) => a + b, 0);
  const felder: LandkarteFeld[] = [];
  let laufend = 0;
  for (let i = 0; i < einheiten.length; i++) {
    const von = laufend / gesamt;
    laufend += masse[i];
    // Das letzte Feld endet exakt auf 1 — Gleitkomma-Summen tun das sonst
    // knapp daneben, und die Landkarte hörte einen Haaresbreite vor dem
    // Dokumentende auf.
    const bis = i === einheiten.length - 1 ? 1 : laufend / gesamt;
    felder.push({ ...einheiten[i], von, bis });
  }
  return felder;
}

/**
 * Treffer der Dokumentsuche → Marken auf der Spur.
 *
 * Die Reihenfolge der Eingabe bleibt erhalten. Ein Treffer, dessen `id` in der
 * Spur nicht vorkommt, erzeugt KEINE Marke: eine Marke an geratener Stelle wäre
 * ein falscher Sprung (§1/§8). Das ist der einzige Weg, auf dem
 * `marken.length < treffer.length` werden kann.
 */
export function landkarteMarken(
  spur: readonly LandkarteFeld[],
  treffer: readonly { id: string; anzahl: number }[],
): LandkarteMarke[] {
  if (spur.length === 0 || treffer.length === 0) return [];
  const lage = new Map<string, LandkarteFeld>();
  // Erster Eintrag gewinnt: die Spur ist in Dokument-Reihenfolge, und bei einer
  // (nicht erwarteten) doppelten Id ist die frühere Stelle die, die der Leser
  // zuerst erreicht.
  for (const f of spur) if (f.id !== '' && !lage.has(f.id)) lage.set(f.id, f);
  const marken: LandkarteMarke[] = [];
  for (const t of treffer) {
    const f = lage.get(t.id);
    if (!f) continue;
    marken.push({ id: f.id, label: f.label, anzahl: t.anzahl, von: f.von, bis: f.bis });
  }
  return marken;
}

/**
 * Zusammenhängende Abschnitte der Spur (gleiches Etikett hintereinander).
 * Bausteine ohne Etikett erzeugen kein Band — ein Dokument ohne Gliederung
 * bekommt also gar keine Etiketten statt erfundener (§8).
 */
export function landkarteBaender(spur: readonly LandkarteFeld[]): LandkarteBand[] {
  const baender: LandkarteBand[] = [];
  for (const f of spur) {
    if (f.abschnitt === null) continue;
    const letzt = baender[baender.length - 1];
    if (letzt && letzt.label === f.abschnitt && letzt.bis === f.von) letzt.bis = f.bis;
    else baender.push({ label: f.abschnitt, von: f.von, bis: f.bis });
  }
  return baender;
}

/**
 * Das Feld an einer anteiligen Stelle (Klick auf den Streifen). Ausserhalb von
 * 0..1 wird geklemmt — ein Klick auf den Streifenrand soll das erste bzw. letzte
 * Feld treffen, nicht ins Leere laufen.
 */
export function feldBeiAnteil(spur: readonly LandkarteFeld[], anteil: number): LandkarteFeld | null {
  if (spur.length === 0) return null;
  const a = Math.min(1, Math.max(0, anteil));
  for (const f of spur) if (a < f.bis) return f;
  return spur[spur.length - 1];
}

/**
 * Die Spanne ALLER Felder einer Id — die Leseposition.
 *
 * Nicht `find`: im Entscheid-Leser meldet der Scroll-Spy einen ABSCHNITTS-Anker
 * («abschnitt-sachverhalt»), den sich alle Blöcke dieses Abschnitts teilen. Das
 * erste Feld allein wäre dann ein Strich am Abschnittsanfang statt der Stelle,
 * an der man liest. Im Gesetz-Leser meldet er einen Artikel-Token, der genau
 * einmal vorkommt — dort ist die Spanne das eine Feld. Unbekannt ⇒ null.
 */
export function bereichZuId(spur: readonly LandkarteFeld[], id: string | null): { von: number; bis: number } | null {
  if (id === null || id === '') return null;
  let von: number | null = null;
  let bis = 0;
  for (const f of spur) {
    if (f.id !== id) continue;
    if (von === null) von = f.von;
    bis = f.bis;
  }
  return von === null ? null : { von, bis };
}
