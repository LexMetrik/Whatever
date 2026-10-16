/**
 * LESER-NAV O-32 · Reiter «Entscheide» (Posten «Entscheide-Folge»).
 *
 * (a) Histogramm mit roher Kantonwahl: bereits behoben (`wirksameKantone` je Artikel in
 *     `histogrammAusShard`, gemessen/geprüft 16.10.2026 — Test `bezug-zeitstrahl.test.tsx`
 *     «Kantonwahl wirkt je Artikel»); hier nur die Gegenprobe unten.
 * (b) Zeitstrahl bei Ladefehler: «noch keine Verteilung geladen» las sich wie «lädt noch».
 * (c) «2025, o. D.» am Chip trug keinen Tooltip (EntscheidZeile hat ihn seit B-?).
 * (d) Weiterzug-Muster verfehlte «BG …», «Bger …», das nackte Aktenzeichen u. a.
 *     (Messung im Kopf von `PanelEntscheideKontext.ts`).
 * (f) `PanelEntscheide.tsx` stand bei 419/420 Zeilen — die Fundstelle ist ausgelagert.
 *
 * NICHT hier (Frage an David, Gestaltung): «2 von 8» im Gruppenkopf (E5-B02).
 *
 * ROT ZU BEKOMMEN (§6.7, gefahren 16.10.2026): in `PanelEntscheideFundstelle` das `titel`
 * streichen ⇒ (c) rot; `ladefehler={fehler}` in `PanelEntscheide` streichen ⇒ (b) rot;
 * das Muster auf den Stand vom 15.10.2026 zurücksetzen ⇒ (d) rot.
 */
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { parseHTML } from 'linkedom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PanelEntscheide } from '../pages/gesetz-leser/v3/PanelEntscheide';
import { WEITERZUG_MUSTER } from '../pages/gesetz-leser/v3/PanelEntscheideKontext';
import { BezugZeitWahl } from '../components/verzahnung/BezugZeitWahl';
import { DATUM_UNBEKANNT_TITEL } from '../components/rechtsprechung/format';
import type { Bezug } from '../lib/rechtsprechung/bezuege';

const bezug = (p: Partial<Bezug> & Pick<Bezug, 'key' | 'zitierung'>): Bezug => ({
  gewicht: null, regesteKurz: null, datum: '2025-01-01',
  facetten: { quelltyp: 'rechtsprechung', ebene: 'kanton', kanton: 'BS', gericht: 'bs_appellationsgericht', status: 'kantonal' },
  ...p,
} as Bezug);

const basis = {
  aktArtikel: '5', revisionShard: null, normZitat: 'Art. 5 OR', artikelLabel: 'Art. 5', geladen: true,
  bestimmungsWort: 'Artikel' as const, klassen: ['kantonal'] as never, kantone: [] as never, kantoneVerfuegbar: [] as never,
  histogramm: { balken: [], ohneJahr: 0 }, bereich: { von: '', bis: '' },
  onKlassen: () => {}, onKantone: () => {}, onBereich: () => {},
};
const render = (kanten: Bezug[]) => renderToString(
  <MemoryRouter><PanelEntscheide {...basis} kanten={kanten} alleKanten={kanten} /></MemoryRouter>,
).replace(/<!-- -->/g, '');

describe('O-32 (c) · «o. D.»-Jahr am Chip trägt den Tooltip', () => {
  it('datumUnbekannt: Chip-Titel nennt die Zitierung und DATUM_UNBEKANNT_TITEL, das Jahr steht als «2025, o. D.»', () => {
    const t = render([bezug({ key: 'bs_x_VD.2025.9', zitierung: 'VD.2025.9', datumUnbekannt: true })]);
    expect(t).toContain('2025, o. D.');
    expect(t).toContain(`title="VD.2025.9 — ${DATUM_UNBEKANNT_TITEL}"`);
  });
  it('mit echtem Datum: kein solcher Titel', () => {
    const t = render([bezug({ key: 'bs_x_VD.2025.9', zitierung: 'VD.2025.9' })]);
    expect(t).not.toContain(DATUM_UNBEKANNT_TITEL);
    expect(t).toContain('01.01.2025');
  });
  it('trägt die Zitierung das Datum schon, steht keine zweite Datumsangabe und kein Titel dazu', () => {
    const t = render([bezug({ key: 'bs_x_a', zitierung: 'Appellationsgericht BS VD.2025.9 vom 04.04.2025', datum: '2025-04-04' })]);
    expect(t).not.toContain(DATUM_UNBEKANNT_TITEL);
  });
});

describe('O-32 (d) · Weiterzug-Zusatz in weiteren Schreibweisen', () => {
  const ja = [
    'Haft (BG 7B_1049/2023)',
    'Forderung (Bger 4D_114/2025 vom 30. Juni 2025)',
    'Haft (6B_927/2025)',
    'Haft (7B_985/2024 vom 06.12.2024)',
    'Haft (7B_959/2023, 7B_528/2024)',
    'Haft (Urteil des BGer 6B_427/2025 vom 02.06.2025)',
    'Haft (Urteildispositiv BGer 4A_70/2022 vom 7. Oktober 2022)',
    'Haft (Entscheid BGer vom 7. Juli 2025…',
    'Haft (Urteil des Bundesgerichts vom…',
  ];
  const nein = [
    'Rente (Beschwerde beim BG hängig)',
    'Rente (Beschwerde am BGer hängig)',
    'Haft (aufgehoben durch BGer 9C_1/2024 vom 17. September 2024; neuer Entscheid …)',
    'Haft (BGE 147 III …',
    'Haft (publizierter Entscheid: BGE 147 II 99)',
    'Mietstreit (BG-Praxis uneinheitlich)',
    'Entscheid (6 Monate Frist) nach 7B_1',
  ];
  it.each(ja)('erkennt «%s»', (z) => { expect(WEITERZUG_MUSTER.test(z)).toBe(true); });
  it.each(nein)('erkennt «%s» NICHT', (z) => { expect(WEITERZUG_MUSTER.test(z)).toBe(false); });
});

describe('O-32 (b) · Zeitstrahl sagt den Ladefehler', () => {
  const leer = { balken: [], ohneJahr: 0 };
  const zeit = (extra: object) => renderToString(
    createElement(BezugZeitWahl, { bereich: { von: '', bis: '' }, histogramm: leer, onBereich: () => {}, ...extra }),
  );
  it('ohne Fehler: der bisherige Satz bleibt', () => {
    expect(zeit({})).toContain('noch keine Verteilung geladen');
  });
  it('mit Ladefehler: «konnte nicht geladen werden», nicht «noch keine Verteilung»', () => {
    const t = zeit({ ladefehler: true });
    expect(t).toContain('Die Verteilung konnte nicht geladen werden.');
    expect(t).not.toContain('noch keine Verteilung geladen');
  });
  it('alle Instanzen abgewählt geht vor (der Fehler ist dann nicht das Naheliegende)', () => {
    expect(zeit({ ladefehler: true, keineInstanz: true })).toContain('Alle Instanzen sind abgewählt');
  });
});

// Verdrahtung: das Panel reicht `fehler` bis in den aufgeklappten Zeitstrahl.
let root: Root | null = null;
afterEach(async () => {
  if (root) { const r = root; root = null; await act(async () => r.unmount()); }
  vi.unstubAllGlobals();
});

describe('O-32 (b) · PanelEntscheide reicht den Ladefehler an den Zeitstrahl', () => {
  async function zeitraumText(fehler: boolean): Promise<string> {
    const { document, window, Event: Ev } = parseHTML('<!doctype html><html><body><div id="app"></div></body></html>');
    vi.stubGlobal('window', Object.assign(window, { setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout }));
    vi.stubGlobal('document', document);
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    const ziel = document.getElementById('app') as unknown as HTMLElement;
    root = createRoot(ziel);
    await act(async () => {
      root!.render(createElement(MemoryRouter, null, createElement(PanelEntscheide, { ...basis, geladen: false, fehler })));
    });
    const zeitKnopf = [...ziel.querySelectorAll('[data-v3-panel-klappe]')].find((b) => /Zeitraum/.test(b.textContent ?? ''));
    expect(zeitKnopf, 'Knopf «Zeitraum»').toBeTruthy();
    await act(async () => { zeitKnopf!.dispatchEvent(new (Ev as unknown as typeof Event)('click', { bubbles: true })); });
    return (ziel.textContent ?? '').replace(/\s+/g, ' ');
  }
  it('fehler=true: der aufgeklappte Zeitraum sagt «konnte nicht geladen werden»', async () => {
    expect(await zeitraumText(true)).toContain('Die Verteilung konnte nicht geladen werden.');
  });
  it('fehler=false (lädt noch): der bisherige Satz', async () => {
    expect(await zeitraumText(false)).toContain('noch keine Verteilung geladen');
  });
});
