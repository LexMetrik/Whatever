/**
 * W2·17-UI-BEFUNDE — Regel K (David 26.6.2026): selbst Zugeklapptes bleibt zu,
 * auch nach dem Ende der «alles zu»-Sperre. Befund der Gegenprüfung (OR): nach
 * «alles zu» Pfeil auf/zu an der «Zweiten Abteilung», weiter zu Art. 700, zurück
 * zu Art. 300 — der Spy öffnete den selbst geschlossenen Ast wieder, weil die
 * Aufhebung der Sperre ALLE ihre Ids aus `manuellZu` nahm.
 *
 * Gespielt wird die Folge mit den echten Übergangsfunktionen (Buchhaltung wie
 * `tocToggleGruppe` sie führt: `merkeKlappAstManuell`, dann Sperre, dann
 * `pruefeAlleZuSperre` beim Wechsel des aktiven Pfads).
 */
import { describe, it, expect } from 'vitest';
import {
  merkeKlappAstManuell, pruefeAlleZuSperre, darfAutoAdoptieren, type AstBuchhaltung, type AlleZuSperre,
} from '../pages/gesetz-leser/sprungAst';

function buch(): AstBuchhaltung {
  return { autoOffen: new Set(), autoTick: new Map(), manuellOffen: new Set(), manuellZu: new Set() };
}

describe('Regel K — selbst Zugeklapptes bleibt nach der Aufhebung der «alles zu»-Sperre zu', () => {
  const alle = ['sek-1', 'sek-2', 'sek-3', 'sek-9']; // dieselbe Referenz wie in `tocToggleGruppe`
  /** Wie `tocToggleGruppe(ids, istOffen, alleZu)`: Sperre setzen, dann verbuchen. */
  function alleZu(b: AstBuchhaltung, pfad: string[]): AlleZuSperre {
    const sperre = { pfad, ids: alle };
    merkeKlappAstManuell(alle, false, b);
    return sperre;
  }

  it('Prüfer-Folge: alles zu → Pfeil auf → Pfeil zu → anderer Abschnitt: sek-2 bleibt in manuellZu', () => {
    const b = buch();
    const sperre = alleZu(b, ['sek-1', 'sek-2']);
    merkeKlappAstManuell(['sek-2'], true, b);  // Nutzer öffnet …
    merkeKlappAstManuell(['sek-2'], false, b); // … und schliesst selbst wieder
    expect(pruefeAlleZuSperre(sperre, ['sek-7'], b.manuellZu)).toBeNull();
    // vorher: alle vier Ids weg — der Spy durfte sek-2 beim Zurückkehren wieder aufreissen.
    expect(darfAutoAdoptieren('sek-2', b), 'selbst geschlossen: der Spy darf nicht adoptieren').toBe(false);
    expect([...b.manuellZu]).toEqual(['sek-2']);
  });

  it('von der Sperre allein gehaltene Ids werden freigegeben (B1-B04 bleibt)', () => {
    const b = buch();
    const sperre = alleZu(b, ['sek-1', 'sek-2']);
    merkeKlappAstManuell(['sek-2'], true, b);
    merkeKlappAstManuell(['sek-2'], false, b);
    pruefeAlleZuSperre(sperre, ['sek-7'], b.manuellZu);
    for (const id of ['sek-1', 'sek-3', 'sek-9']) expect(darfAutoAdoptieren(id, b), id).toBe(true);
  });

  it('selbst geöffnet und offen gelassen: kein manuellZu-Eintrag, nichts zu retten', () => {
    const b = buch();
    const sperre = alleZu(b, ['sek-1']);
    merkeKlappAstManuell(['sek-3'], true, b);
    pruefeAlleZuSperre(sperre, ['sek-7'], b.manuellZu);
    expect(b.manuellZu.has('sek-3')).toBe(false);
    expect(b.manuellOffen.has('sek-3')).toBe(true);
  });

  it('zweites «alles zu» nach dem Selbst-Zu: die neue Sperre gewinnt, sie hält wieder ALLE Ids', () => {
    const b = buch();
    alleZu(b, ['sek-1']);
    merkeKlappAstManuell(['sek-2'], false, b); // Selbst-Zu
    const zweite = alleZu(b, ['sek-1']);        // erneut «alles zu»: jetzt wieder die Sperre zuständig
    pruefeAlleZuSperre(zweite, ['sek-7'], b.manuellZu);
    expect(darfAutoAdoptieren('sek-2', b)).toBe(true);
  });
});
