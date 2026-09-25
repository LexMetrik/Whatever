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
 *  (Wortlaut und Menge unverändert aus `./ratschlaege.ts`, S6 · M-3/B-4.) */
export const KANTONALE_GESETZGEBUNG: ReadonlySet<DoktypId> = new Set<DoktypId>(['ratschlag', 'gr-bericht', 'gr-initiative']);

/** Alle Doktypen, die der Leser-Reiter «Materialien» zeigt. */
const GESETZGEBUNG_DOKTYPEN: ReadonlySet<DoktypId> = new Set<DoktypId>([
  'botschaft', 'vernehmlassung', ...KANTONALE_GESETZGEBUNG,
]);

/** Gattung eines Dokumenttyps: Gesetzgebung → «materialien», sonst «erlaeuterungen». */
export function gattungVon(doktyp: DoktypId): Gattung {
  return GESETZGEBUNG_DOKTYPEN.has(doktyp) ? 'materialien' : 'erlaeuterungen';
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
