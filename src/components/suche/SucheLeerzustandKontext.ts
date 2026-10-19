import type { ZuletztEintrag } from '../../lib/zuletztVerwendet';
import { MERKLISTE_ANKER, type MerkEintrag } from '../../lib/merkliste';
import { suchOptionId } from './suchOptionId';
import { MEHR_TREFFER_ID, type FlacherTreffer } from './trefferAuswahl';

// ─── Nicht-Komponenten-Teil von SucheLeerzustand.tsx ────────────────────────
//
// Ausgelagert (react-refresh/only-export-components) — dieselbe Datei mischte
// Konstante/Helfer und die Komponente selbst, was Fast Refresh bricht. Muster
// wie `InhaltsKopfKontext.ts` neben `InhaltsKopf.tsx`: Verhalten byte-gleich,
// nur der Ort wechselt.
//
// ── D23 (6.9.2026) · die Konstante `EINSTIEGE` ist ersatzlos gefallen ────────
// Sie führte die fünf Übersichts-Routen als zweite Navigationsliste im
// Such-Panel — dieselben fünf, die seit D17 auf JEDER Route in der Seitenleiste
// stehen. Mit dem Block fällt die Tabelle (Rückbau statt Bewachung,
// §17-Gegengewicht); die flache Options-Liste ist damit exakt der Verlauf.

// Cowork-Befund 38 (21.8.2026): der Leerzustand rendere früher jede Zeile als
// echten `<Link>` — ein Tastatur-Nutzer, der per Tab ins Suchfeld gelangt,
// musste danach bis zu 9× Tab drücken (5 Verlauf- + 5 Einstieg-Zeilen), bis der
// Fokus das Suchfeld-Widget verliess (WCAG 2.1.2 nahe Tastaturfalle — erst Escape
// löste zuverlässig). Fix: dasselbe Listbox/Options-Muster wie SuchResultate.tsx
// (role=option, Pfeiltasten + Enter über die STEUERNDE Eingabe, Tab verlässt das
// Feld sofort). `leerOptionen` liefert die dazu passende flache Options-Liste —
// dieselben generischen Helfer (aktivePosition/naechsterKey/…, trefferAuswahl.ts)
// wie die Trefferliste, nur mit eigenem Gruppen-Namensraum («verlauf»).
//
// ── LESER-NAV (David 15.10.2026: Merkliste «Ja, in ⌘K zeigen») ───────────────
// Die gemerkten Stellen stehen im selben Leerzustand, ÜBER dem Verlauf (wie im
// Topbar-Flyout, `VerlaufUebersicht`: Merkliste zuerst). Im Panel höchstens
// `MERK_IM_PANEL` Zeilen (so viele wie der Verlauf, die Fläche ist eng — das
// Flyout zeigt 8); darüber folgt eine Option «Alle N auf der Startseite», dort
// führt `MerklisteFlaeche` die ganze Liste. Gruppen-Namensräume «merkliste» und
// «verlauf»: dieselbe Route in beiden Listen ergibt zwei verschiedene Options-IDs.
export const MERK_IM_PANEL = 5;
/** Ziel der Option «Alle N …»: die Merkliste-Fläche der Startseite (keine eigene Route). Mit Anker, damit der Sprung
 *  sie erreicht und nicht nur die Startseite (FB O-71): `ScrollZuHash` (App.tsx) scrollt, `MerklisteAnsicht` setzt den Fokus. */
export const MERK_ALLE_HREF = `/#${MERKLISTE_ANKER}`;

export function leerOptionen(verlauf: ZuletztEintrag[], listboxId: string, merkliste: readonly MerkEintrag[] = []): FlacherTreffer[] {
  return [
    ...merkliste.slice(0, MERK_IM_PANEL).map((e) => ({ oid: suchOptionId(listboxId, 'merkliste', e.route), href: e.route })),
    ...(merkliste.length > MERK_IM_PANEL ? [{ oid: suchOptionId(listboxId, 'merkliste', MEHR_TREFFER_ID), href: MERK_ALLE_HREF }] : []),
    ...verlauf.map((e) => ({ oid: suchOptionId(listboxId, 'verlauf', e.route), href: e.route })),
  ];
}
