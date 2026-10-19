// ─── Gattung eines Registereintrags: Materialien ODER Erläuterungen ──────────
//
// Hausbegriffe (Entscheid David 23.9.2026, S6 · AN-11; Herleitung im Kopf von
// `PANEL_REITER`, `pages/gesetz-leser/v3/panelModell.ts`): «Materialien» ist
// NUR Gesetzgebung — Botschaften des Bundesrates, Vernehmlassungen, kantonale
// Parlamentsgeschäfte —, «Erläuterungen» die Verwaltungspraxis ohne
// Gesetzesrang (Kreisschreiben, Wegleitungen, Leitfäden, Merkblätter …).
//
// EINE Zuordnung (§5). Der Leser verteilt die Register-Einträge nach Doktyp auf
// seine zwei Reiter: der Reiter «Materialien» liest genau `botschaft`
// (`./botschaften.ts`), `vernehmlassung` (`./vernehmlassungen.ts`) und die
// kantonale Gesetzgebung (`./ratschlaege.ts`, Menge unten — hierher VERSCHOBEN,
// nicht kopiert, 24.9.2026). Alles andere ist Verwaltungspraxis. Die Startseite
// (Kachel, Zähler, Blatt-Schalter) fragt diese Funktion, nie eine eigene Regel.
// David 24.9.2026: «materialien soll erläuterungen und materialien enthalten».
//
// Reine Taxonomie (§3), keine Rechtslogik, kein Netz.

import type { DoktypId } from './typen';

export type Gattung = 'materialien' | 'erlaeuterungen';

/** Die Dokumenttypen der kantonalen Gesetzgebung — Vorlagen und Berichte an das
 *  Parlament, also das kantonale Gegenstück zur Botschaft des Bundesrates.
 *  (Wortlaut aus `./ratschlaege.ts`, S6 · M-3/B-4; Menge um `gr-ausgabenbericht` ergänzt, O-73.) */
export const KANTONALE_GESETZGEBUNG: ReadonlySet<DoktypId> = new Set<DoktypId>(['ratschlag', 'gr-bericht', 'gr-ausgabenbericht', 'gr-initiative']);
// LESER-NAV O-73 (16.10.2026): `gr-ausgabenbericht` ergänzt. Die BS-Grundmenge
// (`scripts/materialien/bs-materialien.ts`, `GESCHAEFTSARTEN`) nennt Ratschlag, Bericht und
// Ausgabenbericht als «die Geschäftsarten, die überhaupt Materialien sind»; `verfahren.ts` führt
// den Ausgabenbericht in derselben Verfahrensklasse (1010) wie den Ratschlag. Ohne ihn landete ein
// künftiger Ausgabenbericht (heute 0 Einträge) als Behördenpublikation in «Erläuterungen».

/** Alle Doktypen, die der Leser-Reiter «Materialien» zeigt. */
const GESETZGEBUNG_DOKTYPEN: ReadonlySet<DoktypId> = new Set<DoktypId>([
  'botschaft', 'vernehmlassung', ...KANTONALE_GESETZGEBUNG,
]);

/** Gattung eines Dokumenttyps: Gesetzgebung → «materialien», sonst «erlaeuterungen». */
export function gattungVon(doktyp: DoktypId): Gattung {
  return GESETZGEBUNG_DOKTYPEN.has(doktyp) ? 'materialien' : 'erlaeuterungen';
}

/** Doktypen, die ihrer Art nach Verwaltungsverordnungen im engeren Sinn sind
 *  (generell-abstrakte Dienstanweisung an die nachgeordneten Behörden): sie
 *  binden die Verwaltung intern, die Gerichte nicht. Dazu zählen auch die
 *  MWST-Infos, MWST-Branchen-Infos und Richtlinien: BVGer
 *  A-6108/2014 vom 22.7.2015 E. 2 («Verwaltungsverordnungen, darunter fallen
 *  auch Branchen- und Spezialbroschüren der ESTV», entscheidsuche.ch,
 *  CH_BVGE_001_A-6108-2014_2015-07-22); BGE 142 V 442 E. 5.2 (Gerichte nicht
 *  gebunden, Berücksichtigung soweit überzeugend). Merkblätter sind AUSGENOMMEN
 *  (Entscheid Gegenprüfung #1405, M1): das Register führt 8 EDÖB, 2 SECO und 1 ESTV;
 *  der EDÖB übt sein Amt weisungsunabhängig aus (Art. 43 Abs. 4 DSG), seine Merkblätter
 *  sind Information an Private, die SECO-Merkblätter ebenso — «binden die Verwaltung
 *  intern» wäre dort irreführend. Neutral bleiben Berichte
 *  (Tätigkeitsbericht, gr-bericht …), Information (Mitteilung — das Register
 *  führt neben zwei EHRA-Praxismitteilungen auch eine ESTV-Mitteilung mit
 *  Checkliste, nicht durchweg Weisungen), Leitfaden, Anleitung und Checkliste:
 *  der Hinweis behauptet dort nur, was für jede Behördenpublikation gilt
 *  (LESER-NAV O-05). */
const VERWALTUNGSVERORDNUNG: ReadonlySet<DoktypId> = new Set<DoktypId>([
  'kreisschreiben', 'ks-anhang', 'weisung', 'rundschreiben', 'wegleitung',
  'mwst-info', 'mwst-branchen-info', 'richtlinie',
]);

export function istVerwaltungsverordnung(doktyp: DoktypId): boolean {
  return VERWALTUNGSVERORDNUNG.has(doktyp);
}

/** Rang-Etikett je Gattung — EINE Quelle für den Hinweis der Einzelseite
 *  (`components/materialien/GattungsHinweis`), die SEO-Beschreibung und das
 *  Crawler-HTML (`lib/seo-detail`), §5. Anlass: Gegenprüfung REST S5c
 *  (25.9.2026) fand dort noch «Amtliche Ressource (Soft-Law, kein
 *  Gesetzesrang)» auch für Botschaften — dieselbe Doppel-Wahrheit, die der
 *  Gattungs-Hinweis auf der Seite behoben hatte. */
export const GATTUNG_RANG: Record<Gattung, string> = {
  materialien: 'Gesetzgebungsmaterial, kein Gesetzesrang',
  erlaeuterungen: 'Behördenpublikation, kein Gesetzesrang',
};

/** Anzeige-Beschriftung je Gattung (Startseite-Schalter, Trefferzeile). */
export const GATTUNG_LABEL: Record<Gattung, string> = {
  materialien: 'Materialien',
  erlaeuterungen: 'Erläuterungen',
};
