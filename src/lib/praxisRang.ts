// Herkunft: KATALOG-ROADMAP (git 3fd5db8f9:KATALOG-ROADMAP.md)

// ─── Praxis-Rang der Werkzeuge (Auftrag David 10.6.2026) ─────────────────────
//
// «analysiere grundlegend welche engines in der praxis gebraucht werden und
// teile das UI weiter danach auf»: Drei Gebrauchsklassen, kuratiert aus der
// Praxis-Abdeckungskarte (KATALOG-ROADMAP Teil A/B, Praxiswert H×R×D):
//   1 = ALLTAG (täglich/wöchentlich; Fristen-Haftungskern, Standardrechnungen,
//       Standard-Schreiben) — stehen in ihrer Kategorie ZUOBERST,
//   2 = REGELMÄSSIG (typische Mandats-Aufgaben),
//   3 = GELEGENTLICH (Gründungen, Vorsorge-Planung, Spezialfälle).
// Nicht gelistete IDs erhalten Rang 2 (neutral) — die Liste ist Kuratierung
// (fachliche Aussage Claude, Abnahme David offen), kein Gate.

const RANG_1_ALLTAG: ReadonlySet<string> = new Set([
  // Fristen (verpasste Frist = Haftung; KATALOG-ROADMAP Rang 1–8)
  'tagerechner', 'zpo-fristen', 'schkg-fristen',
  'verjaehrung', 'mietrecht', 'kuendigung-sperrfristen',
  // Zuständigkeit (Eingangsfrage jedes Mandats; S-3: vier Rechtsweg-Felder)
  'zustaendigkeit', 'schkg-zustaendigkeit', 'straf-zustaendigkeit',
  // Gebühren & Beträge (Standardrechnung jeder Forderung/Betreibung)
  'verzugszins', 'betreibungskosten',
  // Vorlagen (Standard-Schreiben des Kanzleialltags)
  'vollmacht', 'kuendigung-arbeitgeber', 'kuendigung-arbeitnehmer',
  'kuendigung-mieter', 'kuendigung-vertrag', 'mahnung',
]);

const RANG_3_GELEGENTLICH: ReadonlySet<string> = new Set([
  'ag-gruendung', 'gmbh-gruendung', 'kapitalerhoehung', 'statuten', 'gv-vr-beschluss',
  'eigenhaendiges-testament', 'oeffentliches-testament', 'erbvertrag',
  'erbverzichtsvertrag', 'erbteilungsvereinbarung', 'patientenverfuegung',
  'vorsorgeauftrag', 'teuerungsrechner', 'iprg', 'verrechnungssteuer',
  'grundstueckgewinnsteuer', 'auslaenderrecht-fristen', 'datenschutz-fristen',
]);

export function praxisRang(id: string): 1 | 2 | 3 {
  if (RANG_1_ALLTAG.has(id)) return 1;
  if (RANG_3_GELEGENTLICH.has(id)) return 3;
  return 2;
}
