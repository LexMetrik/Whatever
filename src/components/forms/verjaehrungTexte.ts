import type { VerjaehrungRegime, Stillstand, Unterbrechung } from '../../lib/verjaehrung';
import { istISO, istKanton, einerVon, type PermalinkSpec } from '../../lib/permalink';

// ─── Beschriftungen des Verjährungsrechners ─────────────────────────────────
//
// Wörtlich aus `VerjaehrungForm.tsx` herausgelöst (W2·29-WERKBANK-START-
// UEBERARBEITUNG U2, 24.9.2026): der volle Rechner `/rechner/verjaehrung` und
// das Schnellwerkzeug der Startseite (`VerjaehrungSchnellForm`) tragen dieselben
// Anspruchstypen und denselben Vorbehalt — EINE Quelle (§5). Muster wie
// `einfacheFristTexte.ts` (react-refresh: keine Nicht-Komponenten-Exporte aus
// `.tsx`). Werte und Reihenfolge unverändert; keine Rechtslogik (§3).

export const VERJ_DISCLAIMER =
  'Automatisierte Orientierungsberechnung der Verjährung (Art. 60, 67, 127 ff. OR, Stand Revision 1.1.2020) – ' +
  'keine Rechtsberatung. Der Kenntniszeitpunkt (Art. 60/67 OR) ist eine Tatfrage und wird als Eingabe übernommen. ' +
  'Nicht abgebildet: strafrechtliche Längerfrist (Art. 60 Abs. 2 OR i.V.m. StGB), Spezialgesetze (z. B. SVG, VG, PrHG), ' +
  'Übergangsrecht für Altfälle vor dem 1.1.2020 (Art. 49 SchlT ZGB) sowie die Wirkung unter Mitverpflichteten ' +
  '(Art. 136 OR). Die Verjährung ist Einrede (Art. 142 OR); der konkrete Fall ist fachlich zu prüfen.';

// UI-Texte und Reihenfolge lokal; die Fristzahlen kommen aus dem Engine-REGIME (§5: eine Quelle).
export const REGIMES: { code: VerjaehrungRegime; label: string; hint: string }[] = [
  { code: 'ordentlich', label: 'Ordentliche Forderung – 10 Jahre (Art. 127 OR)', hint: 'Auffangregel für vertragliche Forderungen ohne Sonderfrist' },
  { code: 'kurz', label: 'Katalogforderung – 5 Jahre (Art. 128 OR)', hint: 'Miet-/Pacht-/Kapitalzinse, periodische Leistungen, Handwerk, Arzt, Anwalt, Arbeitsverhältnis' },
  { code: 'delikt', label: 'Unerlaubte Handlung – 3 / 10 Jahre (Art. 60 Abs. 1 OR)', hint: 'Sach- und Vermögensschaden' },
  { code: 'delikt_person', label: 'Unerlaubte Handlung, Personenschaden – 3 / 20 Jahre (Art. 60 Abs. 1bis OR)', hint: 'Tötung oder Körperverletzung' },
  { code: 'vertrag_person', label: 'Vertraglicher Personenschaden – 3 / 20 Jahre (Art. 128a OR)', hint: 'Körperverletzung/Tötung aus Vertragsverletzung' },
  { code: 'bereicherung', label: 'Ungerechtfertigte Bereicherung – 3 / 10 Jahre (Art. 67 OR)', hint: 'Rückforderung grundloser Zuwendungen' },
];

/** Beispiel-Beginn der relativen Frist (fix, nachvollziehbar) — derselbe Startwert
 *  im vollen Rechner und in der Schnellform. */
export const VJ_BEGINN_DEFAULT = '2024-03-01';

// Permalink (FAHRPLAN-PRAXIS 1.3)
export type VjLink = {
  regime: string; beginnRelativ: string; beginnAbsolut?: string; stichtag: string;
  kanton: string; strafbar?: boolean; stillstaende?: Stillstand[];
  unterbrechungen?: Unterbrechung[]; verzichtAn?: boolean; verzichtDatum?: string; verzichtJahre?: string; verzichtBis?: string;
};
export const VJ_LINK_SPEC: PermalinkSpec<VjLink & Record<string, unknown>> = {
  regime: { p: 're', typ: 'str', gueltig: einerVon('ordentlich', 'kurz', 'delikt', 'delikt_person', 'vertrag_person', 'bereicherung') },
  beginnRelativ: { p: 'br', typ: 'str', gueltig: istISO },
  beginnAbsolut: { p: 'ba', typ: 'str', gueltig: istISO },
  stichtag: { p: 's', typ: 'str', gueltig: istISO },
  kanton: { p: 'k', typ: 'str', gueltig: istKanton },
  strafbar: { p: 'st', typ: 'bool' },
  stillstaende: { p: 'si', typ: 'json', gueltig: (v): boolean => Array.isArray(v) && v.length <= 20 && v.every((e) => e && typeof e === 'object' && istISO((e as Stillstand).von ?? '') && istISO((e as Stillstand).bis ?? '')) },
  unterbrechungen: { p: 'un', typ: 'json', gueltig: (v): boolean => Array.isArray(v) && v.length <= 20 && v.every((e) => e && typeof e === 'object' && ['anerkennung', 'urkunde_urteil', 'betreibungsakt', 'klage_schlichtung'].includes((e as Unterbrechung).typ ?? '') && istISO((e as Unterbrechung).datum ?? '')) },
  verzichtAn: { p: 'va', typ: 'bool' },
  verzichtDatum: { p: 'vd', typ: 'str', gueltig: istISO },
  verzichtJahre: { p: 'vj', typ: 'str', gueltig: (v) => /^\d{1,2}$/.test(v) },
  verzichtBis: { p: 'vb', typ: 'str', gueltig: istISO },
};
