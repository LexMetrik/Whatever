import type { RevisionBezug } from '../../../lib/normtext/revisionen';

/**
 * Felder, die der Revisions-Generator seit Pfad (c) (S6-D1, PR #1001) schreibt —
 * hier OPTIONAL gelesen, damit die Anzeige mit alten UND neuen Sidecars stimmt
 * (Landereihenfolge egal). Semantik: `scripts/normtext/revisionen-generieren.ts`
 * (`RevisionEintrag`) auf dem #1001-Stand. Entfällt, sobald `RevisionBezug`
 * die Felder selbst trägt.
 * Ergänzung (Rebase auf #1001, 23.9.2026): `RevisionBezug` trägt die drei
 * Felder seither selbst (ohne `null`); der Typ bleibt nur als Lese-Toleranz.
 * Der Zeilen-Schlüssel ist seither `revisionSchluessel` aus
 * `lib/normtext/revisionen` — die hier bis dahin wörtlich kopierte Regel
 * (`zeilenSchluessel`) ist entfallen (§5, eine Regel an einem Ort).
 */
export type RevisionZeile = RevisionBezug & {
  wirkungen?: string[] | null;
  etappen?: string[] | null;
  datumAusErlass?: boolean | null;
};

/** Amtliche Bezeichnungen der Fedlex-Auswirkungs-Typen (`vocabulary/impact-type`,
 *  `skos:prefLabel`@de — Zuordnung wie `WIRKUNG_NACH_TYP` in
 *  `scripts/normtext/revisionen-auswirkungen.ts` auf dem #1001-Stand). Ein
 *  unbekannter Schlüssel wird NICHT angezeigt (keine erfundene Bezeichnung). */
const WIRKUNG_LABEL: Readonly<Record<string, string>> = {
  aenderung: 'Änderung',
  // W3-1 (Audit 25.9.2026): «Aufhebung» stand nackt neben dem Erlasstitel und
  // liess sich als Aufhebung des GANZEN Erlasses lesen (Bsp. PatG AS 2026 232,
  // OR TJPG AS 2026 323) — Fedlex meint hier aber `aufhebung` nur für EINZELNE
  // Bestimmungen (die vollständige Aufhebung trägt den eigenen Schlüssel
  // `vollstaendige-aufhebung` unten und bleibt unverändert).
  aufhebung: 'hebt Bestimmungen auf',
  'vollstaendige-aufhebung': 'Vollständige Aufhebung',
  inkrafttreten: 'Inkrafttreten',
  teilinkraftsetzung: 'Teilinkraftsetzung',
  berichtigung: 'Berichtigung',
  genehmigung: 'Genehmigung',
  verlaengerung: 'Verlängerung',
  geltungsbereich: 'Geltungsbereich',
  'zweite-fundstelle': '2. Fundstelle',
};

/** Die Wirkungen einer Zeile, die eine eigene Marke verdienen: alles ausser
 *  der gewöhnlichen «Änderung» (die ist der Normalfall der Liste). */
export function wirkungsMarken(r: RevisionZeile): string[] {
  return (r.wirkungen ?? []).filter((w) => w !== 'aenderung').map((w) => WIRKUNG_LABEL[w]).filter((l): l is string => !!l);
}
import type { ErlassAufhebung } from '../../../lib/normtext/aufhebungen';
import type { ArtikelRevision } from '../../../lib/verzahnung/artikel-revisionen';

// ─── Modell des Reiters «Änderungen» — S6-Zusätze (Befunde AE-6, AE-8) ───────
//
// Rein, ohne JSX (§3), nur aus Feldern, die die Daten führen — keine
// Heuristik auf Titeln (§2).

/** ELI des Nachfolgers `cc/JJJJ/NNN` → die Kennung seines Änderungs-/Grund-
 *  erlasses in der AS `oc/JJJJ/NNN` (dieselbe Jahres-/Laufnummer, Fedlex-ELI). */
function ocVonCc(eli: string): string | null {
  const m = /^cc\/(\d+)\/(\d+)$/.exec(eli);
  return m ? `/eli/oc/${m[1]}/${m[2]}` : null;
}

/**
 * S6 · AE-6: Gehört eine Revisionszeile NICHT MEHR zu diesem Erlass, weil er
 * aufgehoben ist? Ja, wenn sie am oder nach dem Aufhebungsdatum in Kraft tritt
 * (ein aufgehobener Erlass wird nicht mehr geändert) — gemessen an der BMV:
 * ihr Sidecar führte die Nachfolge-Verordnung AS 2025 408 als «Änderung»,
 * «in Kraft seit 01.03.2026, im Text noch nicht eingearbeitet».
 *
 * `'nachfolger'`, wenn die Zeile der deklarierte Nachfolge-Erlass ist
 * (`lib/normtext/aufhebungen.ts`, ELI belegt); sonst `'nach-aufhebung'`;
 * `null` = gewöhnliche Änderung. ISO-Daten vergleichen lexikografisch (§2).
 */
export function aufhebungsBezug(
  r: Pick<RevisionZeile, 'dateEntryInForce' | 'ocUri' | 'wirkungen'>,
  aufhebung: ErlassAufhebung | undefined,
): 'nachfolger' | 'aufhebend' | 'nach-aufhebung' | null {
  const oc = aufhebung?.nachfolger ? ocVonCc(aufhebung.nachfolger.eli) : null;
  if (oc && r.ocUri?.endsWith(oc)) return 'nachfolger';
  // Neue Sidecars (#1001) tragen die amtliche Wirkung selbst — auch dort, wo
  // `lib/normtext/aufhebungen.ts` (noch) keine Aufhebung deklariert.
  if (r.wirkungen?.includes('vollstaendige-aufhebung')) return 'aufhebend';
  if (!aufhebung) return null;
  return r.dateEntryInForce >= aufhebung.seit ? 'nach-aufhebung' : null;
}

/** Leerraum vereinheitlicht — «AS 2023  680» und «AS 2023 680» sind dieselbe
 *  Fundstelle; sonst kein Umschreiben. */
function fundstelle(s: string | undefined | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * S6 · AE-8/D-10: Ist diese Änderungszeile die LETZTE Textänderung des gerade
 * gelesenen Artikels? Quelle ist der Revisions-Shard des Artikels (amtliche
 * Fussnoten, `lib/verzahnung/artikel-revisionen`) — verglichen wird die
 * AS-Fundstelle, die beide führen. Ohne Fundstelle keine Aussage (§8).
 */
export function trifftArtikel(r: Pick<RevisionBezug, 'roFundstelle'>, artikel: ArtikelRevision | null | undefined): boolean {
  const as = fundstelle(artikel?.as);
  return as !== '' && fundstelle(r.roFundstelle) === as;
}
