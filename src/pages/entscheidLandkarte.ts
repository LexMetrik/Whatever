import { ABSCHNITT_TITEL, abschnittAnker, gruppiereErwaegungen } from '../lib/rechtsprechung/abschnitte';
import type { EntscheidAbschnitt } from '../lib/rechtsprechung/typen';
import type { LandkarteEinheit } from '../components/leser/landkarteModell';

// ─── W2·28 · Entscheid-Daten → Bausteine der Treffer-Landkarte ───────────────
//
// Reine Projektion (§2/§3), Schwester von `gesetz-leser/v3/landkarteGesetz.ts`.
// Sie läuft über die Abschnitte der SICHTBAREN Fassung in Dokument-Reihenfolge
// und macht aus jedem Block einen Baustein.
//
// ── EINE ANKER-WAHRHEIT (§5) ────────────────────────────────────────────────
// Die Erwägungs-Anker kommen aus `gruppiereErwaegungen` — derselben Funktion,
// die der Lesetext (`EntscheidBody`), die Trefferliste des Rails
// (`trefferInErwaegungen`) und der Pin-Cite-Sprung benutzen. Eine eigene
// Ankerbildung hier wäre eine zweite Wahrheit und träfe die Ziele daneben.
//
// ── WAS KEIN SPRUNGZIEL IST, TRÄGT KEINES (§8) ──────────────────────────────
// Sachverhalt und Dispositiv haben keine block-genauen Anker; ihre Bausteine
// tragen darum den ABSCHNITTS-Anker («abschnitt-sachverhalt»), der im Lesetext
// existiert und den schon die Sprungleiste benutzt. Markenlose Erwägungen
// (unplausible/kantonale Daten) haben auch den nicht — sie bilden Massstab,
// aber kein Ziel (leere `id`). Erfunden wird nichts.
//
// ── SPRUNGZIEL ≠ LESEPOSITION (Fertigbau 21.9.2026, §5) ─────────────────────
// Die Erwägungs-Bausteine tragen ZWEI Anker, und beide kommen aus bestehenden
// Quellen — keiner ist neu erfunden:
//  · `id` = der Erwägungs-Anker aus `gruppiereErwaegungen` («e-4-4»). Nur er
//    springt an die Erwägung; ein Sprung auf den Abschnittskopf wäre in einem
//    80-Erwägungen-Urteil kein Treffer, sondern ein Themawechsel.
//  · `leseId` = `abschnitt-erwaegung`, derselbe Anker, den der Lesetext für die
//    Sprungleiste setzt. Der Scroll-Spy des Lesers meldet ausschliesslich
//    Anker dieser Form; ohne dieses zweite Feld fand die Leseposition im
//    ganzen Erwägungsteil kein Feld und blieb unsichtbar (gemessener Defekt).
// Sachverhalt und Dispositiv brauchen es nicht: dort IST der Abschnitts-Anker
// schon das Sprungziel, und `bereichZuId` fällt auf `id` zurück.

export function entscheidLandkarteEinheiten(abschnitte: EntscheidAbschnitt[]): LandkarteEinheit[] {
  const einheiten: LandkarteEinheit[] = [];
  for (const a of abschnitte) {
    const etikett = ABSCHNITT_TITEL[a.typ];
    if (a.typ !== 'erwaegung') {
      for (const b of a.bloecke) {
        einheiten.push({ id: abschnittAnker(a.typ), label: etikett, umfang: b.text.length, abschnitt: etikett });
      }
      continue;
    }
    // Erwägungen: Kopf vor seinen Unter-Erwägungen, exakt die Reihenfolge und
    // die Anker, die auch die Trefferliste vergibt.
    const leseId = abschnittAnker('erwaegung');
    for (const g of gruppiereErwaegungen(a.bloecke)) {
      // `marke` trägt die amtliche Schreibweise samt «E.» («E. 2.3.1») — genau
      // die, die der Rail in seiner Trefferliste zeigt. Kein zweites Formatieren.
      if (g.kopf) {
        einheiten.push({
          id: g.kopfAnker,
          leseId,
          label: g.kopf.marke ?? etikett,
          umfang: g.kopf.text.length,
          abschnitt: etikett,
        });
      }
      for (const s of g.subs) {
        einheiten.push({
          id: s.anker,
          leseId,
          label: s.block.marke ?? etikett,
          umfang: s.block.text.length,
          abschnitt: etikett,
        });
      }
    }
  }
  return einheiten;
}
