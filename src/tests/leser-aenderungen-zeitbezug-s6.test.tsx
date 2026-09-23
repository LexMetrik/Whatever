/**
 * W2·29-WERKBANK-LESER S6 · Befund AE-1 (Prüfer Opus, 23.9.2026): der Reiter
 * «Änderungen» wies KÜNFTIGE Änderungen als geltend aus («In Kraft, im
 * gepinnten Normtext aber noch nicht eingearbeitet»). Gemessen am 23.9.2026
 * über die 227 Revisions-Sidecars mit Stichtag `currency.geprueftAm`
 * 2026-09-21: 109 Zeilen tragen `nichtKonsolidiert`, davon 105 mit
 * `dateEntryInForce` NACH dem Stichtag (künftig) und 4 davor (in Kraft, nicht
 * eingearbeitet) — Kommando im PR-Text.
 *
 * Geprüft wird die AUSSAGE je Datenlage: künftig · in Kraft nicht
 * eingearbeitet · normal · kein Stichtag, samt Grenzfall Stichtag =
 * Inkrafttreten, und die zwei Renderer, die sie zeigen.
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { aenderungZeitbezug } from '../pages/gesetz-leser/zukunftsfassungen';
import { PanelAenderungen } from '../pages/gesetz-leser/v3/PanelAenderungen';
import { RevisionenGruppe } from '../components/kontext/RevisionenGruppe';
import type { RevisionBezug } from '../lib/normtext/revisionen';

const STICHTAG = '2026-09-21';

function rev(p: Partial<RevisionBezug>): RevisionBezug {
  return {
    art: 'aenderung', dateEntryInForce: '2024-01-01',
    ocUri: `https://fedlex.data.admin.ch/eli/oc/${p.dateEntryInForce ?? 'x'}`,
    titelDe: 'Änderung', quelleUrl: 'https://www.fedlex.admin.ch/eli/oc/2024/1/de',
    ...p,
  };
}

const KUENFTIG = rev({ dateEntryInForce: '2027-07-01', nichtKonsolidiert: true, roFundstelle: 'AS 2026 433', titelDe: 'Künftige Änderung' });
const OFFEN = rev({ dateEntryInForce: '2026-07-01', nichtKonsolidiert: true, roFundstelle: 'AS 2026 100', titelDe: 'Geltende, nicht eingearbeitete Änderung' });
const NORMAL = rev({ dateEntryInForce: '2025-01-01', titelDe: 'Eingearbeitete Änderung' });

describe('aenderungZeitbezug — reine Klassifikation (§2, Stichtag aus den Daten)', () => {
  it('künftig: nichtKonsolidiert und Inkrafttreten NACH dem Stichtag', () => {
    expect(aenderungZeitbezug(KUENFTIG, STICHTAG)).toBe('kuenftig');
  });
  it('in Kraft, nicht eingearbeitet: nichtKonsolidiert und Inkrafttreten VOR dem Stichtag', () => {
    expect(aenderungZeitbezug(OFFEN, STICHTAG)).toBe('inKraftOffen');
  });
  it('Grenzfall Stichtag = Inkrafttreten → in Kraft (am Stichtag galt sie schon), wie fruehestesInKraft/zukunftsHinweis', () => {
    expect(aenderungZeitbezug(rev({ dateEntryInForce: STICHTAG, nichtKonsolidiert: true }), STICHTAG)).toBe('inKraftOffen');
    expect(aenderungZeitbezug(rev({ dateEntryInForce: '2026-09-22', nichtKonsolidiert: true }), STICHTAG)).toBe('kuenftig');
  });
  it('normal: ohne Marker und nicht nach dem Stichtag', () => {
    expect(aenderungZeitbezug(NORMAL, STICHTAG)).toBe('normal');
  });
  it('ohne Marker, aber Inkrafttreten nach dem Stichtag → trotzdem künftig (nie «geltend» behaupten)', () => {
    expect(aenderungZeitbezug(rev({ dateEntryInForce: '2030-01-01' }), STICHTAG)).toBe('kuenftig');
  });
  it('kein Stichtag: Marker ohne Bezugstag → unbestimmt (keine Aussage «in Kraft»), ohne Marker → normal', () => {
    expect(aenderungZeitbezug(KUENFTIG, null)).toBe('unbestimmt');
    expect(aenderungZeitbezug(OFFEN, undefined)).toBe('unbestimmt');
    expect(aenderungZeitbezug(NORMAL, null)).toBe('normal');
  });
  it('kein ISO-Datum trägt keinen Zeitbezug → unbestimmt bzw. normal', () => {
    expect(aenderungZeitbezug(rev({ dateEntryInForce: '2027', nichtKonsolidiert: true }), STICHTAG)).toBe('unbestimmt');
    expect(aenderungZeitbezug(rev({ dateEntryInForce: '' }), STICHTAG)).toBe('normal');
  });
});

function panel(revisionen: RevisionBezug[], stichtag: string | null) {
  return renderToString(
    <PanelAenderungen stand={{ fertig: true, wert: { revisionen, reichweite: null } }}
      quelleUrl="https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de" stichtag={stichtag} />,
  );
}

describe('PanelAenderungen (Reiter «Änderungen») — Befund AE-1', () => {
  it('künftige Änderung steht in eigener Gruppe und heisst «tritt am … in Kraft», nie «In Kraft»', () => {
    const html = panel([KUENFTIG, OFFEN, NORMAL], STICHTAG);
    expect(html).toContain('data-v3-panel-aenderungen-kuenftig');
    expect(html).toContain('tritt am 01.07.2027 in Kraft');
    expect(html).not.toMatch(/title="In Kraft, im gepinnten Normtext/);
    // Die Gruppe nennt ihren Bezugstag (§8: die Aussage gilt ab dem Abgleich).
    expect(html).toContain('21.09.2026');
    // Die künftige Zeile steht NICHT in der Liste der übrigen Änderungen.
    const kuenftigGruppe = html.slice(html.indexOf('data-v3-panel-aenderungen-kuenftig'), html.indexOf('data-v3-panel-aenderungen-uebrige'));
    expect(kuenftigGruppe).toContain('AS 2026 433');
    expect(kuenftigGruppe).not.toContain('AS 2026 100');
  });
  it('in Kraft, nicht eingearbeitet: «in Kraft seit …, im hier gezeigten Text noch nicht eingearbeitet»', () => {
    const html = panel([OFFEN, NORMAL], STICHTAG);
    expect(html).toContain('in Kraft seit 01.07.2026, im hier gezeigten Text noch nicht eingearbeitet');
    expect(html).not.toContain('data-v3-panel-aenderungen-kuenftig');
  });
  it('ohne Stichtag keine Behauptung «in Kraft»', () => {
    const html = panel([KUENFTIG], null);
    expect(html).not.toMatch(/in Kraft/i);
    expect(html).toContain('im hier gezeigten Text noch nicht eingearbeitet');
  });
});

describe('RevisionenGruppe (Ist-Kontext-Panel) — derselbe Fehltext', () => {
  function gruppe(revAenderungen: RevisionBezug[], stichtag: string | null) {
    return renderToString(
      <RevisionenGruppe revFehler={false} revAenderungen={revAenderungen} revMarker={[]}
        botschaftNachKey={new Map()} locale="de" stichtag={stichtag} />,
    );
  }
  it('künftige Änderung: «Tritt am … in Kraft», nicht «In Kraft, aber noch nicht … konsolidiert»', () => {
    const html = gruppe([KUENFTIG], STICHTAG);
    expect(html).toContain('Tritt am 01.07.2027 in Kraft');
    expect(html).not.toContain('In Kraft, aber noch nicht');
  });
  it('geltend, nicht eingearbeitet: «In Kraft seit …, im hier gezeigten Text noch nicht eingearbeitet»', () => {
    const html = gruppe([OFFEN], STICHTAG);
    expect(html).toContain('In Kraft seit 01.07.2026, im hier gezeigten Text noch nicht eingearbeitet');
  });
});
