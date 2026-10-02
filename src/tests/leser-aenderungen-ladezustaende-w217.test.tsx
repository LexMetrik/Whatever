/**
 * W2·17-UI-BEFUNDE · Reiter «Änderungen» (1.10.2026): PE-F4-B01, PA-13-B03, PA-7-B02.
 *
 *  · PE-F4-B01  der Ladefehler hat einen Weg zurück: «Erneut laden» (`stand.erneut`).
 *  · PA-13-B03  «für diesen Erlass nicht erfasst» (Revisions-Datei fehlt) ist keine
 *               Fehlermeldung; die Fehlermeldung nennt nur dann eine Quelle, wenn eine
 *               passende bekannt ist (die des Erlasses, nicht fest Fedlex).
 *  · PA-7-B02   die Aufhebung des ganzen Erlasses nennt ihr Datum — und sagt «künftig»,
 *               wenn sie nach dem Bezugstag liegt (PATV: 01.01.2027).
 *
 * ROT ZU BEKOMMEN (§6.7): `PanelAenderungen.tsx` auf den Stand vor dem Fix (der `wert === null`-
 * Zweig mit «Kein Änderungsverlauf verfügbar», die Aufhebungs-Zeile ohne Datum).
 */
import { describe, expect, it } from 'vitest';
import { renderToString as rohRender } from 'react-dom/server';
import type { ReactElement } from 'react';
import { PanelAenderungen } from '../pages/gesetz-leser/v3/PanelAenderungen';
import { aufhebungsSatz, type RevisionZeile } from '../pages/gesetz-leser/v3/aenderungModell';
import type { RevisionAnsicht, RevisionBezug } from '../lib/normtext/revisionen';

const renderToString = (el: ReactElement) => rohRender(el).replace(/<!-- -->/g, '');

function rev(p: Partial<RevisionBezug>): RevisionBezug {
  return { art: 'aenderung', dateEntryInForce: '2020-01-01', titelDe: 'Änderung', quelleUrl: 'https://www.fedlex.admin.ch/eli/oc/2020/1/de', ...p };
}
const QUELLE = 'https://eur-lex.europa.eu/eli/reg/2016/679/oj';

describe('PE-F4-B01 · der Ladefehler hat einen Erneut-Weg', () => {
  const fehler = (erneut?: () => void) => renderToString(
    <PanelAenderungen stand={{ fertig: true, wert: null, erneut }} quelleUrl={QUELLE} stichtag={null} ebene="bund" />);
  it('Fehler am Bund: Satz «konnte nicht geladen werden» + Knopf «Erneut laden»', () => {
    const html = fehler(() => undefined);
    expect(html).toContain('Änderungsverlauf konnte nicht geladen werden');
    expect(html).toContain('data-abruf-erneut');
    expect(html).toContain('Erneut laden');
    expect(html).toContain('data-v3-panel-reiter-inhalt="aenderungen"');
  });
  it('ohne Erneut-Griff (reine Anzeige) kein Knopf', () => {
    expect(fehler()).not.toContain('data-abruf-erneut');
  });
  it('der Quell-Link ist die Quelle DES ERLASSES, nicht fest Fedlex', () => {
    const html = fehler();
    expect(html).toContain(`href="${QUELLE}"`);
    expect(html).not.toContain('www.fedlex.admin.ch');
  });
  it('ohne bekannte Quelle: Satz ohne Link statt falschem Ziel', () => {
    const html = renderToString(<PanelAenderungen stand={{ fertig: true, wert: null }} quelleUrl="" stichtag={null} ebene="bund" />);
    expect(html).toContain('Änderungsverlauf konnte nicht geladen werden.');
    expect(html).not.toContain('<a ');
  });
});

describe('PA-13-B03 · «nicht erfasst» ist keine Fehlermeldung', () => {
  const nichtErfasst = (ebene: 'bund' | 'kanton', quelleUrl = QUELLE) => {
    const wert: RevisionAnsicht = { revisionen: [], reichweite: null, nichtErfasst: true };
    return renderToString(<PanelAenderungen stand={{ fertig: true, wert }} quelleUrl={quelleUrl} stichtag={null} ebene={ebene} />);
  };
  it('Erlass ohne Revisions-Datei (z. B. EU-Verordnung): «nicht erfasst», kein «konnte nicht geladen»', () => {
    const html = nichtErfasst('bund');
    expect(html).toContain('Für diesen Erlass ist kein Änderungsverlauf erfasst');
    expect(html).not.toContain('konnte nicht geladen');
    expect(html).not.toContain('nicht erreichbar');
    expect(html).not.toContain('data-abruf-erneut');
    expect(html).toContain(`href="${QUELLE}"`);
  });
  it('Kanton ohne Revisions-Datei: der Kanton-Satz bleibt (W3-4/AE-9)', () => {
    const html = nichtErfasst('kanton', 'https://x');
    expect(html).toContain('für kantonale Erlasse bisher nicht erfasst');
    expect(html).toContain('data-v3-panel-abdeckung="kanton"');
  });
  it('eine echte Datei mit leerer Liste sagt weiter «keine Änderung erfasst»', () => {
    const html = renderToString(<PanelAenderungen stand={{ fertig: true, wert: { revisionen: [], reichweite: null } }} quelleUrl={QUELLE} stichtag={null} />);
    expect(html).toContain('Für diesen Erlass ist keine Änderung erfasst.');
    expect(html).not.toContain('kein Änderungsverlauf erfasst');
  });
});

describe('PA-7-B02 · die Aufhebung des Erlasses nennt ihr Datum', () => {
  const AUFHEBUNG: RevisionZeile = { ...rev({ dateEntryInForce: '2027-01-01', nichtKonsolidiert: true, roFundstelle: 'AS 2026 291' }), wirkungen: ['vollstaendige-aufhebung'] };
  const mit = (extra: Partial<Parameters<typeof PanelAenderungen>[0]>, abgerufen?: string) => renderToString(
    <PanelAenderungen stand={{ fertig: true, wert: { revisionen: [AUFHEBUNG], reichweite: null, abgerufen } }} quelleUrl={QUELLE} stichtag={null} {...extra} />);

  it('aufhebungsSatz: nach dem Bezugstag = künftig, am/vor dem Bezugstag = in Kraft, ohne Tag nur das Datum', () => {
    expect(aufhebungsSatz('2027-01-01', '2026-09-23')).toEqual({ label: 'Hebt diesen Erlass künftig auf', datum: 'tritt am 01.01.2027 in Kraft' });
    expect(aufhebungsSatz('2026-03-01', '2026-09-23')).toEqual({ label: 'Hebt diesen Erlass auf', datum: 'in Kraft seit 01.03.2026' });
    expect(aufhebungsSatz('2026-09-23', '2026-09-23').datum).toBe('in Kraft seit 23.09.2026'); // Grenzfall: am Tag selbst = in Kraft
    expect(aufhebungsSatz('2027-01-01', null)).toEqual({ label: 'Hebt diesen Erlass auf', datum: 'Inkrafttreten 01.01.2027' });
    expect(aufhebungsSatz('2027-01-01', '2026-9-23').datum).toBe('Inkrafttreten 01.01.2027'); // Nicht-ISO-Bezugstag = keine Aussage
  });
  it('PATV (kein currency): Bezugstag ist der Abruf des Verlaufs → «künftig» und «01.01.2027»', () => {
    const html = mit({}, '2026-09-23');
    expect(html).toContain('Hebt diesen Erlass künftig auf');
    expect(html).toContain('tritt am 01.01.2027 in Kraft');
    expect(html).not.toContain('Hebt diesen Erlass auf');
  });
  it('mit currency-Stichtag gilt dieser (Vorrang vor dem Abrufdatum)', () => {
    const html = mit({ stichtag: '2027-02-01' }, '2026-09-23');
    expect(html).toContain('Hebt diesen Erlass auf');
    expect(html).toContain('in Kraft seit 01.01.2027');
    expect(html).not.toContain('künftig');
  });
  it('ohne jeden Bezugstag: das Datum steht, aber kein «künftig» und kein «in Kraft seit» (§8, nichts behaupten)', () => {
    const html = mit({});
    expect(html).toContain('Hebt diesen Erlass auf');
    expect(html).toContain('Inkrafttreten 01.01.2027');
    expect(html).not.toContain('künftig');
  });
  it('die gewöhnlichen Änderungszeilen bleiben unberührt (Zeitbezug wie bisher)', () => {
    const html = renderToString(<PanelAenderungen stand={{ fertig: true, wert: { revisionen: [rev({ dateEntryInForce: '2024-01-01' })], reichweite: null, abgerufen: '2026-09-23' } }}
      quelleUrl={QUELLE} stichtag={null} />);
    expect(html).toContain('in Kraft seit 01.01.2024');
  });
});
